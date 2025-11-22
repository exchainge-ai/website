-- RLS Policies for ExchAInge
-- Run this in the Supabase SQL Editor AFTER running the initial schema migration

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

DROP POLICY IF EXISTS "Anyone can view live datasets" ON datasets;
DROP POLICY IF EXISTS "Users can create datasets" ON datasets;
DROP POLICY IF EXISTS "Users can update own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can delete own datasets" ON datasets;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO public
USING ((id = auth.uid()) AND (deleted_at IS NULL));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO public
USING (id = auth.uid());

-- ============================================================
-- DATASETS TABLE POLICIES
-- ============================================================

-- Anyone can view live datasets
CREATE POLICY "Anyone can view live datasets"
ON datasets
FOR SELECT
TO public
USING (
    ((status = 'live' AND archived_at IS NULL) OR user_id = auth.uid())
    OR (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.deleted_at IS NULL 
            AND users.is_admin = true
        )
    )
);

-- Users can create their own datasets
CREATE POLICY "Users can create datasets"
ON datasets
FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

-- Users can update their own datasets
CREATE POLICY "Users can update own datasets"
ON datasets
FOR UPDATE
TO public
USING (
    user_id = auth.uid()
    OR (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.deleted_at IS NULL 
            AND users.is_admin = true
        )
    )
);

-- Users can delete their own datasets
CREATE POLICY "Users can delete own datasets"
ON datasets
FOR DELETE
TO public
USING (
    user_id = auth.uid()
    OR (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.deleted_at IS NULL 
            AND users.is_admin = true
        )
    )
);

-- ============================================================
-- LICENSES TABLE POLICIES
-- ============================================================

-- Users can view their own licenses
CREATE POLICY "Users can view own licenses"
ON licenses
FOR SELECT
TO public
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ============================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON transactions
FOR SELECT
TO public
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- ============================================================
-- REVIEWS TABLE POLICIES
-- ============================================================

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON reviews
FOR SELECT
TO public
USING (true);

-- Users can create reviews
CREATE POLICY "Users can create reviews"
ON reviews
FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON reviews
FOR UPDATE
TO public
USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
TO public
USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
TO public
USING (user_id = auth.uid());
