import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/cloudflare";
import { writeAuditEvent } from "@/lib/audit";
import { isOwnerAuthenticated } from "@/lib/owner-session";

const productInput = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().max(5000).default(""),
  targetMarket: z.string().trim().min(1).max(100).default("International"),
  priceAmount: z.number().finite().min(0).max(1000000).default(0),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("USD"),
  status: z.enum(["draft", "ready"]).default("draft")
});

export async function GET() {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  try {
    const result = await db.prepare(
      "SELECT id, title, description, target_market AS targetMarket, price_amount AS priceAmount, currency, status, sales_channel AS salesChannel, listing_url AS listingUrl, created_at AS createdAt, updated_at AS updatedAt FROM digital_products ORDER BY updated_at DESC LIMIT 200"
    ).bind().all();
    return NextResponse.json({ products: result.results ?? [] });
  } catch {
    return NextResponse.json({ error: "Digital products table is not installed. Apply migrations/0004_digital_products.sql." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: "D1 database is not configured." }, { status: 503 });
  const parsed = productInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product data.", details: parsed.error.flatten() }, { status: 400 });
  const product = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await db.prepare(
      "INSERT INTO digital_products (id, title, description, target_market, price_amount, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, product.title, product.description, product.targetMarket, product.priceAmount, product.currency, product.status, now, now).run();
    await writeAuditEvent(db, {
      actorType: "owner",
      actorId: "owner",
      action: "digital_product.created",
      resourceType: "digital_product",
      resourceId: id,
      outcome: "success",
      details: { title: product.title, targetMarket: product.targetMarket, currency: product.currency, status: product.status }
    });
    return NextResponse.json({ product: { ...product, id, createdAt: now, updatedAt: now } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Digital product could not be saved." }, { status: 503 });
  }
}
