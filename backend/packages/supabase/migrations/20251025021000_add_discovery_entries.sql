-- Discovery Hub entries (pinboard posts & data requests)

CREATE TABLE IF NOT EXISTS discovery_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('pinboard', 'request')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category dataset_category NOT NULL,
  hardware_type TEXT,
  data_size TEXT,
  estimated_budget TEXT,
  author_name TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  interested_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_entries_type
  ON discovery_entries(entry_type);

CREATE INDEX IF NOT EXISTS idx_discovery_entries_category
  ON discovery_entries(category);

CREATE INDEX IF NOT EXISTS idx_discovery_entries_created_at
  ON discovery_entries(created_at DESC);

ALTER TABLE discovery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discovery entries" ON discovery_entries
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discovery entries" ON discovery_entries
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own discovery entries" ON discovery_entries
FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own discovery entries" ON discovery_entries
FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND deleted_at IS NULL
      AND is_admin = true
  )
);

CREATE OR REPLACE FUNCTION increment_discovery_interest(entry_id uuid)
RETURNS discovery_entries
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row discovery_entries;
BEGIN
  UPDATE discovery_entries
  SET interested_count = interested_count + 1,
      updated_at = NOW()
  WHERE id = entry_id
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;
