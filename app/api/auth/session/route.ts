import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/owner-session";

export async function GET() {
  return NextResponse.json({ authenticated: await isOwnerAuthenticated() });
}
