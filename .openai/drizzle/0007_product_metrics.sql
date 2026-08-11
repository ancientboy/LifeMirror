-- PHASE-017: minimal product signals used to evaluate retention and flows.
-- This ledger deliberately excludes conversation text, person identifiers,
-- draft content, share quotes and model prompts. event_key is an opaque,
-- client/generated idempotency key, never a user-facing identifier.
CREATE TABLE IF NOT EXISTS product_metric_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'chat_message_sent',
    'daily_opened',
    'daily_checkin_completed',
    'mirror_result_ready',
    'tool_continued_chat',
    'share_card_shared',
    'share_link_created',
    'share_response_created'
  )),
  surface TEXT NOT NULL CHECK (surface IN ('chat', 'daily', 'mirror', 'share', 'relationship')),
  event_key TEXT NOT NULL CHECK (length(event_key) BETWEEN 8 AND 120),
  occurred_at TEXT NOT NULL,
  UNIQUE (user_id, event_type, event_key)
);

CREATE INDEX IF NOT EXISTS product_metric_events_user_recent_idx
  ON product_metric_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS product_metric_events_type_recent_idx
  ON product_metric_events(event_type, occurred_at DESC);
