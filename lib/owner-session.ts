import { cookies } from "next/headers";

const COOKIE_NAME = "itcm_owner_session";
const SESSION_VALUE = "itcm-global-ai-owner-session-v1";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signature(secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(SESSION_VALUE)));
}

export async function createOwnerSession(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return toBase64Url(await signature(secret));
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const expected = await signature(secret);
    const actual = fromBase64Url(token);
    if (actual.length !== expected.length) return false;
    return crypto.subtle.timingSafeEqual
      ? crypto.subtle.timingSafeEqual(actual, expected)
      : actual.every((value, index) => value === expected[index]);
  } catch {
    return false;
  }
}

export const ownerCookie = COOKIE_NAME;
