-- Phase 011/017/019 release reliability.  Tombstones prevent an old device
-- snapshot from recreating a user-owned record after deletion.
CREATE TABLE IF NOT EXISTS account_item_tombstones (
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  item_kind TEXT NOT NULL CHECK (item_kind IN ('fact', 'history', 'person', 'relationship_loop')),
  item_id TEXT NOT NULL,
  deleted_at TEXT NOT NULL,
  PRIMARY KEY (user_id, item_kind, item_id)
);
CREATE INDEX IF NOT EXISTS account_item_tombstones_recent_idx
  ON account_item_tombstones(user_id, deleted_at DESC);

-- The moderation queue deliberately stores only fixed reason/status codes.
-- It never copies a question, response, chat, person profile, or birth record.
ALTER TABLE relationship_safety_reports ADD COLUMN status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'reviewed', 'closed'));
ALTER TABLE relationship_safety_reports ADD COLUMN resolution_code TEXT
  CHECK (resolution_code IS NULL OR resolution_code IN ('confirmed', 'no_action', 'duplicate'));
ALTER TABLE relationship_safety_reports ADD COLUMN reviewed_at TEXT;

ALTER TABLE social_notification_preferences ADD COLUMN email_enabled INTEGER NOT NULL DEFAULT 0;

-- External delivery is opt-in at the transport layer.  The outbox contains
-- only a notification id and delivery state; the fixed in-app copy remains in
-- social_notifications and no private content is duplicated here.
CREATE TABLE IF NOT EXISTS notification_delivery_outbox (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL REFERENCES social_notifications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email')),
  state TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'sent', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TEXT NOT NULL,
  delivered_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (notification_id, channel)
);
CREATE INDEX IF NOT EXISTS notification_delivery_ready_idx
  ON notification_delivery_outbox(state, available_at, created_at);

-- Minimal, content-free share funnel.  The opaque share id lets operations
-- measure create -> open -> response without copying the share quote or meta.
CREATE TABLE IF NOT EXISTS share_funnel_events (
  id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL REFERENCES mirror_share_links(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES identity_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'opened', 'responded', 'relationship_requested')),
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS share_funnel_events_time_idx
  ON share_funnel_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS share_funnel_events_share_idx
  ON share_funnel_events(share_id, occurred_at);

-- Content-free recovery attestations make disaster drills auditable without
-- creating a shadow copy of customer data inside the application database.
CREATE TABLE IF NOT EXISTS recovery_drill_runs (
  id TEXT PRIMARY KEY,
  source_commit TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
  checks_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO runtime_versions(component, version, updated_at)
  VALUES
    ('account_merge_policy', 2, '2026-08-11T00:00:00.000Z'),
    ('notification_policy', 2, '2026-08-11T00:00:00.000Z'),
    ('release_recovery_contract', 1, '2026-08-11T00:00:00.000Z');
