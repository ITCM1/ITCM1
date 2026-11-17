"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type AgentRun = {
  id: string;
  agentKey: string;
  objective: string;
  status: "queued" | "planning" | "running" | "waiting_approval" | "succeeded" | "failed" | "cancelled";
  provider?: string | null;
  model?: string | null;
  outputSummary?: string | null;
  errorCode?: string | null;
  createdAt: string;
  finishedAt?: string | null;
};

const agentOptions = [
  ["master-orchestrator", "Master Orchestrator"],
  ["sales-manager", "Sales Manager"],
  ["marketing-manager", "Marketing Manager"],
  ["market-research", "Market Research"],
  ["operations-manager", "Operations Manager"],
  ["finance-analyst", "Finance Analyst"]
] as const;

async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error ?? `Request failed (${response.status})`;
}

export default function AgentConsole() {
  const [agentKey, setAgentKey] = useState<string>("master-orchestrator");
  const [objective, setObjective] = useState("");
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latestOutput, setLatestOutput] = useState("");
  const [dispatchDiagnostic, setDispatchDiagnostic] = useState("");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agent-runs", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as {
        runs: AgentRun[];
        providerConfigured?: boolean;
        dispatch?: { triggered?: boolean; status?: number; result?: { error?: string; processed?: boolean; status?: string; reason?: string; errorCode?: string }; error?: string };
      };
      setRuns(body.runs ?? []);
      setProviderConfigured(body.providerConfigured === true);
      const d = body.dispatch;
      setDispatchDiagnostic(!d
        ? ""
        : d.error
          ? `Dispatcher call failed: ${d.error}`
          : d.result?.error
            ? `Dispatcher HTTP ${d.status ?? "?"}: ${d.result.error}`
            : d.result?.errorCode
              ? `Agent execution error: ${d.result.errorCode}`
              : d.result?.reason
                ? `Dispatcher: ${d.result.reason}`
                : d.result?.processed
                  ? `Dispatcher processed run: ${d.result.status ?? "unknown"}`
                  : d.triggered
                    ? `Dispatcher HTTP ${d.status ?? "200"}; no run processed.`
                    : `Dispatcher not triggered (HTTP ${d.status ?? "no response"}).`);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load agent history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
    const refreshTimer = window.setInterval(() => { void loadRuns(); }, 10000);
    return () => window.clearInterval(refreshTimer);
  }, [loadRuns]);

  async function runAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!objective.trim() || busy) return;
    setBusy(true);
    setError("");
    setLatestOutput("");
    try {
      const response = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentKey, objective: objective.trim() })
      });
      const body = await response.json().catch(() => ({})) as {
        error?: string;
        run?: { outputSummary?: string | null; status?: string; errorCode?: string | null; model?: string | null };
        dispatch?: { triggered?: boolean; status?: number; result?: { processed?: boolean; status?: string; reason?: string; errorCode?: string }; error?: string };
      };
      if (!response.ok) throw new Error(body.error ?? `Agent request failed (${response.status})`);
      const runStatus = body.run?.status;
      if (runStatus === "succeeded") {
        setLatestOutput(body.run?.outputSummary ?? "The agent completed successfully, but returned no text.");
      } else if (runStatus === "failed") {
        setLatestOutput(`Agent failed: ${body.run?.errorCode ?? "UNKNOWN_ERROR"}\n${body.run?.outputSummary ?? ""}`);
      } else {
        const dispatchInfo = body.dispatch?.error
          ? `\nDispatcher error: ${body.dispatch.error}`
          : body.dispatch?.result?.errorCode
            ? `\nAgent error: ${body.dispatch.result.errorCode}`
            : body.dispatch?.result?.reason
              ? `\nDispatcher: ${body.dispatch.result.reason}`
              : "";
        setLatestOutput(`Current status: ${runStatus ?? "queued"}. The page refreshes automatically.${dispatchInfo}`);
      }
      setObjective("");
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent execution failed.");
      await loadRuns();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="agent-console" id="agents">
      <div className="section-heading">
        <div><span className="eyebrow">AI OPERATIONS</span><h2>AI Agent Console</h2></div>
        <button className="secondary-button" type="button" onClick={() => void loadRuns()} disabled={loading}>{loading ? "Refreshing…" : "Refresh runs"}</button>
      </div>
      <p className="agent-description">Send a real analysis or planning request to the selected AI agent. {providerConfigured === true ? "AI provider credentials are present in the Cloudflare Worker configuration; a successful run is still required to verify the provider." : providerConfigured === false ? "AI provider is not configured. Check the Worker AI_API_KEY and AI_MODEL settings; the execution history will show the exact failure code." : "Checking AI provider configuration…"} External actions, publishing, messages and payments are not enabled.</p>
      <form className="agent-form" onSubmit={runAgent}>
        <label className="field-label">Specialist agent
          <select value={agentKey} onChange={(event) => setAgentKey(event.target.value)}>
            {agentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field-label">Owner instruction
          <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={4} maxLength={4000} required placeholder="Describe the task you want this agent to analyse or prepare…" />
        </label>
        <button className="primary-button" type="submit" disabled={busy || !objective.trim()}>{busy ? "Agent working…" : "Run AI agent"}</button>
      </form>
      {error && <div className="error-banner" role="alert">{error}</div>}
      {dispatchDiagnostic && <div className="agent-diagnostic" role="status"><strong>Queue diagnostic:</strong> {dispatchDiagnostic}</div>}
      {latestOutput && <article className="agent-output"><strong>Latest agent response</strong><pre>{latestOutput}</pre></article>}
      <div className="agent-history">
        <div className="agent-history-heading"><strong>Execution history</strong><span className="muted">{runs.length} recent runs</span></div>
        {runs.length === 0 ? <p className="empty-state">{loading ? "Loading agent history…" : "No agent runs yet. Submit an analysis request to create the first run."}</p> : runs.map((run) => (
          <article className="agent-run-row" key={run.id}>
            <div className="agent-run-main">
              <strong>{agentOptions.find(([key]) => key === run.agentKey)?.[1] ?? run.agentKey}</strong>
              <p>{run.objective}</p>
              {run.errorCode && <p className="agent-error-code" role="alert">Error code: <strong>{run.errorCode}</strong></p>}
              {run.outputSummary && <details open={run.status === "failed"}><summary>View agent response</summary><pre>{run.outputSummary}</pre></details>}
              <small>{new Date(run.createdAt).toLocaleString()} {run.model ? `· ${run.model}` : ""}</small>
            </div>
            <span className={`agent-status status-${run.status}`}>{run.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
