import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { isOwnerAuthenticated } from "@/lib/owner-session";

export async function GET() {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  try {
    const result = await db.prepare(
      "SELECT id, actor_type AS actorType, actor_id AS actorId, action, resource_type AS resourceType, resource_id AS resourceId, outcome, details_json AS details, correlation_id AS correlationId, created_at AS createdAt FROM audit_events ORDER BY created_at DESC LIMIT 200"
    ).bind().all();
    return NextResponse.json({ events: result.results ?? [] });
  } catch {
    return NextResponse.json({ error: "Audit table unavailable. Apply migrations/0002_orchestration.sql." }, { status: 503 });
  }
}
