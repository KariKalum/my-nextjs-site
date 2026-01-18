-- Enhance submissions table with additional fields
-- This migration adds fields for better submission tracking

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add google_maps_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'google_maps_url'
  ) THEN
    ALTER TABLE submissions ADD COLUMN google_maps_url TEXT;
  END IF;

  -- Add submitter_email if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'submitter_email'
  ) THEN
    ALTER TABLE submissions ADD COLUMN submitter_email TEXT;
  END IF;

  -- Add source if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'source'
  ) THEN
    ALTER TABLE submissions ADD COLUMN source TEXT DEFAULT 'web';
  END IF;

  -- Add wifi_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'wifi_notes'
  ) THEN
    ALTER TABLE submissions ADD COLUMN wifi_notes TEXT;
  END IF;

  -- Add power_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'power_notes'
  ) THEN
    ALTER TABLE submissions ADD COLUMN power_notes TEXT;
  END IF;

  -- Add noise_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'noise_notes'
  ) THEN
    ALTER TABLE submissions ADD COLUMN noise_notes TEXT;
  END IF;

  -- Add time_limit_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'time_limit_notes'
  ) THEN
    ALTER TABLE submissions ADD COLUMN time_limit_notes TEXT;
  END IF;
END $$;

-- Update RLS policies to match requirements
-- Public can only INSERT (not SELECT)
DROP POLICY IF EXISTS "Allow public read submissions" ON submissions;
DROP POLICY IF EXISTS "Allow public update submissions" ON submissions;

-- Authenticated users (admins) can SELECT/UPDATE/DELETE
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON submissions;
DROP POLICY IF EXISTS "Allow authenticated select submissions" ON submissions;
CREATE POLICY "Authenticated users can read submissions"
ON submissions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can update submissions" ON submissions;
DROP POLICY IF EXISTS "Allow authenticated update submissions" ON submissions;
CREATE POLICY "Authenticated users can update submissions"
ON submissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON submissions;
DROP POLICY IF EXISTS "Allow authenticated delete submissions" ON submissions;
CREATE POLICY "Authenticated users can delete submissions"
ON submissions
FOR DELETE
TO authenticated
USING (true);
