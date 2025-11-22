-- Add upload tracking and status fields

-- Add upload status to datasets
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS upload_status VARCHAR(20) DEFAULT 'complete',
ADD COLUMN IF NOT EXISTS upload_progress INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS upload_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS upload_completed_at TIMESTAMP WITH TIME ZONE;

-- Create upload_sessions table for tracking multi-part uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64),
  upload_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'complete', 'failed', 'cancelled'
  chunks_total INT,
  chunks_uploaded INT DEFAULT 0,
  progress_percent INT DEFAULT 0,
  r2_upload_id VARCHAR(255), -- Multi-part upload ID from R2
  r2_key VARCHAR(500),
  presigned_url_expires_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  retry_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_sessions_dataset ON upload_sessions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(upload_status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_cleanup 
  ON upload_sessions(last_activity_at, upload_status)
  WHERE upload_status IN ('in_progress', 'pending');

-- Create user_quotas table for rate limiting
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id UUID PRIMARY KEY,
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  uploads_today INT DEFAULT 0,
  uploads_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day'),
  total_storage_bytes BIGINT DEFAULT 0,
  max_storage_bytes BIGINT DEFAULT 53687091200, -- 50 GB default
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_quotas_tier ON user_quotas(tier);

-- Add comments
COMMENT ON TABLE upload_sessions IS 'Tracks multi-part upload progress and enables resume capability';
COMMENT ON TABLE user_quotas IS 'Tracks storage quotas and upload limits per user';
COMMENT ON COLUMN datasets.upload_status IS 'Status of file upload: pending, in_progress, complete, failed';
COMMENT ON COLUMN datasets.upload_progress IS 'Upload progress percentage (0-100)';
