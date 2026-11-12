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
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latestOutput, setLatestOutput] = useState("");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agent-runs", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as { runs: AgentRun[] };
      setRuns(body.runs ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load agent history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRuns(); }, [loadRuns]);

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
        run?: { output?: string; status?: string; errorCode?: string };
      };
      if (!response.ok) throw new Error(body.error ?? `Agent request failed (${response.status})`);
      setLatestOutput(body.run?.output ?? "The agent completed without returning displayable text.");
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
      <p className="agent-description">Send a real analysis or planning request to the selected AI agent. External actions, publishing, messages and payments are not enabled.</p>
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
      {latestOutput && <article className="agent-output"><strong>Latest agent response</strong><pre>{latestOutput}</pre></article>}
      <div className="agent-history">
        <div className="agent-history-heading"><strong>Execution history</strong><span className="muted">{runs.length} recent runs</span></div>
        {runs.length === 0 ? <p className="empty-state">{loading ? "Loading agent history…" : "No agent runs yet. Configure the AI provider secrets to start."}</p> : runs.map((run) => (
          <article className="agent-run-row" key={run.id}>
            <div className="agent-run-main">
              <strong>{agentOptions.find(([key]) => key === run.agentKey)?.[1] ?? run.agentKey}</strong>
              <p>{run.objective}</p>
              {run.outputSummary && <details><summary>View agent response</summary><pre>{run.outputSummary}</pre></details>}
              <small>{new Date(run.createdAt).toLocaleString()} {run.model ? `· ${run.model}` : ""}</small>
            </div>
            <span className={`agent-status status-${run.status}`}>{run.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
