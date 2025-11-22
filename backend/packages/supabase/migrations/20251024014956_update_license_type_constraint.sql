-- Update license_type constraint to support new license types
-- This allows for modern licensing models like Creative Commons, commercial resale, etc.

-- Drop the old constraint
ALTER TABLE datasets DROP CONSTRAINT IF EXISTS datasets_license_type_check;

-- Add new constraint with expanded license types
ALTER TABLE datasets ADD CONSTRAINT datasets_license_type_check CHECK (
  license_type IN (
    -- Original types (keep for backwards compatibility)
    'view_only',
    'view_only_shared',
    'shared_ownership',
    'exclusive',
    'transferable_exclusive',
    -- New Creative Commons types
    'cc0',
    'cc-by',
    'cc-by-sa',
    'cc-by-nc',
    'cc-by-nc-sa',
    'cc-by-nd',
    -- New commercial types
    'royalty-free',
    'commercial-resale',
    'subscription',
    'custom'
  )
);

-- Add comment explaining the license types
COMMENT ON COLUMN datasets.license_type IS 'License model for dataset usage. Supports Creative Commons (cc0, cc-by, etc), commercial (royalty-free, commercial-resale), subscription, and custom terms.';
