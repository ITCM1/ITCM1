import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getRuntimeEnv(name: string): Promise<string | undefined> {
  try {
    const context = await getCloudflareContext({ async: true });
    const value = (context.env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {
    // Next.js local development and build-time execution use process.env.
  }

  const fallback = process.env[name];
  return typeof fallback === "string" && fallback.length > 0 ? fallback : undefined;
}
