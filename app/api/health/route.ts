import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { getRuntimeEnv } from "@/lib/runtime-env";

const requiredTables = ["tasks", "projects", "agent_runs", "approvals", "audit_events", "agent_queue"] as const;

export async function GET() {
  const [
    database, telegramToken, telegramSecret, legacyAiKey, legacyAiModel,
    openAiKey, openAiModel, anthropicKey, anthropicModel, aiProvider,
    ownerPassword, sessionSecret, queueSecret
  ] = await Promise.all([
    getDatabase(), getRuntimeEnv("TELEGRAM_BOT_TOKEN"), getRuntimeEnv("TELEGRAM_WEBHOOK_SECRET"),
    getRuntimeEnv("AI_API_KEY"), getRuntimeEnv("AI_MODEL"),
    getRuntimeEnv("OPENAI_API_KEY"), getRuntimeEnv("OPENAI_MODEL"),
    getRuntimeEnv("ANTHROPIC_API_KEY"), getRuntimeEnv("ANTHROPIC_MODEL"), getRuntimeEnv("AI_PROVIDER"),
    getRuntimeEnv("OWNER_LOGIN_PASSWORD"), getRuntimeEnv("SESSION_SECRET"), getRuntimeEnv("AGENT_QUEUE_SECRET")
  ]);

  const selectedProvider = aiProvider?.trim().toLowerCase();
  const openAiReady = Boolean((openAiKey || legacyAiKey) && (openAiModel || legacyAiModel));
  const anthropicReady = Boolean(anthropicKey && (anthropicModel || legacyAiModel));
  const aiReady = selectedProvider === "openai"
    ? openAiReady
    : selectedProvider === "anthropic"
      ? anthropicReady
      : openAiReady || anthropicReady;

  let schema: Record<string, boolean> = Object.fromEntries(requiredTables.map((table) => [table, false]));
  let databaseStatus: "not_configured" | "unavailable" | "schema_incomplete" | "ready" = "not_configured";

  if (database) {
    try {
      const result = await database.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (?, ?, ?, ?, ?, ?)"
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
      ai_provider: aiReady ? "configured" : "not_configured",
      ai_providers: {
        openai: openAiReady ? "configured" : "not_configured",
        anthropic: anthropicReady ? "configured" : "not_configured"
      },
      owner_auth: ownerPassword && sessionSecret ? "configured" : "not_configured",
      owner_auth_parts: {
        owner_login_password: Boolean(ownerPassword),
        session_secret: Boolean(sessionSecret)
      },
      agent_queue_dispatch: queueSecret ? "configured" : "not_configured"
    },
    database_schema: schema,
    timestamp: new Date().toISOString()
  });
}
