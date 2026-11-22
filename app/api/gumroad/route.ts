import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/owner-session";
import { getGumroadOverview, GumroadApiError, isGumroadConfigured } from "@/lib/gumroad";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isGumroadConfigured())) {
    return NextResponse.json({
      connected: false,
      status: "not_configured",
      message: "Add GUMROAD_ACCESS_TOKEN as an encrypted Cloudflare Worker secret."
    }, { status: 503 });
  }

  try {
    const overview = await getGumroadOverview();
    return NextResponse.json({
      connected: true,
      status: "connected",
      ...overview,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    const status = error instanceof GumroadApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Gumroad connection failed.";
    return NextResponse.json({
      connected: false,
      status: "error",
      message
    }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
