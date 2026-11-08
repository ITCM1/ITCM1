import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { getRuntimeEnv } from "@/lib/runtime-env";

export async function GET() {
  const [database, telegramToken, telegramSecret, aiProvider, aiKey, ownerPassword, sessionSecret] = await Promise.all([
    getDatabase(), getRuntimeEnv("TELEGRAM_BOT_TOKEN"), getRuntimeEnv("TELEGRAM_WEBHOOK_SECRET"),
    getRuntimeEnv("AI_PROVIDER"), getRuntimeEnv("AI_API_KEY"), getRuntimeEnv("OWNER_LOGIN_PASSWORD"), getRuntimeEnv("SESSION_SECRET")
  ]);
  return NextResponse.json({
    status: "ok",
    service: "itcm-global-ai",
    stage: "persistent-task-api",
    integrations: {
      telegram: telegramToken && telegramSecret ? "configured" : "not_configured",
      database: database ? "binding_detected" : "not_configured",
      ai_provider: aiProvider && aiKey ? "configured" : "not_configured",
      owner_auth: ownerPassword && sessionSecret ? "configured" : "not_configured"
    },
    timestamp: new Date().toISOString()
  });
}
