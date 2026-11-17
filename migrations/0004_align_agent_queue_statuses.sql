-- Align the durable queue status constraint with the dispatcher.
-- Older deployed versions used "processing"/"completed"; normalize those
-- rows while rebuilding so existing queued work is preserved.
CREATE TABLE agent_queue_new (
  id TEXT PRIMARY KEY,
  agent_run_id TEXT NOT NULL UNIQUE,
  agent_key TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (length(objective) BETWEEN 1 AND 4000),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 5),
  available_at TEXT NOT NULL,
  locked_until TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
);

INSERT INTO agent_queue_new (
  id, agent_run_id, agent_key, objective, status, attempt_count,
  max_attempts, available_at, locked_until, last_error, created_at, updated_at
)
SELECT
  id, agent_run_id, agent_key, objective,
  CASE status
    WHEN 'processing' THEN 'running'
    WHEN 'completed' THEN 'succeeded'
    ELSE status
  END,
  attempt_count, max_attempts, available_at, locked_until, last_error, created_at, updated_at
FROM agent_queue;

DROP TABLE agent_queue;
ALTER TABLE agent_queue_new RENAME TO agent_queue;

CREATE INDEX IF NOT EXISTS idx_agent_queue_due
  ON agent_queue(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_queue_lease
  ON agent_queue(status, locked_until);
