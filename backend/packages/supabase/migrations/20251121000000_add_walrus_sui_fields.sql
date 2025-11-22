-- Add Walrus and Sui blockchain fields to datasets table
-- For hackathon demo - supports Walrus decentralized storage and Sui blockchain

ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS blob_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS tx_digest VARCHAR(88),
ADD COLUMN IF NOT EXISTS blockchain VARCHAR(50) DEFAULT 'solana',
ADD COLUMN IF NOT EXISTS walrus_epochs INTEGER;

-- Add indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_datasets_blob_id ON datasets(blob_id);
CREATE INDEX IF NOT EXISTS idx_datasets_tx_digest ON datasets(tx_digest);
CREATE INDEX IF NOT EXISTS idx_datasets_blockchain ON datasets(blockchain);

-- Add comments
COMMENT ON COLUMN datasets.blob_id IS 'Walrus blob ID for decentralized storage';
COMMENT ON COLUMN datasets.tx_digest IS 'Sui transaction digest for onchain registration';
COMMENT ON COLUMN datasets.blockchain IS 'Blockchain used: solana or sui';
COMMENT ON COLUMN datasets.walrus_epochs IS 'Number of epochs file is stored on Walrus';
