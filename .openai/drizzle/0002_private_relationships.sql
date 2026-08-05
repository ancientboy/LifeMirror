CREATE TABLE IF NOT EXISTS social_profiles (
  user_id TEXT PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  discoverable INTEGER NOT NULL DEFAULT 1,
  share_birth_for_relationships INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (requester_id <> recipient_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS relationships_pair_idx
  ON relationships(
    CASE WHEN requester_id < recipient_id THEN requester_id ELSE recipient_id END,
    CASE WHEN requester_id < recipient_id THEN recipient_id ELSE requester_id END
  );
CREATE INDEX IF NOT EXISTS relationships_requester_idx ON relationships(requester_id, status);
CREATE INDEX IF NOT EXISTS relationships_recipient_idx ON relationships(recipient_id, status);

CREATE TABLE IF NOT EXISTS mirror_share_links (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  share_kind TEXT NOT NULL CHECK (share_kind IN ('relationship', 'compare')),
  mirror_kind TEXT NOT NULL,
  quote TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS mirror_share_links_token_idx ON mirror_share_links(token);

CREATE TABLE IF NOT EXISTS mirror_share_responses (
  id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL REFERENCES mirror_share_links(id) ON DELETE CASCADE,
  responder_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('like_me', 'not_me', 'want_compare')),
  created_at TEXT NOT NULL,
  UNIQUE (share_id, responder_id)
);
