ALTER TABLE reflection_events
  ADD COLUMN IF NOT EXISTS interaction_mode text NOT NULL DEFAULT 'reflection'
    CHECK (interaction_mode IN ('reflection', 'deep')),
  ADD COLUMN IF NOT EXISTS runtime_trace jsonb;

COMMENT ON COLUMN reflection_events.interaction_mode IS
  'The user-selected PHASE-006 interaction mode used to generate this reflection.';

COMMENT ON COLUMN reflection_events.runtime_trace IS
  'User-owned explainability trace for mode, memory, knowledge, tool, reflection and trust evaluation stages.';
