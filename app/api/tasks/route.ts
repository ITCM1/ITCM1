import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { isOwnerAuthenticated } from "@/lib/owner-session";

const taskInput = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(1000).default(""),
  department: z.string().trim().min(1).max(60),
  priority: z.enum(["high", "normal", "low"]).default("normal")
});

export async function GET() {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "Cloudflare D1 database binding DB is not configured." }, { status: 503 });
  try {
    const result = await db.prepare(
      "SELECT id, title, description, department, priority, status, created_at AS createdAt FROM tasks ORDER BY created_at DESC"
    ).bind().all();
    return NextResponse.json({ tasks: result.results ?? [] });
  } catch {
    return NextResponse.json({ error: "Unable to read tasks. Apply migrations/0001_tasks.sql to D1." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "Cloudflare D1 database binding DB is not configured." }, { status: 503 });

  const parsed = taskInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task data.", details: parsed.error.flatten() }, { status: 400 });

  const task = parsed.data;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await db.prepare(
      "INSERT INTO tasks (id, title, description, department, priority, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)"
    ).bind(id, task.title, task.description, task.department, task.priority, createdAt).run();
    return NextResponse.json({ task: { ...task, id, status: "pending", createdAt } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Task could not be saved to D1." }, { status: 503 });
  }
}
