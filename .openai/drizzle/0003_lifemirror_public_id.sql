ALTER TABLE social_profiles ADD COLUMN public_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS social_profiles_public_id_idx
  ON social_profiles(public_id)
  WHERE public_id IS NOT NULL;
