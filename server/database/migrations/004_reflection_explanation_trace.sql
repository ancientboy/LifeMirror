ALTER TABLE reflection_events
  ADD COLUMN IF NOT EXISTS explanation_trace jsonb;

COMMENT ON COLUMN reflection_events.explanation_trace IS
  'Internal audit trace: traditional basis, deterministic Liuyao factors, reflection mapping and final Shiguang response.';
