import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { writeAuditEvent } from "@/lib/audit";
import { isOwnerAuthenticated } from "@/lib/owner-session";

const projectInput = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(4000).default(""),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active")
});

export async function GET() {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  try {
    const result = await db.prepare(
      "SELECT id, name, description, status, created_at AS createdAt, updated_at AS updatedAt FROM projects ORDER BY updated_at DESC"
    ).bind().all();
    return NextResponse.json({ projects: result.results ?? [] });
  } catch {
    return NextResponse.json({ error: "Projects table unavailable. Apply migrations/0002_orchestration.sql." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  const parsed = projectInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project data.", details: parsed.error.flatten() }, { status: 400 });
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const project = parsed.data;
  try {
    await db.prepare(
      "INSERT INTO projects (id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, project.name, project.description, project.status, now, now).run();
    await writeAuditEvent(db, {
      actorType: "owner",
      actorId: "owner",
      action: "project.created",
      resourceType: "project",
      resourceId: id,
      outcome: "success",
      details: { name: project.name, status: project.status }
    });
    return NextResponse.json({ project: { ...project, id, createdAt: now, updatedAt: now } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Project could not be saved." }, { status: 503 });
  }
}
