-- Storage Policies for ExchAInge
-- Run this in the Supabase SQL Editor to enable file uploads
--
-- Note: We use permissive policies here because we're using Privy for auth,
-- not Supabase Auth. Authorization is handled at the application layer.

-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all uploads to datasets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from datasets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to datasets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from datasets bucket" ON storage.objects;

-- Policy: Allow uploads to datasets bucket
-- We validate ownership at the application layer via Privy auth
CREATE POLICY "Allow all uploads to datasets bucket"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'datasets'
);

-- Policy: Allow reads from datasets bucket
CREATE POLICY "Allow all reads from datasets bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'datasets'
);

-- Policy: Allow updates to datasets bucket
CREATE POLICY "Allow all updates to datasets bucket"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (
  bucket_id = 'datasets'
)
WITH CHECK (
  bucket_id = 'datasets'
);

-- Policy: Allow deletes from datasets bucket
CREATE POLICY "Allow all deletes from datasets bucket"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'datasets'
);
