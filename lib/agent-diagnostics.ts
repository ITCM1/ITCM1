import { getDatabase } from "@/lib/cloudflare";

const expectedTables = [
  "tasks",
  "projects",
  "agent_runs",
  "approvals",
  "audit_events",
  "agent_queue"
] as const;

type TableName = (typeof expectedTables)[number];

async function readCount(db: NonNullable<Awaited<ReturnType<typeof getDatabase>>>, table: TableName) {
  try {
    const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).bind().first<{ count: number }>();
    return { count: Number(row?.count ?? 0), error: null };
  } catch (error) {
    return { count: null, error: error instanceof Error ? error.message : "query_failed" };
  }
}

/**
 * Read-only snapshot for the owner-facing Master Orchestrator.
 * This function performs SELECTs only and never dispatches jobs or changes data.
 */
export async function loadAgentDiagnosticSnapshot(): Promise<Record<string, unknown>> {
  const db = await getDatabase();
  if (!db) {
    return {
      access: "unavailable",
      reason: "Cloudflare D1 binding DB is not available in this Worker request.",
      readOnly: true
    };
  }

  try {
    const tableRows = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).bind().all<{ name: string }>();
    const present = new Set((tableRows.results ?? []).map((row) => row.name));
    const tables = Object.fromEntries(expectedTables.map((table) => [table, present.has(table)]));
    const counts = await Promise.all(expectedTables.filter((table) => present.has(table)).map(async (table) => [
      table,
      await readCount(db, table)
    ] as const));

    const [projects, tasks, agentRuns, queue, approvals, auditEvents] = await Promise.all([
      present.has("projects")
        ? db.prepare("SELECT id, name, status, created_at AS createdAt, updated_at AS updatedAt FROM projects ORDER BY updated_at DESC LIMIT 10").bind().all()
        : Promise.resolve({ results: [] }),
      present.has("tasks")
        ? db.prepare("SELECT id, title, department, priority, status, created_at AS createdAt FROM tasks ORDER BY created_at DESC LIMIT 10").bind().all()
        : Promise.resolve({ results: [] }),
      present.has("agent_runs")
        ? db.prepare("SELECT id, agent_key AS agentKey, objective, status, provider, model, output_summary AS outputSummary, error_code AS errorCode, created_at AS createdAt, finished_at AS finishedAt FROM agent_runs ORDER BY created_at DESC LIMIT 10").bind().all()
        : Promise.resolve({ results: [] }),
      present.has("agent_queue")
        ? db.prepare("SELECT status, COUNT(*) AS count FROM agent_queue GROUP BY status ORDER BY status").bind().all()
        : Promise.resolve({ results: [] }),
      present.has("approvals")
        ? db.prepare("SELECT id, action_type AS actionType, risk_level AS riskLevel, status, created_at AS createdAt FROM approvals ORDER BY created_at DESC LIMIT 10").bind().all()
        : Promise.resolve({ results: [] }),
      present.has("audit_events")
        ? db.prepare("SELECT actor_type AS actorType, action, resource_type AS resourceType, outcome, created_at AS createdAt FROM audit_events ORDER BY created_at DESC LIMIT 10").bind().all()
        : Promise.resolve({ results: [] })
    ]);

    return {
      access: "available",
      readOnly: true,
      inspectedAt: new Date().toISOString(),
      expectedTables: [...expectedTables],
      tables,
      counts: Object.fromEntries(counts),
      latest: {
        projects: projects.results ?? [],
        tasks: tasks.results ?? [],
        agentRuns: agentRuns.results ?? [],
        queue: queue.results ?? [],
        approvals: approvals.results ?? [],
        auditEvents: auditEvents.results ?? []
      },
      limitations: [
        "Only the latest 10 records are included for each activity list.",
        "This snapshot is read-only; no tasks are dispatched and no records are changed."
      ]
    };
  } catch (error) {
    return {
      access: "partial",
      readOnly: true,
      reason: error instanceof Error ? error.message : "D1 diagnostic query failed."
    };
  }
}
