import { getRuntimeEnv } from "@/lib/runtime-env";

const API_BASE = "https://api.gumroad.com/v2";

type GumroadPayload = Record<string, unknown>;

export class GumroadApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "GumroadApiError";
  }
}

export async function isGumroadConfigured(): Promise<boolean> {
  return Boolean(await getRuntimeEnv("GUMROAD_ACCESS_TOKEN"));
}

async function gumroadGet(path: string): Promise<GumroadPayload> {
  const token = await getRuntimeEnv("GUMROAD_ACCESS_TOKEN");
  if (!token) throw new GumroadApiError("Gumroad access token is not configured.", 503);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({})) as GumroadPayload;
  if (!response.ok || payload.success === false) {
    const message = typeof payload.message === "string" ? payload.message : "Gumroad API request failed.";
    throw new GumroadApiError(message, response.status || 502);
  }
  return payload;
}

function records(value: unknown): GumroadPayload[] {
  return Array.isArray(value) ? value.filter((item): item is GumroadPayload => Boolean(item) && typeof item === "object") : [];
}

function pick(record: GumroadPayload, keys: string[]): GumroadPayload {
  return Object.fromEntries(keys.filter((key) => record[key] !== undefined).map((key) => [key, record[key]]));
}

export async function getGumroadOverview() {
  const [userPayload, productsPayload, salesPayload] = await Promise.all([
    gumroadGet("/user"),
    gumroadGet("/products"),
    gumroadGet("/sales")
  ]);

  const user = userPayload.user && typeof userPayload.user === "object"
    ? userPayload.user as GumroadPayload
    : userPayload;

  return {
    account: pick(user, ["name", "email", "user_id", "twitter_handle", "profile_url"]),
    products: records(productsPayload.products).map((product) => pick(product, [
      "id", "name", "permalink", "price", "currency", "published", "sales_count", "sales_usd_cents", "created_at"
    ])),
    sales: records(salesPayload.sales).map((sale) => pick(sale, [
      "id", "sale_id", "product_id", "product_name", "price", "currency", "formatted_display_price",
      "timestamp", "created_at", "refunded", "chargebacked", "quantity"
    ]))
  };
}
