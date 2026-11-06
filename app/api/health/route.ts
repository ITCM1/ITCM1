import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "itcm-global-ai",
    stage: "foundation",
    integrations: {
      telegram: "not_configured",
      database: "not_configured",
      ai_provider: "not_configured"
    },
    timestamp: new Date().toISOString()
  });
}
