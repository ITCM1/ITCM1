import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";

export async function GET() {
  const database = await getDatabase();
  return NextResponse.json({
    status: "ok",
    service: "itcm-global-ai",
    stage: "persistent-task-api",
    integrations: {
      telegram: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET ? "configured" : "not_configured",
      database: database ? "binding_detected" : "not_configured",
      ai_provider: process.env.AI_PROVIDER && process.env.AI_API_KEY ? "configured" : "not_configured",
      owner_auth: process.env.OWNER_LOGIN_PASSWORD && process.env.SESSION_SECRET ? "configured" : "not_configured"
    },
    timestamp: new Date().toISOString()
  });
}
