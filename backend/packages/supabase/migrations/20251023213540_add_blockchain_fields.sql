-- Add blockchain registration fields to datasets table

ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS blockchain_registry_account VARCHAR(255),
ADD COLUMN IF NOT EXISTS blockchain_explorer_url TEXT,
ADD COLUMN IF NOT EXISTS blockchain_registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dataset_hash VARCHAR(64);

-- Create index for blockchain lookups
CREATE INDEX IF NOT EXISTS idx_datasets_blockchain_tx ON datasets(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_datasets_registry_account ON datasets(blockchain_registry_account);
CREATE INDEX IF NOT EXISTS idx_datasets_hash ON datasets(dataset_hash);

-- Add comment
COMMENT ON COLUMN datasets.blockchain_tx_hash IS 'Solana transaction signature for dataset registration';
COMMENT ON COLUMN datasets.blockchain_registry_account IS 'Solana registry account public key';
COMMENT ON COLUMN datasets.blockchain_explorer_url IS 'Solana Explorer URL for viewing transaction';
COMMENT ON COLUMN datasets.dataset_hash IS 'SHA256 hash of dataset (stored on-chain)';
