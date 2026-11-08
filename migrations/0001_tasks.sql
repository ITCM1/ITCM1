CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT 'Management',
  priority TEXT NOT NULL CHECK (priority IN ('high', 'normal', 'low')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
