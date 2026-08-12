export const identityUsers = `
CREATE TABLE IF NOT EXISTS identity_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  provider TEXT NOT NULL DEFAULT 'email',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const emailCodes = `
CREATE TABLE IF NOT EXISTS email_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TEXT,
  created_at TEXT NOT NULL
)`;

export const sessions = `
CREATE TABLE IF NOT EXISTS identity_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
)`;

export const accountData = `
CREATE TABLE IF NOT EXISTS account_data (
  user_id TEXT PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  settings_json TEXT NOT NULL DEFAULT '{}',
  facts_json TEXT NOT NULL DEFAULT '[]',
  history_json TEXT NOT NULL DEFAULT '[]',
  tarot_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
)`;

export const migrationReceipts = `
CREATE TABLE IF NOT EXISTS guest_migration_receipts (
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  migration_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, migration_id)
)`;

export const betaInvites = `
CREATE TABLE IF NOT EXISTS beta_invites (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  batch TEXT NOT NULL,
  max_uses INTEGER NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const betaParticipants = `
CREATE TABLE IF NOT EXISTS beta_participants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  invite_id TEXT NOT NULL REFERENCES beta_invites(id) ON DELETE RESTRICT,
  batch TEXT NOT NULL,
  bound_email_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id)
)`;
