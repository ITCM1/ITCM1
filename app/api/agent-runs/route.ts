import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { writeAuditEvent } from "@/lib/audit";
import { isAgentProviderConfigured } from "@/lib/agent-executor";
import { isOwnerAuthenticated } from "@/lib/owner-session";

const supportedAgentKeys = [
  "master-orchestrator",
  "sales-manager",
  "marketing-manager",
  "market-research",
  "operations-manager",
  "finance-analyst"
] as const;

const runInput = z.object({
  agentKey: z.enum(supportedAgentKeys),
  objective: z.string().trim().min(1).max(4000),
  taskId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable()
});

export async function GET() {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  try {
    const result = await db.prepare(
      "SELECT id, task_id AS taskId, project_id AS projectId, agent_key AS agentKey, objective, status, provider, model, input_summary AS inputSummary, output_summary AS outputSummary, error_code AS errorCode, created_at AS createdAt, started_at AS startedAt, finished_at AS finishedAt FROM agent_runs ORDER BY created_at DESC LIMIT 100"
    ).bind().all();
    const queue = await db.prepare(
      "SELECT status, COUNT(*) AS count FROM agent_queue GROUP BY status"
    ).bind().all<{ status: string; count: number }>();
    return NextResponse.json({
      runs: result.results ?? [],
      queue: queue.results ?? [],
      providerConfigured: await isAgentProviderConfigured()
    });
  } catch {
    return NextResponse.json({ error: "Agent queue is not installed. Apply migrations/0003_agent_queue.sql." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });

  const parsed = runInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid agent run request.", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const id = crypto.randomUUID();
  const queueId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  let enqueueStage = "agent_run_insert";
  try {
    await db.prepare(
      "INSERT INTO agent_runs (id, task_id, project_id, agent_key, objective, status, input_summary, created_at) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)"
    ).bind(id, input.taskId ?? null, input.projectId ?? null, input.agentKey, input.objective, input.objective.slice(0, 500), createdAt).run();

    enqueueStage = "agent_queue_insert";
    await db.prepare(
      "INSERT INTO agent_queue (id, agent_run_id, agent_key, objective, status, attempt_count, max_attempts, available_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'queued', 0, 3, ?, ?, ?)"
    ).bind(queueId, id, input.agentKey, input.objective, createdAt, createdAt, createdAt).run();

    await writeAuditEvent(db, {
      actorType: "owner",
      actorId: "owner",
      action: "agent_run.queued",
      resourceType: "agent_run",
      resourceId: id,
      outcome: "pending",
      details: { agentKey: input.agentKey, queueId, projectId: input.projectId ?? null, taskId: input.taskId ?? null }
    });

    return NextResponse.json({
      run: { id, ...input, status: "queued", createdAt },
      message: "Agent run accepted into the durable queue."
    }, { status: 202 });
  } catch (error) {
    const detail = (error instanceof Error ? error.message : String(error)).slice(0, 700);
    const errorCode = enqueueStage === "agent_queue_insert"
      ? "QUEUE_ROW_INSERT_FAILED"
      : "AGENT_RUN_INSERT_FAILED";
    await db.prepare(
      "UPDATE agent_runs SET status = 'failed', error_code = ?, output_summary = ?, finished_at = ? WHERE id = ?"
    ).bind(errorCode, `${enqueueStage}: ${detail}`, new Date().toISOString(), id).run().catch(() => undefined);
    return NextResponse.json({
      error: "Could not enqueue the agent run.",
      errorCode,
      stage: enqueueStage,
      detail
    }, { status: 503 });
  }
}
