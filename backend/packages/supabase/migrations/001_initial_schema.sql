/*
 *
 * TODOs:
 * 1. Add database-level constraints for data quality 
 * 2. Implement proper data partitioning strategies
 * 3. Add indexes for common query patterns
 * 4. Set up audit logging at the database level
 * 5. Optimize table compression settings
 * 6. Add materialized views for analytics
 * 7. Implement proper backup and restore procedures
 * 8. Set up point-in-time recovery
 * 9. Add database-level access controls
 * 10. Implement data archival procedures
 * 11. Add telemetry for query performance
 * 12. Set up replication for high availability
 * 13. Add proper health check procedures
 * 14. Implement proper cascading rules
 * 15. Add database-level encryption
 */

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- ============================================================
-- ENUMS & TYPES
-- ============================================================

CREATE TYPE dataset_status AS ENUM ('draft', 'pending', 'live', 'rejected', 'archived');
CREATE TYPE dataset_category AS ENUM (
    'robotics', 'autonomous_vehicles', 'drone', 'manipulation', 
    'navigation', 'sensor_data', 'human_robot_interaction', 
    'embodied_ai', 'motion_capture', 'other'
);
CREATE TYPE license_status AS ENUM ('active', 'expired', 'revoked', 'transferred');
CREATE TYPE transaction_type AS ENUM ('purchase', 'royalty', 'withdrawal', 'refund', 'platform_fee');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE access_type AS ENUM ('view', 'preview', 'download', 'stream', 'api_access');
CREATE TYPE hardware_vendor AS ENUM ('dji', 'nvidia', 'qualcomm', 'custom');
CREATE TYPE notification_type AS ENUM (
    'dataset_purchased', 'dataset_verified', 'dataset_rejected', 
    'new_review', 'revenue_milestone', 'license_expiring', 
    'system_announcement'
);

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity (Privy integration)
    privy_id VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(100),
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,

    -- Profile
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    company_name VARCHAR(255),
    company_website VARCHAR(255),

    -- Account type & roles
    account_type VARCHAR(50) DEFAULT 'individual' CHECK (account_type IN ('individual', 'researcher', 'enterprise')),
    is_admin BOOLEAN DEFAULT false,
    kyc_verified BOOLEAN DEFAULT false,
    kyc_verified_at TIMESTAMPTZ,
    
    -- Settings
    notification_preferences JSONB DEFAULT '{"email": true, "platform": true}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profile_public": true}'::jsonb,
    
    -- Metrics (denormalized for performance)
    total_revenue DECIMAL(20, 6) DEFAULT 0.00,
    total_sales INTEGER DEFAULT 0,
    total_datasets INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT positive_revenue CHECK (total_revenue >= 0),
    CONSTRAINT positive_sales CHECK (total_sales >= 0)
);

-- Datasets table
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metadata
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category dataset_category NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Pricing & Licensing
    price_usdc DECIMAL(20, 6) NOT NULL CHECK (price_usdc >= 0),
    license_type VARCHAR(50) NOT NULL CHECK (license_type IN (
        'view_only', 'view_only_shared', 'shared_ownership', 
        'exclusive', 'transferable_exclusive'
    )),
    
    -- Usage rights
    commercial_use BOOLEAN DEFAULT false,
    derivative_works_allowed BOOLEAN DEFAULT false,
    redistribution_allowed BOOLEAN DEFAULT false,
    attribution_required BOOLEAN DEFAULT true,
    consent_required BOOLEAN DEFAULT false,
    ai_training_allowed BOOLEAN DEFAULT true,
    geographic_restrictions BOOLEAN DEFAULT false,
    geographic_regions TEXT[],
    
    -- Royalty & Revenue
    royalty_bps INTEGER DEFAULT 0 CHECK (royalty_bps >= 0 AND royalty_bps <= 5000),
    max_owners INTEGER CHECK (max_owners > 0 AND max_owners <= 10000),
    license_duration_days INTEGER CHECK (license_duration_days > 0 AND license_duration_days <= 3650),
    
    -- Dataset Details
    file_format VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    size_formatted VARCHAR(50),
    
    -- Storage
    storage_provider VARCHAR(50) DEFAULT 's3',
    storage_key TEXT NOT NULL,
    storage_bucket VARCHAR(255),
    thumbnail_url TEXT,
    preview_files JSONB,
    
    -- Verification
    verification_status BOOLEAN DEFAULT false,
    verification_score INTEGER CHECK (verification_score >= 0 AND verification_score <= 100),
    verification_date TIMESTAMPTZ,
    hardware_verified BOOLEAN DEFAULT false,
    sp1_proof_hash BYTEA,
    sp1_commitment BYTEA,
    
    -- Blockchain Integration
    solana_listing_pubkey VARCHAR(88),
    solana_tx_signature VARCHAR(88),
    blockchain_sync_status VARCHAR(50) DEFAULT 'pending',
    
    -- Status & Workflow
    status dataset_status NOT NULL DEFAULT 'draft',
    status_reason TEXT,
    
    -- Metrics (denormalized)
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(20, 6) DEFAULT 0.00,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Marketplace visibility
    is_featured BOOLEAN DEFAULT false,
    featured_at TIMESTAMPTZ,
    is_marketplace_only BOOLEAN DEFAULT false,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    
    -- Full-text search
    search_vector TSVECTOR
);

-- Licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- License details
    license_type VARCHAR(50) NOT NULL,
    purchase_price_usdc DECIMAL(20, 6) NOT NULL,
    platform_fee_usdc DECIMAL(20, 6) NOT NULL,
    seller_payout_usdc DECIMAL(20, 6) NOT NULL,
    
    -- Usage rights snapshot
    usage_rights JSONB NOT NULL,
    
    -- Validity
    status license_status NOT NULL DEFAULT 'active',
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiration_date TIMESTAMPTZ,
    
    -- Usage tracking
    access_count INTEGER DEFAULT 0,
    last_access_at TIMESTAMPTZ,
    usage_limit INTEGER,
    download_allowed BOOLEAN DEFAULT true,
    
    -- Transferability
    is_transferable BOOLEAN DEFAULT false,
    transfer_count INTEGER DEFAULT 0,
    original_buyer_id UUID REFERENCES users(id),
    
    -- Blockchain
    solana_license_pubkey VARCHAR(88),
    solana_tx_signature VARCHAR(88),
    blockchain_sync_status VARCHAR(50) DEFAULT 'pending',
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    CONSTRAINT positive_price CHECK (purchase_price_usdc >= 0),
    CONSTRAINT valid_expiration CHECK (expiration_date IS NULL OR expiration_date > purchase_date)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parties
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Related entities
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    
    -- Transaction details
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    
    -- Amounts
    amount_usdc DECIMAL(20, 6) NOT NULL,
    fee_usdc DECIMAL(20, 6) DEFAULT 0.00,
    net_amount_usdc DECIMAL(20, 6) NOT NULL,
    
    -- Payment details
    payment_method VARCHAR(50),
    payment_processor VARCHAR(50),
    
    -- Blockchain
    solana_tx_signature VARCHAR(88),
    blockchain_confirmations INTEGER DEFAULT 0,
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    CONSTRAINT positive_amount CHECK (amount_usdc >= 0)
);

-- Reviews table
-- NOTE: Column 'user_id' is renamed to 'reviewer_id' in migration 20251025030000
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Renamed to reviewer_id in later migration
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT NOT NULL,
    
    -- Quality scores
    data_quality_rating INTEGER CHECK (data_quality_rating >= 1 AND data_quality_rating <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    documentation_rating INTEGER CHECK (documentation_rating >= 1 AND documentation_rating <= 5),
    value_for_money_rating INTEGER CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),
    
    -- Verification
    verified_purchase BOOLEAN DEFAULT false,
    
    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    
    -- Response from seller
    seller_response TEXT,
    seller_response_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_dataset_review UNIQUE (dataset_id, user_id)
);

-- Dataset access logs (partitioned by month)
CREATE TABLE dataset_access_logs (
    id UUID DEFAULT gen_random_uuid(),
    
    -- Relationships
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    
    -- Access details
    access_type access_type NOT NULL,
    
    -- Session info
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    
    -- Geographic
    country_code CHAR(2),
    city VARCHAR(100),
    
    -- Performance
    response_time_ms INTEGER,
    bytes_transferred BIGINT,
    
    -- Audit
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT dataset_access_logs_pk PRIMARY KEY (id, accessed_at),
    
    CHECK (accessed_at >= DATE '2025-10-01')
) PARTITION BY RANGE (accessed_at);

-- Create initial partitions starting October 2025
CREATE TABLE dataset_access_logs_2025_10 PARTITION OF dataset_access_logs
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE dataset_access_logs_2025_11 PARTITION OF dataset_access_logs
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE dataset_access_logs_2025_12 PARTITION OF dataset_access_logs
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Helper function to create next month's partition
CREATE OR REPLACE FUNCTION create_next_partition() RETURNS void AS $$
DECLARE
  next_month DATE;
  month_after DATE;
  partition_name TEXT;
BEGIN
  next_month := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
  month_after := next_month + INTERVAL '1 month';
  partition_name := 'dataset_access_logs_' || to_char(next_month, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF dataset_access_logs FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    next_month,
    month_after
  );
END;
$$ LANGUAGE plpgsql;

-- Hardware verifications table
CREATE TABLE hardware_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    verifier_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Hardware details
    vendor hardware_vendor NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    device_model VARCHAR(200),
    firmware_version VARCHAR(100),
    
    -- Verification scores
    verification_score INTEGER NOT NULL CHECK (verification_score >= 0 AND verification_score <= 100),
    physics_verified BOOLEAN DEFAULT false,
    anti_synthesis_score INTEGER CHECK (anti_synthesis_score >= 0 AND anti_synthesis_score <= 100),
    
    -- SP1 Proof
    sp1_proof_hash BYTEA NOT NULL,
    sp1_public_values_hash BYTEA NOT NULL,
    data_commitment BYTEA NOT NULL,
    
    -- Metadata
    proof_metadata JSONB,
    
    -- Blockchain
    solana_verification_pubkey VARCHAR(88),
    solana_tx_signature VARCHAR(88),
    
    -- Audit
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    nonce BIGINT NOT NULL,
    
    CONSTRAINT valid_scores CHECK (
        verification_score >= 60 AND 
        (anti_synthesis_score IS NULL OR anti_synthesis_score >= 60)
    )
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Action link
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Related entities
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- State
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Delivery
    sent_via_email BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- Search queries table (analytics)
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query details
    query_text TEXT NOT NULL,
    category VARCHAR(100),
    filters JSONB,
    
    -- Results
    result_count INTEGER,
    
    -- User context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    
    -- Engagement
    clicked_dataset_ids UUID[],
    
    -- Audit
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_privy_id ON users(privy_id);
CREATE INDEX idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_revenue ON users(total_revenue DESC) WHERE deleted_at IS NULL;

-- Datasets
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_datasets_status ON datasets(status);
CREATE INDEX idx_datasets_category ON datasets(category);
CREATE INDEX idx_datasets_created_at ON datasets(created_at DESC);
CREATE INDEX idx_datasets_price ON datasets(price_usdc);
CREATE INDEX idx_datasets_verification_score ON datasets(verification_score DESC);
CREATE INDEX idx_datasets_featured ON datasets(is_featured, featured_at DESC) WHERE is_featured = true;
CREATE INDEX idx_datasets_search ON datasets USING gin(search_vector);
CREATE INDEX idx_datasets_marketplace ON datasets(status, category, created_at DESC) 
WHERE status = 'live' AND archived_at IS NULL;
CREATE INDEX idx_datasets_user_active ON datasets(user_id, status, created_at DESC)
WHERE status != 'archived';
CREATE INDEX idx_datasets_tags ON datasets USING gin(tags);

-- Licenses
CREATE INDEX idx_licenses_buyer ON licenses(buyer_id, status);
CREATE INDEX idx_licenses_seller ON licenses(seller_id, status);
CREATE INDEX idx_licenses_dataset ON licenses(dataset_id, status);
CREATE INDEX idx_licenses_expiration ON licenses(expiration_date) WHERE status = 'active';
CREATE INDEX idx_licenses_purchase_date ON licenses(purchase_date DESC);

-- Transactions
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id, created_at DESC);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id, created_at DESC);
CREATE INDEX idx_transactions_dataset ON transactions(dataset_id);
CREATE INDEX idx_transactions_license ON transactions(license_id);
CREATE INDEX idx_transactions_status ON transactions(status, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_solana ON transactions(solana_tx_signature) WHERE solana_tx_signature IS NOT NULL;

-- Reviews
CREATE INDEX idx_reviews_dataset ON reviews(dataset_id, created_at DESC);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(dataset_id, rating DESC);
CREATE INDEX idx_reviews_verified ON reviews(dataset_id, verified_purchase) WHERE verified_purchase = true;

-- Access Logs
CREATE INDEX idx_access_logs_dataset_time ON dataset_access_logs(dataset_id, accessed_at DESC);
CREATE INDEX idx_access_logs_user_time ON dataset_access_logs(user_id, accessed_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_access_logs_license ON dataset_access_logs(license_id) WHERE license_id IS NOT NULL;
CREATE INDEX idx_access_logs_accessed_at ON dataset_access_logs(accessed_at DESC);

-- Hardware Verifications
CREATE INDEX idx_hw_verifications_dataset ON hardware_verifications(dataset_id);
CREATE INDEX idx_hw_verifications_score ON hardware_verifications(verification_score DESC);
CREATE INDEX idx_hw_verifications_verified_at ON hardware_verifications(verified_at DESC);
CREATE UNIQUE INDEX idx_hw_verifications_nonce ON hardware_verifications(nonce);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE is_read = true;

-- Search Queries
CREATE INDEX idx_search_queries_text ON search_queries(query_text);
CREATE INDEX idx_search_queries_user ON search_queries(user_id, searched_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_search_queries_time ON search_queries(searched_at DESC);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update search vector on dataset changes
CREATE TRIGGER tsvector_update_datasets
BEFORE INSERT OR UPDATE ON datasets
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description);

-- Update dataset metrics when reviews are added/updated
CREATE OR REPLACE FUNCTION update_dataset_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE datasets
    SET 
        average_rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM reviews
            WHERE dataset_id = NEW.dataset_id
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE dataset_id = NEW.dataset_id
        )
    WHERE id = NEW.dataset_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dataset_rating_trigger
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_dataset_rating();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Can only see their own data
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (id = auth.uid());

-- Datasets: Public can see live datasets, users can manage their own, admins can see all
CREATE POLICY "Anyone can view live datasets" ON datasets
FOR SELECT USING (
  (status = 'live' AND archived_at IS NULL)
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND deleted_at IS NULL
      AND is_admin = true
  )
);

CREATE POLICY "Users can create datasets" ON datasets
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own datasets" ON datasets
FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND deleted_at IS NULL
      AND is_admin = true
  )
);

CREATE POLICY "Users can delete own datasets" ON datasets
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

-- Licenses: Users can see their own licenses
CREATE POLICY "Users can view own licenses" ON licenses
FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Transactions: Users can see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Reviews: Anyone can read, users can manage their own
CREATE POLICY "Anyone can view reviews" ON reviews
FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON reviews
FOR UPDATE USING (user_id = auth.uid());

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- SEED DATA (Optional - for development)
-- ============================================================

-- Note: In production, seed data should be inserted via application layer
-- This is just an example structure

/*
-- Example user
INSERT INTO users (privy_id, email, display_name, account_type)
VALUES ('did:privy:example123', 'demo@exchainge.ai', 'Demo User', 'individual');

-- Example dataset
INSERT INTO datasets (
    user_id, title, description, category, price_usdc, license_type,
    file_format, size_bytes, size_formatted, storage_key, status
)
SELECT 
    id, 
    'Robot Manipulation Dataset', 
    'High-quality robot manipulation data with RGB-D sensors', 
    'robotics', 
    599.00, 
    'view_only',
    'HDF5, ROS Bag', 
    10737418240, 
    '10 GB', 
    's3://datasets/robot-manip-001',
    'live'
FROM users WHERE email = 'demo@exchainge.ai';
*/

-- =================================================

