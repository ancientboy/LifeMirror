-- PHASE-015/017: privacy-preserving relationship rehearsal lifecycle metrics.
-- No rehearsal draft, feedback text, display name, or third-party data belongs here.
CREATE TABLE IF NOT EXISTS relationship_effect_events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  loop_id uuid NOT NULL,
  relationship_key uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('rehearsal_started', 'followup_seen', 'action_taken', 'feedback_reported')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, loop_id, event_type)
);

CREATE INDEX IF NOT EXISTS relationship_effect_events_user_recent_idx
  ON relationship_effect_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS relationship_effect_events_user_relationship_idx
  ON relationship_effect_events(user_id, relationship_key);

COMMENT ON TABLE relationship_effect_events IS
  'Opaque relationship rehearsal lifecycle counters. It intentionally excludes names, drafts, messages, outcomes, and reflection text.';
