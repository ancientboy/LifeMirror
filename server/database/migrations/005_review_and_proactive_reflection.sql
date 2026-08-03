CREATE TABLE IF NOT EXISTS proactive_reflection_preferences (
  user_id uuid PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  weekly_enabled boolean NOT NULL DEFAULT true,
  monthly_enabled boolean NOT NULL DEFAULT true,
  cooldown_hours integer NOT NULL DEFAULT 168 CHECK (cooldown_hours BETWEEN 24 AND 744),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proactive_reflection_deliveries (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  cadence text NOT NULL CHECK (cadence IN ('weekly', 'monthly')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  evidence_count integer NOT NULL CHECK (evidence_count >= 0),
  status text NOT NULL CHECK (status IN ('suggested', 'opened', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cadence, period_end)
);

CREATE INDEX IF NOT EXISTS proactive_reflection_deliveries_recent_idx
  ON proactive_reflection_deliveries(user_id, created_at DESC);

COMMENT ON TABLE proactive_reflection_preferences IS
  'User-controlled opt-out and cadence settings for non-coercive proactive reflection suggestions.';
COMMENT ON TABLE proactive_reflection_deliveries IS
  'Delivery and deduplication record only; review evidence remains in user-owned memory tables.';
