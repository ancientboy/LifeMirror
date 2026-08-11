-- Phase 019: expression preferences are deliberately user-authored controls,
-- not inferred personality traits.  They tune how Shiguang presents a response
-- and remain exportable, editable, and removable by the account owner.
CREATE TABLE IF NOT EXISTS expression_preferences (
  user_id TEXT PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'balanced' CHECK (tone IN ('balanced', 'direct', 'gentle', 'clear')),
  length TEXT NOT NULL DEFAULT 'standard' CHECK (length IN ('short', 'standard', 'detailed')),
  follow_up TEXT NOT NULL DEFAULT 'natural' CHECK (follow_up IN ('natural', 'ask', 'avoid')),
  updated_at TEXT NOT NULL
);

-- Components are independently versioned so a future offline replay can
-- explain which ranking/expression policy produced an observation without
-- modifying the original event or user-authored fact.
INSERT OR IGNORE INTO runtime_versions(component, version, updated_at)
  VALUES
    ('context_builder', 2, '2026-08-11T00:00:00.000Z'),
    ('shiguang_expression_policy', 1, '2026-08-11T00:00:00.000Z');
