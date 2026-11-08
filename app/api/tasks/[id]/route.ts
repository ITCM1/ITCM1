import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { isOwnerAuthenticated } from "@/lib/owner-session";

const taskUpdate = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  department: z.string().trim().min(1).max(60).optional(),
  priority: z.enum(["high", "normal", "low"]).optional(),
  status: z.enum(["pending", "in_progress", "done"]).optional()
}).refine((value) => Object.keys(value).length > 0);

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "Cloudflare D1 database binding DB is not configured." }, { status: 503 });

  const parsed = taskUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task update." }, { status: 400 });
  const { id } = await context.params;
  const fields = parsed.data;
  const columns: Record<string, string> = {
    title: "title",
    description: "description",
    department: "department",
    priority: "priority",
    status: "status"
  };
  const entries = Object.entries(fields) as [keyof typeof columns, string][];
  const assignments = entries.map(([key]) => `${columns[key]} = ?`).join(", ");
  try {
    const result = await db.prepare(`UPDATE tasks SET ${assignments} WHERE id = ?`)
      .bind(...entries.map(([, value]) => value), id).run();
    if (!result.meta || Number(result.meta.changes ?? 0) === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ updated: true, id });
  } catch {
    return NextResponse.json({ error: "Task update failed." }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "Cloudflare D1 database binding DB is not configured." }, { status: 503 });
  const { id } = await context.params;
  try {
    const result = await db.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
    if (!result.meta || Number(result.meta.changes ?? 0) === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch {
    return NextResponse.json({ error: "Task deletion failed." }, { status: 503 });
  }
}
