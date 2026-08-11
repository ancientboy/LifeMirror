-- Content-free product feedback metrics. The selected code is operational
-- evidence; user questions and generated interpretations remain in account_data.
CREATE TABLE IF NOT EXISTS mirror_feedback_events (
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  history_id TEXT NOT NULL,
  feedback TEXT NOT NULL CHECK (feedback IN ('resonates', 'needs_correction')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, history_id)
);
CREATE INDEX IF NOT EXISTS mirror_feedback_events_time_idx
  ON mirror_feedback_events(updated_at DESC, feedback);

-- Synthetic release checks persist only booleans and release identity. The
-- temporary users and their test content are deleted before a run completes.
CREATE TABLE IF NOT EXISTS release_acceptance_runs (
  id TEXT PRIMARY KEY,
  source_commit TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
  checks_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS release_acceptance_runs_recent_idx
  ON release_acceptance_runs(created_at DESC);

INSERT OR IGNORE INTO runtime_versions(component, version, updated_at)
  VALUES ('release_acceptance_contract', 1, '2026-08-11T00:00:00.000Z');
