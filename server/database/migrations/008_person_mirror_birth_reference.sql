-- PHASE-010: optional, private birth inputs and stable symbolic references for a Person Mirror.
ALTER TABLE relationship_people
  ADD COLUMN IF NOT EXISTS birth_profile jsonb,
  ADD COLUMN IF NOT EXISTS is_minor boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN relationship_people.birth_profile IS 'Owner-entered private birth input. Symbolic calculations are stored separately as deduplicated user history records.';
COMMENT ON COLUMN relationship_people.is_minor IS 'Private communication-preparation mode only; it must not activate invitations or sharing.';
