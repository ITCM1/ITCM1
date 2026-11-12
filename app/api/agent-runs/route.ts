import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { writeAuditEvent } from "@/lib/audit";
import { executeAgentObjective } from "@/lib/agent-executor";
import { isOwnerAuthenticated } from "@/lib/owner-session";

// Keep this route on the default Node.js runtime. OpenNext Cloudflare bundles
// Node.js routes into the main Worker; Edge routes require a separate function.
const runInput = z.object({
  agentKey: z.string().trim().min(1).max(80),
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
    return NextResponse.json({ runs: result.results ?? [] });
  } catch {
    return NextResponse.json({ error: "Agent runs table unavailable. Apply migrations/0002_orchestration.sql." }, { status: 503 });
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
  const createdAt = new Date().toISOString();

  try {
    await db.prepare(
      "INSERT INTO agent_runs (id, task_id, project_id, agent_key, objective, status, input_summary, created_at, started_at) VALUES (?, ?, ?, ?, ?, 'running', ?, ?, ?)"
    ).bind(id, input.taskId ?? null, input.projectId ?? null, input.agentKey, input.objective, input.objective.slice(0, 500), createdAt, createdAt).run();

    await writeAuditEvent(db, {
      actorType: "owner",
      actorId: "owner",
      action: "agent_run.started",
      resourceType: "agent_run",
      resourceId: id,
      outcome: "pending",
      details: { agentKey: input.agentKey, projectId: input.projectId ?? null, taskId: input.taskId ?? null }
    });

    const result = await executeAgentObjective({ agentKey: input.agentKey, objective: input.objective });
    const finishedAt = new Date().toISOString();
    await db.prepare(
      "UPDATE agent_runs SET status = 'succeeded', provider = ?, model = ?, output_summary = ?, finished_at = ? WHERE id = ?"
    ).bind(result.provider, result.model, result.output, finishedAt, id).run();

    await writeAuditEvent(db, {
      actorType: "agent",
      actorId: input.agentKey,
      action: "agent_run.succeeded",
      resourceType: "agent_run",
      resourceId: id,
      outcome: "success",
      details: { provider: result.provider, model: result.model }
    });

    return NextResponse.json({
      run: {
        id,
        ...input,
        status: "succeeded",
        provider: result.provider,
        model: result.model,
        output: result.output,
        createdAt,
        startedAt: createdAt,
        finishedAt
      }
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AGENT_EXECUTION_FAILED";
    const code = message.startsWith("AI_PROVIDER_HTTP_")
      ? message.split(":")[0]
      : message === "AI_PROVIDER_NOT_CONFIGURED" || message === "AI_PROVIDER_EMPTY_RESPONSE"
        ? message
        : "AGENT_EXECUTION_FAILED";
    const finishedAt = new Date().toISOString();
    await db.prepare(
      "UPDATE agent_runs SET status = 'failed', error_code = ?, output_summary = ?, finished_at = ? WHERE id = ?"
    ).bind(code, message.slice(0, 1000), finishedAt, id).run().catch(() => undefined);
    await writeAuditEvent(db, {
      actorType: "agent",
      actorId: input.agentKey,
      action: "agent_run.failed",
      resourceType: "agent_run",
      resourceId: id,
      outcome: "failure",
      details: { errorCode: code }
    });
    const status = code === "AI_PROVIDER_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({
      error: code === "AI_PROVIDER_NOT_CONFIGURED"
        ? "AI provider is not configured. Add AI_API_KEY and AI_MODEL as Cloudflare Worker secrets/variables."
        : "Agent execution failed. See the run history and server logs.",
      run: { id, status: "failed", errorCode: code }
    }, { status });
  }
}
