-- Preserve the current D1 source verbatim during the infrastructure move.  The
-- archive is deliberately separate from the operational schema so no user
-- record is discarded while API compatibility is expanded.
ALTER TABLE identity_users
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS legacy_d1_user BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_codes (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_codes_email_created_idx ON email_codes(email, created_at DESC);

CREATE TABLE IF NOT EXISTS legacy_account_data (
  user_id UUID PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  facts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  tarot_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS d1_migration_runs (
  run_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('receiving', 'completed', 'failed')),
  source_label TEXT NOT NULL DEFAULT 'sites-d1',
  received_rows INTEGER NOT NULL DEFAULT 0,
  source_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS d1_migration_records (
  run_id TEXT NOT NULL REFERENCES d1_migration_runs(run_id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_row_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, source_table, source_row_key)
);
CREATE INDEX IF NOT EXISTS d1_migration_records_table_idx ON d1_migration_records(run_id, source_table);
