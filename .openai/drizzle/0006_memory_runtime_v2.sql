-- Phase 011: the account snapshot remains a backwards-compatible UI cache,
-- while this append-only ledger is the authoritative audit trail for memory.
CREATE TABLE IF NOT EXISTS memory_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('conversation', 'mirror_history', 'explicit_fact', 'daily_checkin')),
  source_key TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  person_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  occurred_at TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, source_kind, source_key)
);
CREATE INDEX IF NOT EXISTS memory_events_recall_idx ON memory_events(user_id, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS memory_events_person_idx ON memory_events(user_id, person_id, occurred_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS memory_observations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  observation_key TEXT NOT NULL,
  -- `global` observations describe the user's own recurring context. Person
  -- scoped observations can only be used by that person's rehearsal context.
  scope_key TEXT NOT NULL DEFAULT 'global',
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 600),
  state TEXT NOT NULL CHECK (state IN ('emerging', 'active', 'fading', 'contradicted', 'deleted')),
  confidence REAL NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  evidence_count INTEGER NOT NULL DEFAULT 0,
  last_observed_at TEXT NOT NULL,
  expires_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, observation_key)
);
CREATE INDEX IF NOT EXISTS memory_observations_recall_idx ON memory_observations(user_id, state, last_observed_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS memory_evidence_links (
  observation_id TEXT NOT NULL REFERENCES memory_observations(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES memory_events(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (observation_id, event_id)
);

CREATE TABLE IF NOT EXISTS memory_revisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('event', 'observation', 'fact', 'history')),
  target_id TEXT NOT NULL,
  revision_kind TEXT NOT NULL CHECK (revision_kind IN ('corrected', 'deleted', 'superseded', 'contradicted')),
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS memory_revisions_target_idx ON memory_revisions(user_id, target_kind, target_id, created_at DESC);
