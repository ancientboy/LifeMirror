CREATE TABLE IF NOT EXISTS event_memories (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  source_event_id uuid NOT NULL UNIQUE REFERENCES reflection_events(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  topic text NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 80),
  trigger_text text NOT NULL CHECK (char_length(trigger_text) BETWEEN 1 AND 500),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 1000),
  occurred_at timestamptz NOT NULL,
  visibility text NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  user_corrected boolean NOT NULL DEFAULT false,
  training_data_eligible boolean NOT NULL DEFAULT false CHECK (training_data_eligible = false),
  extracted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reflection_memories (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  source_event_id uuid NOT NULL UNIQUE REFERENCES reflection_events(id) ON DELETE CASCADE,
  observation text NOT NULL CHECK (char_length(observation) BETWEEN 1 AND 2000),
  insight text NOT NULL CHECK (char_length(insight) BETWEEN 1 AND 2000),
  reflection_question text NOT NULL CHECK (char_length(reflection_question) BETWEEN 1 AND 1000),
  action_suggestion text NOT NULL CHECK (char_length(action_suggestion) BETWEEN 1 AND 1000),
  concepts text[] NOT NULL DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  user_corrected boolean NOT NULL DEFAULT false,
  training_data_eligible boolean NOT NULL DEFAULT false CHECK (training_data_eligible = false),
  extracted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pattern_memories (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  pattern_key text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 1000),
  signal_count integer NOT NULL CHECK (signal_count >= 2),
  confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  first_observed_at timestamptz NOT NULL,
  last_observed_at timestamptz NOT NULL,
  visibility text NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  user_corrected boolean NOT NULL DEFAULT false,
  training_data_eligible boolean NOT NULL DEFAULT false CHECK (training_data_eligible = false),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pattern_key)
);

CREATE TABLE IF NOT EXISTS pattern_memory_evidence (
  pattern_id uuid NOT NULL REFERENCES pattern_memories(id) ON DELETE CASCADE,
  source_event_id uuid NOT NULL REFERENCES reflection_events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pattern_id, source_event_id)
);

CREATE TABLE IF NOT EXISTS memory_pattern_suppressions (
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  pattern_key text NOT NULL,
  suppressed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pattern_key)
);

CREATE TABLE IF NOT EXISTS memory_processing_runs (
  source_event_id uuid PRIMARY KEY REFERENCES reflection_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  processing_version integer NOT NULL,
  status text NOT NULL CHECK (status IN ('completed', 'failed')),
  error_code text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_memories_user_timeline_idx
  ON event_memories(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS reflection_memories_user_timeline_idx
  ON reflection_memories(user_id, extracted_at DESC);
CREATE INDEX IF NOT EXISTS pattern_memories_user_recent_idx
  ON pattern_memories(user_id, last_observed_at DESC);
CREATE INDEX IF NOT EXISTS pattern_memory_evidence_source_idx
  ON pattern_memory_evidence(source_event_id);

COMMENT ON TABLE event_memories IS
  'User-owned Event Memory. Explicitly excluded from model training.';
COMMENT ON TABLE reflection_memories IS
  'User-owned Reflection Memory. Explicitly excluded from model training.';
COMMENT ON TABLE pattern_memories IS
  'Evidence-backed Pattern Memory foundation. It does not update Mirror DNA and is excluded from model training.';
COMMENT ON TABLE memory_pattern_suppressions IS
  'User-owned deletion control preventing an automatically derived pattern from being silently recreated.';
