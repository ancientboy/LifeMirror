-- S7 product-validation signals. This migration widens the content-free
-- behavioral ledger without storing prompts, conversations, people or events.
CREATE TABLE product_metric_events_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'chat_message_sent','daily_opened','daily_checkin_completed','mirror_result_ready',
    'tool_continued_chat','share_card_shared','share_link_created','share_response_created',
    'first_reply_received','conversation_continued','life_loop_created','life_loop_feedback',
    'memory_recall_positive','memory_recall_negative','share_intent'
  )),
  surface TEXT NOT NULL CHECK (surface IN ('chat','daily','mirror','share','relationship')),
  event_key TEXT NOT NULL CHECK (length(event_key) BETWEEN 8 AND 120),
  occurred_at TEXT NOT NULL,
  UNIQUE (user_id, event_type, event_key)
);
INSERT INTO product_metric_events_v2 SELECT * FROM product_metric_events;
DROP TABLE product_metric_events;
ALTER TABLE product_metric_events_v2 RENAME TO product_metric_events;
CREATE INDEX product_metric_events_user_recent_idx ON product_metric_events(user_id, occurred_at DESC);
CREATE INDEX product_metric_events_type_recent_idx ON product_metric_events(event_type, occurred_at DESC);
