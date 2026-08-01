CREATE TABLE IF NOT EXISTS reflection_events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  runtime_id uuid NOT NULL UNIQUE,
  question text NOT NULL CHECK (char_length(question) BETWEEN 5 AND 500),
  coin_tosses jsonb NOT NULL,
  hexagram_result jsonb NOT NULL,
  knowledge_context jsonb NOT NULL,
  reflection jsonb NOT NULL,
  llm_provider text NOT NULL,
  llm_model text NOT NULL,
  generated_at timestamptz NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reflection_events_user_saved_idx
  ON reflection_events(user_id, saved_at DESC);

COMMENT ON TABLE reflection_events IS
  'User-owned PHASE-002 Event and Reflection Memory. No pattern inference or model training use.';
