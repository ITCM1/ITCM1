"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Product = {
  id: string;
  title: string;
  description: string;
  targetMarket: string;
  priceAmount: number;
  currency: string;
  status: "draft" | "ready" | "listed" | "archived";
  salesChannel?: string;
  listingUrl?: string;
  createdAt: string;
};

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error ?? `Request failed (${response.status})`;
}

export default function DigitalProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("Café Owner Profit Kit");
  const [description, setDescription] = useState("Excel toolkit for independent cafés: recipe costing, daily sales, monthly profit and inventory tracking. Includes a quick-start guide.");
  const [targetMarket, setTargetMarket] = useState("United States, United Kingdom, Europe, UAE");
  const [priceAmount, setPriceAmount] = useState("12.00");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<"draft" | "ready">("draft");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/digital-products", { cache: "no-store" });
      if (!response.ok) throw new Error(await readError(response));
      const body = await response.json() as { products: Product[] };
      setProducts(body.products ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load digital products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/digital-products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          targetMarket,
          priceAmount: Number(priceAmount),
          currency,
          status
        })
      });
      if (!response.ok) throw new Error(await readError(response));
      const body = await response.json() as { product: Product };
      setProducts((current) => [body.product, ...current]);
      setNotice("Product record saved in Cloudflare D1. No marketplace listing or payment connection has been created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Product could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="product-manager" id="digital-products">
      <div className="section-heading">
        <div><span className="eyebrow">PRODUCT OPERATIONS</span><h2>Digital Products</h2></div>
        <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh catalogue"}</button>
      </div>
      <p className="agent-description">Create and track real product records in D1. Marketplace publishing and checkout remain disabled until a seller account and provider integration are connected.</p>
      <p><a className="secondary-button" href="/shop/cafe-owner-profit-kit" target="_blank" rel="noreferrer">Preview public sales page ↗</a></p>
      <form className="product-form" onSubmit={createProduct}>
        <label className="field-label">Product title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={180} />
        </label>
        <label className="field-label">Target markets
          <input value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} required maxLength={100} />
        </label>
        <label className="field-label">Price
          <input type="number" min="0" max="1000000" step="0.01" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} required />
        </label>
        <label className="field-label">Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>AED</option></select>
        </label>
        <label className="field-label">Preparation status
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "ready")}><option value="draft">Draft</option><option value="ready">Ready for review</option></select>
        </label>
        <label className="field-label field-wide">Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={5000} />
        </label>
        <div className="form-actions"><button className="primary-button" type="submit" disabled={saving || !title.trim()}>{saving ? "Saving…" : "＋ Save product"}</button></div>
      </form>
      {error && <div className="error-banner" role="alert">{error}</div>}
      {notice && <div className="agent-diagnostic" role="status">{notice}</div>}
      <div className="product-list">
        <div className="agent-history-heading"><strong>Product catalogue</strong><span className="muted">{products.length} saved records</span></div>
        {products.length === 0 ? <p className="empty-state">{loading ? "Loading products…" : "No saved products yet. Save the first product above."}</p> : products.map((product) => (
          <article className="product-row" key={product.id}>
            <div className="task-main">
              <div className="task-title-line"><h3>{product.title}</h3><span className={`agent-status status-${product.status === "ready" ? "succeeded" : product.status}`}>{product.status}</span></div>
              <p>{product.description}</p>
              <small>{product.targetMarket} · {product.currency} {Number(product.priceAmount).toFixed(2)} · Saved {new Date(product.createdAt).toLocaleString()}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
