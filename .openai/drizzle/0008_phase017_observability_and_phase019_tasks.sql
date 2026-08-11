-- Phase 017: operational audit data is deliberately content-free.  It lets us
-- investigate latency, provider failures and cost without copying a chat,
-- prompt, person name, share token, or recalled memory into telemetry.
CREATE TABLE IF NOT EXISTS llm_call_audits (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES identity_users(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN ('chat', 'daily_guidance', 'mirror_result', 'liuyao_reflection')),
  provider TEXT NOT NULL CHECK (length(provider) BETWEEN 1 AND 80),
  model TEXT NOT NULL CHECK (length(model) BETWEEN 1 AND 160),
  outcome TEXT NOT NULL CHECK (outcome IN ('succeeded', 'failed', 'timed_out')),
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  input_bytes INTEGER NOT NULL DEFAULT 0 CHECK (input_bytes >= 0),
  output_bytes INTEGER NOT NULL DEFAULT 0 CHECK (output_bytes >= 0),
  estimated_cost_microusd INTEGER NOT NULL DEFAULT 0 CHECK (estimated_cost_microusd >= 0),
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS llm_call_audits_recent_idx
  ON llm_call_audits(occurred_at DESC);
CREATE INDEX IF NOT EXISTS llm_call_audits_operation_idx
  ON llm_call_audits(operation, outcome, occurred_at DESC);

-- Phase 019: a durable, idempotent task ledger.  References are opaque IDs;
-- no user text or derived understanding is stored in task payloads.  This is
-- intentionally a queue contract, not an opportunity to recreate deleted data.
CREATE TABLE IF NOT EXISTS background_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  task_kind TEXT NOT NULL CHECK (task_kind IN ('refresh_observations')),
  source_event_id TEXT NOT NULL REFERENCES memory_events(id) ON DELETE CASCADE,
  task_version INTEGER NOT NULL CHECK (task_version >= 1),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TEXT NOT NULL,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS background_tasks_ready_idx
  ON background_tasks(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS background_tasks_user_idx
  ON background_tasks(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS runtime_versions (
  component TEXT PRIMARY KEY,
  version INTEGER NOT NULL CHECK (version >= 1),
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO runtime_versions(component, version, updated_at)
  VALUES ('observation_extractor', 1, '2026-08-11T00:00:00.000Z');
