import { NextResponse } from "next/server";
import { ownerCookie } from "@/lib/owner-session";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ownerCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });
  return response;
}
