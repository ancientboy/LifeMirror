-- User-led experience invitations are intentionally separate from both
-- operator beta batches and private friend invitations.
CREATE TABLE IF NOT EXISTS experience_invite_batches (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  initial_slots INTEGER NOT NULL DEFAULT 3 CHECK (initial_slots BETWEEN 1 AND 3),
  max_uses INTEGER NOT NULL DEFAULT 3 CHECK (max_uses BETWEEN 1 AND 10),
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count BETWEEN 0 AND 10),
  qualified_count INTEGER NOT NULL DEFAULT 0 CHECK (qualified_count BETWEEN 0 AND 10),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS experience_invite_batches_owner_recent_idx
  ON experience_invite_batches(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS experience_invite_batches_active_idx
  ON experience_invite_batches(code, revoked_at, expires_at, use_count);

CREATE TABLE IF NOT EXISTS experience_invite_uses (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL REFERENCES experience_invite_batches(id) ON DELETE CASCADE,
  inviter_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  invited_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'accepted' CHECK (state IN ('accepted', 'qualified')),
  accepted_at TEXT NOT NULL,
  qualified_at TEXT,
  bound_at TEXT,
  UNIQUE(invited_user_id)
);
CREATE INDEX IF NOT EXISTS experience_invite_uses_inviter_month_idx
  ON experience_invite_uses(inviter_user_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS experience_invite_uses_invite_idx
  ON experience_invite_uses(invite_id, state, accepted_at DESC);
