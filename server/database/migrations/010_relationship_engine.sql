-- relationship_people already exists from migration 007. Extend it in place so
-- the Person Mirror birth fields and existing owner-authored notes survive.
ALTER TABLE relationship_people
  ADD COLUMN IF NOT EXISTS relationship_label VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS domain VARCHAR(20) NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS stage VARCHAR(20) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS power_position VARCHAR(24) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS classification_source VARCHAR(24) NOT NULL DEFAULT 'legacy_migration',
  ADD COLUMN IF NOT EXISTS confirmed_by_user BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legacy_person_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
UPDATE relationship_people SET relationship_label = COALESCE(NULLIF(relationship_label, ''), relationship_type, ''), legacy_person_id = COALESCE(legacy_person_id, id::text), confirmed_by_user = relationship_type IS NOT NULL WHERE relationship_label = '' OR legacy_person_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS relationship_people_owner_legacy_idx ON relationship_people(owner_user_id, legacy_person_id) WHERE legacy_person_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS relationship_people_owner_recent_idx ON relationship_people(owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS relationship_cases (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES relationship_people(id) ON DELETE SET NULL,
  goal VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  source VARCHAR(20) NOT NULL,
  initial_text_redacted VARCHAR(800),
  strategy_key VARCHAR(32) NOT NULL,
  recommended_reply VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS relationship_cases_owner_recent_idx ON relationship_cases(owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS relationship_events (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES relationship_people(id) ON DELETE SET NULL,
  case_id UUID NOT NULL REFERENCES relationship_cases(id) ON DELETE CASCADE,
  event_kind VARCHAR(32) NOT NULL,
  payload_json JSONB NOT NULL,
  provenance VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS relationship_events_case_time_idx ON relationship_events(case_id, created_at);

CREATE TABLE IF NOT EXISTS relationship_feedback (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES relationship_people(id) ON DELETE SET NULL,
  case_id UUID NOT NULL REFERENCES relationship_cases(id) ON DELETE CASCADE,
  acted BOOLEAN NOT NULL,
  outcome VARCHAR(20) NOT NULL,
  actual_reply_summary VARCHAR(500),
  suggestion_helpful BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachment_metadata (
  id UUID PRIMARY KEY,
  owner_user_id UUID REFERENCES identity_users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES relationship_cases(id) ON DELETE CASCADE,
  mime_type VARCHAR(80) NOT NULL,
  byte_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  content_hash VARCHAR(128) NOT NULL,
  parse_status VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS relationship_revisions (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  entity_type VARCHAR(16) NOT NULL,
  entity_id VARCHAR(120) NOT NULL,
  revision_kind VARCHAR(20) NOT NULL,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
