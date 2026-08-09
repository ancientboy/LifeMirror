-- PHASE-009: a single, user-owned persistence boundary for every mirror source.
-- Tool output is history, not a statement of fact about the user.
CREATE TABLE IF NOT EXISTS user_history_records (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  source_kind text NOT NULL CHECK (source_kind IN ('liuyao', 'tarot', 'bazi', 'astrology', 'conversation')),
  source_record_key text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 2000),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  stable_reference boolean NOT NULL DEFAULT false,
  important boolean NOT NULL DEFAULT false,
  open_loop_status text NOT NULL DEFAULT 'unknown' CHECK (open_loop_status IN ('open', 'resolved', 'unknown')),
  person_id uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_kind, source_record_key)
);

CREATE TABLE IF NOT EXISTS user_explicit_facts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  fact_text text NOT NULL CHECK (char_length(fact_text) BETWEEN 2 AND 500),
  fact_kind text NOT NULL CHECK (fact_kind IN ('explicit_memory', 'confirmed_event', 'communication_preference')),
  source_conversation_key text,
  visibility text NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, fact_text)
);

CREATE TABLE IF NOT EXISTS relationship_people (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  relationship_type text,
  user_description text,
  communication_notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_history_records
  ADD CONSTRAINT user_history_records_person_id_fkey
  FOREIGN KEY (person_id) REFERENCES relationship_people(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_history_records_timeline_idx ON user_history_records(user_id, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_history_records_open_loop_idx ON user_history_records(user_id, open_loop_status, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_explicit_facts_recent_idx ON user_explicit_facts(user_id, updated_at DESC) WHERE visibility = 'visible';
CREATE INDEX IF NOT EXISTS relationship_people_owner_idx ON relationship_people(owner_user_id, updated_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE user_history_records IS 'PHASE-009 unified, user-owned History. Symbolic tool output remains evidence only and never becomes a person fact by itself.';
COMMENT ON TABLE user_explicit_facts IS 'Only explicit user memory, confirmed events, and communication preferences may enter this table.';
COMMENT ON TABLE relationship_people IS 'Private, owner-authored relationship perspective. It does not claim facts about the other person.';
