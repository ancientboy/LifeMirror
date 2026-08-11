-- Phase 018: a private, in-app notification ledger.  The copy is fixed system
-- text; it never embeds relationship questions, answers, share quotes or names.
CREATE TABLE IF NOT EXISTS social_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  relationship_request INTEGER NOT NULL DEFAULT 1,
  relationship_accepted INTEGER NOT NULL DEFAULT 1,
  relationship_question INTEGER NOT NULL DEFAULT 1,
  share_response INTEGER NOT NULL DEFAULT 1,
  quiet_hours_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS social_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('relationship_request', 'relationship_accepted', 'relationship_question', 'share_response')),
  relationship_id TEXT,
  actor_user_id TEXT REFERENCES identity_users(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'unread' CHECK (state IN ('unread', 'read')),
  created_at TEXT NOT NULL,
  read_at TEXT,
  UNIQUE (user_id, type, relationship_id, actor_user_id)
);
CREATE INDEX IF NOT EXISTS social_notifications_user_recent_idx ON social_notifications(user_id, state, created_at DESC);
