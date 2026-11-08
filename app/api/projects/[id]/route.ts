import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { isOwnerAuthenticated } from "@/lib/owner-session";

const projectUpdate = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(4000).optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).optional()
}).refine((value) => Object.keys(value).length > 0);

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  const parsed = projectUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project update." }, { status: 400 });
  const { id } = await context.params;
  const columns = { name: "name", description: "description", status: "status" } as const;
  const entries = Object.entries(parsed.data) as [keyof typeof columns, string][];
  const assignments = entries.map(([key]) => `${columns[key]} = ?`).join(", ");
  try {
    const result = await db.prepare(
      `UPDATE projects SET ${assignments}, updated_at = ? WHERE id = ?`
    ).bind(...entries.map(([, value]) => value), new Date().toISOString(), id).run();
    if (!result.meta || Number(result.meta.changes ?? 0) === 0) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ updated: true, id });
  } catch {
    return NextResponse.json({ error: "Project update failed." }, { status: 503 });
  }
}
