import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { writeAuditEvent } from "@/lib/audit";
import { executeAgentObjective } from "@/lib/agent-executor";
import { getRuntimeEnv } from "@/lib/runtime-env";

type QueueItem = {
  id: string;
  agent_run_id: string;
  agent_key: string;
  objective: string;
  attempt_count: number;
  max_attempts: number;
};

export async function POST(request: NextRequest) {
  const secret = await getRuntimeEnv("AGENT_QUEUE_SECRET");
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized queue dispatcher." }, { status: 401 });
  }

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });

  const now = new Date();
  const nowIso = now.toISOString();
  const leaseUntil = new Date(now.getTime() + 90_000).toISOString();

  try {
    // A worker may die on its final permitted attempt. Close that expired lease
    // instead of allowing another claim to exceed max_attempts.
    await db.prepare(
      "UPDATE agent_runs SET status = 'failed', error_code = 'QUEUE_LEASE_EXPIRED', output_summary = 'Worker lease expired on the final attempt.', finished_at = ? WHERE id IN (SELECT agent_run_id FROM agent_queue WHERE status = 'running' AND locked_until <= ? AND attempt_count >= max_attempts)"
    ).bind(nowIso, nowIso).run();
    await db.prepare(
      "UPDATE agent_queue SET status = 'failed', locked_until = NULL, last_error = 'Worker lease expired on the final attempt.', updated_at = ? WHERE status = 'running' AND locked_until <= ? AND attempt_count >= max_attempts"
    ).bind(nowIso, nowIso).run();

    // Atomic lease: only one dispatcher can claim a due row, and retries never
    // exceed the configured attempt limit.
    const item = await db.prepare(
      "UPDATE agent_queue SET status = 'running', attempt_count = attempt_count + 1, locked_until = ?, updated_at = ? WHERE id = (SELECT id FROM agent_queue WHERE ((status = 'queued' AND available_at <= ?) OR (status = 'running' AND locked_until <= ?)) AND attempt_count < max_attempts ORDER BY available_at ASC, created_at ASC LIMIT 1) RETURNING id, agent_run_id, agent_key, objective, attempt_count, max_attempts"
    ).bind(leaseUntil, nowIso, nowIso, nowIso).first<QueueItem>();

    if (!item) return NextResponse.json({ processed: false, reason: "queue_empty" });

    await db.prepare(
      "UPDATE agent_runs SET status = 'running', started_at = ?, error_code = NULL WHERE id = ?"
    ).bind(nowIso, item.agent_run_id).run();

    try {
      const result = await executeAgentObjective({ agentKey: item.agent_key, objective: item.objective });
      const finishedAt = new Date().toISOString();
      await db.prepare(
        "UPDATE agent_runs SET status = 'succeeded', provider = ?, model = ?, output_summary = ?, error_code = NULL, finished_at = ? WHERE id = ?"
      ).bind(result.provider, result.model, result.output, finishedAt, item.agent_run_id).run();
      await db.prepare(
        "UPDATE agent_queue SET status = 'succeeded', locked_until = NULL, last_error = NULL, updated_at = ? WHERE id = ?"
      ).bind(finishedAt, item.id).run();
      await writeAuditEvent(db, {
        actorType: "agent",
        actorId: item.agent_key,
        action: "agent_run.succeeded",
        resourceType: "agent_run",
        resourceId: item.agent_run_id,
        outcome: "success",
        details: { provider: result.provider, model: result.model, attempt: item.attempt_count }
      });
      return NextResponse.json({ processed: true, runId: item.agent_run_id, status: "succeeded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AGENT_EXECUTION_FAILED";
      const code = message.startsWith("AI_PROVIDER_HTTP_")
        ? message.split(":")[0]
        : message === "AI_PROVIDER_NOT_CONFIGURED" || message === "AI_PROVIDER_EMPTY_RESPONSE"
          ? message
          : "AGENT_EXECUTION_FAILED";
      const failedAt = new Date().toISOString();
      const terminal = item.attempt_count >= item.max_attempts;
      const delaySeconds = Math.min(300, 15 * (2 ** (item.attempt_count - 1)));
      const retryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

      if (terminal) {
        await db.prepare(
          "UPDATE agent_queue SET status = 'failed', locked_until = NULL, last_error = ?, updated_at = ? WHERE id = ?"
        ).bind(message.slice(0, 1000), failedAt, item.id).run();
        await db.prepare(
          "UPDATE agent_runs SET status = 'failed', error_code = ?, output_summary = ?, finished_at = ? WHERE id = ?"
        ).bind(code, message.slice(0, 1000), failedAt, item.agent_run_id).run();
      } else {
        await db.prepare(
          "UPDATE agent_queue SET status = 'queued', available_at = ?, locked_until = NULL, last_error = ?, updated_at = ? WHERE id = ?"
        ).bind(retryAt, message.slice(0, 1000), failedAt, item.id).run();
        await db.prepare(
          "UPDATE agent_runs SET status = 'queued', error_code = ?, output_summary = ?, finished_at = NULL WHERE id = ?"
        ).bind(code, message.slice(0, 1000), item.agent_run_id).run();
      }

      await writeAuditEvent(db, {
        actorType: "agent",
        actorId: item.agent_key,
        action: terminal ? "agent_run.failed" : "agent_run.retry_scheduled",
        resourceType: "agent_run",
        resourceId: item.agent_run_id,
        outcome: "failure",
        details: { errorCode: code, attempt: item.attempt_count, retryAt: terminal ? null : retryAt }
      });

      return NextResponse.json({
        processed: true,
        runId: item.agent_run_id,
        status: terminal ? "failed" : "queued",
        attempt: item.attempt_count,
        errorCode: code,
        retryAt: terminal ? null : retryAt
      });
    }
  } catch {
    return NextResponse.json({ error: "Queue dispatcher failed. Verify migration 0003_agent_queue.sql and D1 binding." }, { status: 503 });
  }
}
