-- Add dataset licensing and semantic attestations
-- This migration adds legal licensing terms + reproducibility hashing + semantic tags

-- 1. Add license fields to datasets table
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS license_type VARCHAR(50) DEFAULT 'cc0',
ADD COLUMN IF NOT EXISTS license_terms TEXT,
ADD COLUMN IF NOT EXISTS license_price_usd DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS license_on_chain_metadata JSONB,
ADD COLUMN IF NOT EXISTS can_commercial_use BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_resale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS attribution_required BOOLEAN DEFAULT true;

-- 2. Add reproducibility hashing (canonical file hash for auditability)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS file_content_hash VARCHAR(64), -- SHA-256 of actual file content
ADD COLUMN IF NOT EXISTS file_hash_algorithm VARCHAR(20) DEFAULT 'sha256',
ADD COLUMN IF NOT EXISTS file_hash_verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Add semantic attestations (searchable metadata)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS attestations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS attestation_source VARCHAR(50), -- 'user', 'sp1', 'ai-verified', etc.
ADD COLUMN IF NOT EXISTS semantic_tags JSONB DEFAULT '{}'; -- { "location": "NYC", "type": "pothole", "verified_by": "sp1" }

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_datasets_license_type ON datasets(license_type);
CREATE INDEX IF NOT EXISTS idx_datasets_file_content_hash ON datasets(file_content_hash);
CREATE INDEX IF NOT EXISTS idx_datasets_attestations ON datasets USING GIN(attestations);
CREATE INDEX IF NOT EXISTS idx_datasets_semantic_tags ON datasets USING GIN(semantic_tags);
CREATE INDEX IF NOT EXISTS idx_datasets_commercial_use ON datasets(can_commercial_use) WHERE can_commercial_use = true;

-- 5. Create license_purchases table for tracking license sales
CREATE TABLE IF NOT EXISTS license_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL,
  seller_user_id UUID NOT NULL,
  license_type VARCHAR(50) NOT NULL,
  purchase_price_usd DECIMAL(12, 2) NOT NULL,
  license_terms TEXT NOT NULL,
  blockchain_tx_hash VARCHAR(255), -- Solana transaction proving purchase
  blockchain_signature VARCHAR(500), -- Buyer's signature accepting terms
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited licenses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_purchases_dataset ON license_purchases(dataset_id);
CREATE INDEX IF NOT EXISTS idx_license_purchases_buyer ON license_purchases(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_license_purchases_seller ON license_purchases(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_license_purchases_tx_hash ON license_purchases(blockchain_tx_hash);

-- 6. Add comments for documentation
COMMENT ON COLUMN datasets.license_type IS 'License model: cc0, cc-by, exclusive, commercial-resale, royalty-free, etc.';
COMMENT ON COLUMN datasets.file_content_hash IS 'SHA-256 of raw file content for reproducibility verification';
COMMENT ON COLUMN datasets.attestations IS 'Array of semantic attestations like ["dashcam/road-pothole", "location:NYC", "verified-by:sp1"]';
COMMENT ON COLUMN datasets.semantic_tags IS 'Key-value semantic metadata for advanced queries: {"location": "NYC", "type": "pothole"}';
COMMENT ON TABLE license_purchases IS 'Tracks dataset license purchases with blockchain proof of agreement';
