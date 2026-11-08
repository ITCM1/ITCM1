-- ITCM GLOBAL AI: orchestration, approvals, and audit foundation.
-- Apply after 0001_tasks.sql. All timestamps are UTC ISO-8601 strings.

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status_updated
  ON projects(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  project_id TEXT,
  agent_key TEXT NOT NULL CHECK (length(agent_key) BETWEEN 1 AND 80),
  objective TEXT NOT NULL CHECK (length(objective) BETWEEN 1 AND 4000),
  status TEXT NOT NULL CHECK (status IN ('queued', 'planning', 'running', 'waiting_approval', 'succeeded', 'failed', 'cancelled')),
  provider TEXT,
  model TEXT,
  input_summary TEXT NOT NULL DEFAULT '',
  output_summary TEXT NOT NULL DEFAULT '',
  error_code TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_status_created
  ON agent_runs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_task
  ON agent_runs(task_id, created_at DESC);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  agent_run_id TEXT,
  action_type TEXT NOT NULL CHECK (length(action_type) BETWEEN 1 AND 80),
  action_summary TEXT NOT NULL CHECK (length(action_summary) BETWEEN 1 AND 2000),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  requested_by TEXT NOT NULL,
  decided_by TEXT,
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  decided_at TEXT,
  expires_at TEXT,
  FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_approvals_status_created
  ON approvals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_agent_run
  ON approvals(agent_run_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('owner', 'agent', 'system', 'integration')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (length(action) BETWEEN 1 AND 120),
  resource_type TEXT NOT NULL CHECK (length(resource_type) BETWEEN 1 AND 80),
  resource_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'failure', 'pending')),
  details_json TEXT NOT NULL DEFAULT '{}',
  correlation_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created
  ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource
  ON audit_events(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation
  ON audit_events(correlation_id);
