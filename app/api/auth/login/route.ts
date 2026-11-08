import { NextRequest, NextResponse } from "next/server";
import { createOwnerSession, ownerCookie, ownerSessionMaxAge } from "@/lib/owner-session";
import { getRuntimeEnv } from "@/lib/runtime-env";

function constantTimeTextEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export async function POST(request: NextRequest) {
  const [expectedPassword, sessionSecret] = await Promise.all([
    getRuntimeEnv("OWNER_LOGIN_PASSWORD"),
    getRuntimeEnv("SESSION_SECRET")
  ]);
  if (!expectedPassword || !sessionSecret) {
    return NextResponse.json({ error: "Owner authentication is not configured. Add OWNER_LOGIN_PASSWORD and SESSION_SECRET as Worker secrets." }, { status: 503 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length > 512 || !constantTimeTextEqual(body.password, expectedPassword)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const token = await createOwnerSession();
  if (!token) return NextResponse.json({ error: "Session signing is unavailable." }, { status: 503 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ownerCookie, token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: ownerSessionMaxAge
  });
  return response;
}
