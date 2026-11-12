import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { getRuntimeEnv } from "@/lib/runtime-env";

const requiredTables = ["tasks", "projects", "agent_runs", "approvals", "audit_events"] as const;

export async function GET() {
  const [database, telegramToken, telegramSecret, aiKey, aiModel, ownerPassword, sessionSecret] = await Promise.all([
    getDatabase(), getRuntimeEnv("TELEGRAM_BOT_TOKEN"), getRuntimeEnv("TELEGRAM_WEBHOOK_SECRET"),
    getRuntimeEnv("AI_API_KEY"), getRuntimeEnv("AI_MODEL"), getRuntimeEnv("OWNER_LOGIN_PASSWORD"), getRuntimeEnv("SESSION_SECRET")
  ]);

  let schema: Record<string, boolean> = Object.fromEntries(requiredTables.map((table) => [table, false]));
  let databaseStatus: "not_configured" | "unavailable" | "schema_incomplete" | "ready" = "not_configured";

  if (database) {
    try {
      const result = await database.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (?, ?, ?, ?, ?)"
      ).bind(...requiredTables).all<{ name: string }>();
      const present = new Set((result.results ?? []).map((row) => row.name));
      schema = Object.fromEntries(requiredTables.map((table) => [table, present.has(table)]));
      databaseStatus = requiredTables.every((table) => present.has(table)) ? "ready" : "schema_incomplete";
    } catch {
      databaseStatus = "unavailable";
    }
  }

  return NextResponse.json({
    status: "ok",
    service: "itcm-global-ai",
    stage: "ai-agent-execution",
    integrations: {
      telegram: telegramToken && telegramSecret ? "configured" : "not_configured",
      database: databaseStatus,
      ai_provider: aiKey && aiModel ? "configured" : "not_configured",
      owner_auth: ownerPassword && sessionSecret ? "configured" : "not_configured"
    },
    database_schema: schema,
    timestamp: new Date().toISOString()
  });
}
