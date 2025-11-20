-- Add onchain licenses table for tracking Sui Move licenses
--
-- This table syncs with the Sui blockchain to track licenses issued via smart contract.
-- The backend worker polls Sui events and populates this table.

-- License table for blockchain-issued licenses
CREATE TABLE onchain_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Blockchain identifiers
    license_id VARCHAR(66) NOT NULL UNIQUE, -- Sui object ID
    transaction_hash VARCHAR(88) NOT NULL, -- Sui transaction digest

    -- License details (synced from blockchain)
    dataset_cid VARCHAR(255) NOT NULL,
    licensee_address VARCHAR(66) NOT NULL, -- Sui address
    license_type VARCHAR(50) NOT NULL, -- personal, commercial, research

    -- Timestamps (from blockchain)
    issued_at BIGINT NOT NULL, -- Unix timestamp in ms
    expires_at BIGINT, -- Unix timestamp in ms (NULL = never expires)

    -- Status
    is_revoked BOOLEAN DEFAULT false,
    revoked_at BIGINT,
    revoked_by VARCHAR(66),

    -- Dataset owner (who issued the license)
    dataset_owner_address VARCHAR(66) NOT NULL,

    -- Local mapping (optional - link to our users table)
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,

    -- Sync metadata
    blockchain_network VARCHAR(50) DEFAULT 'sui-testnet',
    sync_status VARCHAR(50) DEFAULT 'synced', -- synced, pending, failed
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_onchain_licenses_dataset_cid ON onchain_licenses(dataset_cid);
CREATE INDEX idx_onchain_licenses_licensee ON onchain_licenses(licensee_address);
CREATE INDEX idx_onchain_licenses_license_id ON onchain_licenses(license_id);
CREATE INDEX idx_onchain_licenses_dataset_id ON onchain_licenses(dataset_id) WHERE dataset_id IS NOT NULL;
CREATE INDEX idx_onchain_licenses_buyer_id ON onchain_licenses(buyer_id) WHERE buyer_id IS NOT NULL;
CREATE INDEX idx_onchain_licenses_active ON onchain_licenses(dataset_cid, licensee_address)
    WHERE is_revoked = false AND (expires_at IS NULL OR expires_at > EXTRACT(EPOCH FROM NOW()) * 1000);

-- Trigger to update updated_at
CREATE TRIGGER update_onchain_licenses_updated_at
    BEFORE UPDATE ON onchain_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper function to check if a license is valid
CREATE OR REPLACE FUNCTION is_onchain_license_valid(license_row onchain_licenses)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if revoked
    IF license_row.is_revoked THEN
        RETURN false;
    END IF;

    -- Check if expired (NULL = never expires)
    IF license_row.expires_at IS NOT NULL
       AND license_row.expires_at < EXTRACT(EPOCH FROM NOW()) * 1000 THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for active licenses only
CREATE VIEW active_onchain_licenses AS
SELECT * FROM onchain_licenses
WHERE is_revoked = false
  AND (expires_at IS NULL OR expires_at > EXTRACT(EPOCH FROM NOW()) * 1000);

COMMENT ON TABLE onchain_licenses IS 'Tracks licenses issued via Sui Move smart contract';
COMMENT ON COLUMN onchain_licenses.license_id IS 'Sui object ID of the License NFT';
COMMENT ON COLUMN onchain_licenses.transaction_hash IS 'Sui transaction digest where license was issued';
COMMENT ON COLUMN onchain_licenses.dataset_cid IS 'Content identifier of the licensed dataset';
COMMENT ON COLUMN onchain_licenses.issued_at IS 'Unix timestamp in milliseconds when license was issued';
COMMENT ON COLUMN onchain_licenses.expires_at IS 'Unix timestamp in milliseconds when license expires (NULL = never)';
