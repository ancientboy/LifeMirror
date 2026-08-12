-- Promotion-readiness: invite-only beta identities, progressive onboarding,
-- and content-free chat experience signals. No prompt or conversation text is stored.
CREATE TABLE IF NOT EXISTS beta_invites (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  batch TEXT NOT NULL,
  max_uses INTEGER NOT NULL CHECK (max_uses BETWEEN 1 AND 500),
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS beta_invites_active_idx
  ON beta_invites(revoked_at, expires_at, use_count);

CREATE TABLE IF NOT EXISTS beta_participants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  invite_id TEXT NOT NULL REFERENCES beta_invites(id) ON DELETE RESTRICT,
  batch TEXT NOT NULL,
  bound_email_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS beta_participants_batch_idx
  ON beta_participants(batch, created_at DESC);

CREATE TABLE product_metric_events_v3 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'chat_message_sent','daily_opened','daily_checkin_completed','mirror_result_ready',
    'tool_continued_chat','share_card_shared','share_link_created','share_response_created',
    'first_reply_received','conversation_continued','life_loop_created','life_loop_feedback',
    'memory_recall_positive','memory_recall_negative','share_intent','invite_accepted',
    'onboarding_started','onboarding_prompt_used','generation_stopped','generation_retried',
    'chat_feedback_helpful','chat_feedback_missed','account_bound'
  )),
  surface TEXT NOT NULL CHECK (surface IN ('chat','daily','mirror','share','relationship','onboarding','account')),
  event_key TEXT NOT NULL CHECK (length(event_key) BETWEEN 8 AND 120),
  occurred_at TEXT NOT NULL,
  UNIQUE (user_id, event_type, event_key)
);
INSERT INTO product_metric_events_v3 SELECT * FROM product_metric_events;
DROP TABLE product_metric_events;
ALTER TABLE product_metric_events_v3 RENAME TO product_metric_events;
CREATE INDEX product_metric_events_user_recent_idx ON product_metric_events(user_id, occurred_at DESC);
CREATE INDEX product_metric_events_type_recent_idx ON product_metric_events(event_type, occurred_at DESC);
