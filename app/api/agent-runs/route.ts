import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { isOwnerAuthenticated } from "@/lib/owner-session";

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
      "INSERT INTO agent_runs (id, task_id, project_id, agent_key, objective, status, input_summary, created_at) VALUES (?, ?, ?, ?, ?, 'queued', '', ?)"
    ).bind(id, input.taskId ?? null, input.projectId ?? null, input.agentKey, input.objective, createdAt).run();
    return NextResponse.json({
      run: { id, ...input, status: "queued", createdAt },
      execution: "queued_only",
      message: "The run is recorded but no AI execution provider is configured or invoked by this endpoint."
    }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Agent run could not be queued. Check referenced task/project IDs and apply migration 0002." }, { status: 503 });
  }
}
