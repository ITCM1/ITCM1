import { NextRequest, NextResponse } from "next/server";
import { createOwnerSession, ownerCookie } from "@/lib/owner-session";

export async function POST(request: NextRequest) {
  const expectedPassword = process.env.OWNER_LOGIN_PASSWORD;
  if (!expectedPassword || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "Owner authentication is not configured. Set OWNER_LOGIN_PASSWORD and SESSION_SECRET." },
      { status: 503 }
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length > 512 || body.password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const token = await createOwnerSession();
  if (!token) return NextResponse.json({ error: "Session signing is unavailable." }, { status: 503 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ownerCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
