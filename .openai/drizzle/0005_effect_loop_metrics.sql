-- Phase010: privacy-preserving effect-loop telemetry.
-- This table deliberately contains no rehearsal text, feedback text, outcome,
-- or a real person's name. relationship_key is an opaque client identifier
-- used only to count repeat practice within the account.
CREATE TABLE IF NOT EXISTS relationship_effect_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  loop_id TEXT NOT NULL,
  relationship_key TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL CHECK (event_type IN ('rehearsal_started', 'followup_seen', 'action_taken', 'feedback_reported')),
  occurred_at TEXT NOT NULL,
  UNIQUE (user_id, loop_id, event_type)
);
CREATE INDEX IF NOT EXISTS relationship_effect_events_user_type_idx
  ON relationship_effect_events(user_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS relationship_effect_events_user_relationship_idx
  ON relationship_effect_events(user_id, relationship_key, occurred_at DESC);
