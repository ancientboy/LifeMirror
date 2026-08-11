-- Phase 018: minimal, privacy-preserving safety audit for a relationship.
-- No free-form report body, chat excerpt, private-person record, or birth data
-- belongs in this table. A report immediately blocks the reported relation.
CREATE TABLE IF NOT EXISTS relationship_safety_reports (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL,
  reporter_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  reported_user_id TEXT NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL CHECK (reason_code IN ('harassment', 'impersonation', 'privacy', 'other')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (relationship_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS relationship_safety_reports_reported_idx
  ON relationship_safety_reports(reported_user_id, created_at DESC);
