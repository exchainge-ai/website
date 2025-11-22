-- ============================================================
-- SECURITY FIX MIGRATION
-- ============================================================
-- This migration addresses critical security vulnerabilities:
-- 1. Adds RLS to unprotected system tables
-- 2. Adds missing DELETE policy for reviews
-- 3. Fixes reviews table column name mismatch (user_id -> reviewer_id)
-- ============================================================

-- ============================================================
-- PART 1: Add RLS to System Tables
-- ============================================================
-- These tables currently have NO RLS, making them vulnerable to
-- tampering via the public anon key. We enable RLS with policies
-- that block all access - service role will bypass these policies.

-- Protect hardware verifications from tampering
ALTER TABLE hardware_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access hardware verifications" ON hardware_verifications
FOR ALL USING (false);

COMMENT ON POLICY "Only service role can access hardware verifications" ON hardware_verifications
IS 'Blocks all anon key access. Service role bypasses RLS for backend operations.';

-- Protect access logs from tampering
ALTER TABLE dataset_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access logs" ON dataset_access_logs
FOR ALL USING (false);

COMMENT ON POLICY "Only service role can access logs" ON dataset_access_logs
IS 'Blocks all anon key access. Service role bypasses RLS for backend logging.';

-- Protect search analytics from injection
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access search queries" ON search_queries
FOR ALL USING (false);

COMMENT ON POLICY "Only service role can access search queries" ON search_queries
IS 'Blocks all anon key access. Service role bypasses RLS for analytics.';

-- ============================================================
-- PART 2: Fix Reviews Table Column Name Mismatch
-- ============================================================
-- The SQL schema has 'user_id' but TypeScript types expect 'reviewer_id'
-- We rename the column to match the types (this is safer than regenerating types)

ALTER TABLE reviews RENAME COLUMN user_id TO reviewer_id;

-- Update the unique constraint to use the new column name
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS unique_user_dataset_review;
ALTER TABLE reviews ADD CONSTRAINT unique_reviewer_dataset_review UNIQUE (dataset_id, reviewer_id);

-- Update all existing policies to use the new column name
-- Also adds missing DELETE policy
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

CREATE POLICY "Users can create reviews" ON reviews
FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON reviews
FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Users can delete own reviews" ON reviews
FOR DELETE USING (reviewer_id = auth.uid());

-- Update the trigger function that references user_id
DROP TRIGGER IF EXISTS update_dataset_rating_trigger ON reviews;
DROP FUNCTION IF EXISTS update_dataset_rating();

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
-- VERIFICATION
-- ============================================================
-- Verify RLS is enabled on all user-facing tables
DO $$
DECLARE
    missing_rls TEXT[];
BEGIN
    SELECT ARRAY_AGG(tablename)
    INTO missing_rls
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'users', 'datasets', 'licenses', 'transactions', 'reviews',
        'notifications', 'discovery_entries', 'hardware_verifications',
        'dataset_access_logs', 'search_queries'
      )
      AND tablename NOT IN (
        SELECT tablename
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE c.relrowsecurity = true
          AND t.schemaname = 'public'
      );

    IF missing_rls IS NOT NULL THEN
        RAISE EXCEPTION 'RLS not enabled on tables: %', missing_rls;
    END IF;

    RAISE NOTICE 'Security verification passed: RLS enabled on all critical tables';
END $$;
