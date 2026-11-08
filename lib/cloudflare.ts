import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1Result<T = Record<string, unknown>> = {
  results?: T[];
  success?: boolean;
  meta?: Record<string, unknown>;
};

export type D1Database = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<D1Result>;
    };
  };
};

export async function getDatabase(): Promise<D1Database | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as unknown as { DB?: D1Database };
    return env.DB ?? null;
  } catch {
    return null;
  }
}
