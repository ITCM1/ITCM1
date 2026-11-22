"use client";

import { useState } from "react";

const productLines = [
  { name: "Business & Productivity", detail: "Business plans, operating systems, templates", status: "Design scope" },
  { name: "Finance & Spreadsheets", detail: "Budget tools, calculators, trackers", status: "Design scope" },
  { name: "Marketing & Sales", detail: "Campaign kits, sales systems, content packs", status: "Design scope" },
  { name: "Education & Knowledge", detail: "Original guides, workbooks, learning kits", status: "Design scope" },
  { name: "Design & Creative", detail: "Canva templates, presentations, brand assets", status: "Design scope" },
  { name: "Software & No-code", detail: "Small utilities, templates, starter kits", status: "Design scope" },
  { name: "Hospitality", detail: "Café, restaurant and hotel operating tools", status: "Existing product focus" },
  { name: "E-commerce", detail: "Store operations, product and fulfilment kits", status: "Design scope" }
];

export default function FactoryOverview() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function requestResearch() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentKey: "market-research",
          objective: "Prepare a prioritized, evidence-based launch plan for ITCM GLOBAL AI FACTORY. Identify 10 original digital product opportunities across Business, Finance, Marketing, Education, Design, Software, Hospitality and E-commerce. For each, provide target buyer, problem, differentiation, suggested format, realistic price range, demand evidence needed, competition risks, production effort, and a validation plan. Do not invent market data, claim research was performed without sources, copy protected works, publish listings, contact prospects, or spend money. Return a ranked first batch of 3 products and a repeatable pipeline for scaling safely."
        })
      });
      const body = await response.json().catch(() => ({})) as {
        error?: string;
        run?: { status?: string; errorCode?: string; outputSummary?: string };
      };
      if (!response.ok) throw new Error(body.error || `Agent request failed (${response.status})`);
      setMessage(body.run?.status === "succeeded"
        ? "Research run completed. Open AI Agents below to review its recorded result."
        : body.run?.status === "failed"
          ? `Research run failed: ${body.run.errorCode || "unknown error"}. Open AI Agents for the diagnostic.`
          : `Research run created with status: ${body.run?.status || "queued"}. Open AI Agents to follow its progress.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the research run.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="factory-overview" id="factory">
      <div className="section-heading">
        <div><span className="eyebrow">AUTONOMOUS DIGITAL BUSINESS</span><h2>Digital Product Factory</h2></div>
        <span className="muted">Multi-market · Multi-category</span>
      </div>
      <div className="factory-hero">
        <div>
          <span className="eyebrow gold">ITCM GLOBAL AI FACTORY</span>
          <h3>One engine. Multiple digital product businesses.</h3>
          <p>Research opportunities, create original products, run quality checks, prepare listings and measure real sales from one owner-controlled workspace.</p>
          <div className="factory-actions">
            <button className="primary-button" type="button" onClick={requestResearch} disabled={busy}>{busy ? "Creating research run…" : "Start first market research run"}</button>
            <a className="secondary-button" href="#digital-products">Open product catalogue</a>
          </div>
          {message && <p className="factory-feedback" role="status">{message}</p>}
        </div>
        <div className="factory-state">
          <span className="state-dot" />
          <strong>Foundation connected</strong>
          <small>Product records and AI task queue exist. Automated production, marketplace publishing and payment reconciliation are not yet connected.</small>
        </div>
      </div>
      <div className="factory-pipeline" aria-label="Factory workflow">
        {["Market research", "Product creation", "Quality control", "Listing preparation", "Owner approval", "Publishing & sales"].map((step, index) => (
          <div className="pipeline-step" key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></div>
        ))}
      </div>
      <div className="factory-lines-heading"><strong>Product divisions</strong><span className="muted">Eight initial categories · no fabricated performance metrics</span></div>
      <div className="factory-lines">
        {productLines.map((line) => (
          <article className="factory-line" key={line.name}>
            <div className="factory-line-top"><strong>{line.name}</strong><span>{line.status}</span></div>
            <p>{line.detail}</p>
          </article>
        ))}
      </div>
      <div className="factory-safety-note"><strong>Execution policy</strong><span>AI may research, draft and prepare. Publishing, customer outreach, paid promotion, refunds and money movement stay disabled until the required integrations and owner approvals are in place. Sales and revenue will only appear after provider confirmation.</span></div>
    </section>
  );
}
