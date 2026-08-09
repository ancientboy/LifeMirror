-- PHASE-009: a real relationship is made of two independent perspectives
-- and only explicitly shared interactions.  No private observation is copied
-- into the other person's profile.
CREATE TABLE IF NOT EXISTS relationship_person_links (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  owner_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  private_person_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  linked_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'linked', 'declined')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (relationship_id, owner_user_id, private_person_id)
);
CREATE INDEX IF NOT EXISTS relationship_person_links_target_idx ON relationship_person_links(linked_user_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS relationship_questions (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  recipient_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL CHECK (length(question_text) BETWEEN 1 AND 280),
  response_text TEXT CHECK (response_text IS NULL OR length(response_text) BETWEEN 1 AND 500),
  status TEXT NOT NULL CHECK (status IN ('open', 'answered', 'archived')),
  created_at TEXT NOT NULL,
  answered_at TEXT
);
CREATE INDEX IF NOT EXISTS relationship_questions_recipient_idx ON relationship_questions(recipient_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS relationship_questions_sender_idx ON relationship_questions(sender_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS relationship_shared_events (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('question_sent', 'question_answered', 'shared_note')),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 600),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS relationship_shared_events_timeline_idx ON relationship_shared_events(relationship_id, created_at DESC);

CREATE TABLE IF NOT EXISTS context_audit_traces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  surface TEXT NOT NULL,
  fact_count INTEGER NOT NULL DEFAULT 0,
  mirror_count INTEGER NOT NULL DEFAULT 0,
  open_loop_count INTEGER NOT NULL DEFAULT 0,
  shared_event_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS context_audit_traces_user_idx ON context_audit_traces(user_id, created_at DESC);
