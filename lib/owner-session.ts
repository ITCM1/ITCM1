import { cookies } from "next/headers";
import { getRuntimeEnv } from "@/lib/runtime-env";

const COOKIE_NAME = "itcm_owner_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

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

async function sign(payload: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function createOwnerSession(): Promise<string | null> {
  const secret = await getRuntimeEnv("SESSION_SECRET");
  if (!secret) return null;
  const issuedAt = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const payload = toBase64Url(new TextEncoder().encode(`${issuedAt}.${nonce}`));
  return `${payload}.${toBase64Url(await sign(payload, secret))}`;
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  const secret = await getRuntimeEnv("SESSION_SECRET");
  if (!secret) return false;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return false;
    if (!constantTimeEqual(fromBase64Url(signature), await sign(payload, secret))) return false;
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const [issuedAtText, nonce, trailing] = decoded.split(".");
    const issuedAt = Number(issuedAtText);
    const now = Math.floor(Date.now() / 1000);
    if (trailing || !nonce || !Number.isInteger(issuedAt)) return false;
    return issuedAt <= now + 60 && now - issuedAt <= SESSION_MAX_AGE_SECONDS;
  } catch {
    return false;
  }
}

export const ownerCookie = COOKIE_NAME;
export const ownerSessionMaxAge = SESSION_MAX_AGE_SECONDS;
