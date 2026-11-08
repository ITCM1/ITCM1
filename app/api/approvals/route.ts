import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { writeAuditEvent } from "@/lib/audit";
import { isOwnerAuthenticated } from "@/lib/owner-session";

const decisionInput = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(1000).default("")
});

export async function GET() {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  try {
    const result = await db.prepare(
      "SELECT id, agent_run_id AS agentRunId, action_type AS actionType, action_summary AS actionSummary, risk_level AS riskLevel, status, requested_by AS requestedBy, decided_by AS decidedBy, decision_note AS decisionNote, created_at AS createdAt, decided_at AS decidedAt, expires_at AS expiresAt FROM approvals ORDER BY created_at DESC LIMIT 100"
    ).bind().all();
    return NextResponse.json({ approvals: result.results ?? [] });
  } catch {
    return NextResponse.json({ error: "Approvals table unavailable. Apply migrations/0002_orchestration.sql." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  const parsed = z.object({ id: z.string().uuid(), ...decisionInput.shape }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid approval decision." }, { status: 400 });
  const { id, decision, note } = parsed.data;
  const now = new Date().toISOString();
  try {
    const result = await db.prepare(
      "UPDATE approvals SET status = ?, decided_by = 'owner', decision_note = ?, decided_at = ? WHERE id = ? AND status = 'pending' AND (expires_at IS NULL OR expires_at > ?)"
    ).bind(decision, note, now, id, now).run();
    if (!result.meta || Number(result.meta.changes ?? 0) === 0) {
      return NextResponse.json({ error: "Approval not found, already decided, or expired." }, { status: 409 });
    }
    await writeAuditEvent(db, {
      actorType: "owner",
      actorId: "owner",
      action: "approval.decided",
      resourceType: "approval",
      resourceId: id,
      outcome: "success",
      details: { decision, note }
    });
    return NextResponse.json({ decided: true, id, decision, decidedAt: now });
  } catch {
    return NextResponse.json({ error: "Approval decision could not be saved." }, { status: 503 });
  }
}
