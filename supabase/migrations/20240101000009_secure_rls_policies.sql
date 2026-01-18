-- Secure RLS policies: Public read-only, Authenticated users = Admins (full CRUD)
-- This migration replaces public write access with authenticated-only access

-- ============================================
-- CAFES TABLE
-- ============================================
-- Remove public write access
DROP POLICY IF EXISTS "Allow public insert access" ON cafes;
DROP POLICY IF EXISTS "Allow public update access" ON cafes;
DROP POLICY IF EXISTS "Allow public delete access" ON cafes;

-- Public: SELECT only
DROP POLICY IF EXISTS "Allow public read access" ON cafes;
DROP POLICY IF EXISTS "Public can read cafes" ON cafes;
CREATE POLICY "Public can read cafes"
ON cafes
FOR SELECT
TO public
USING (true);

-- Authenticated users (admins): Full CRUD
DROP POLICY IF EXISTS "Authenticated users can insert cafes" ON cafes;
CREATE POLICY "Authenticated users can insert cafes"
ON cafes
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update cafes" ON cafes;
CREATE POLICY "Authenticated users can update cafes"
ON cafes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete cafes" ON cafes;
CREATE POLICY "Authenticated users can delete cafes"
ON cafes
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- CAFE_REVIEWS TABLE
-- ============================================
-- Enable RLS if not already enabled
ALTER TABLE cafe_reviews ENABLE ROW LEVEL SECURITY;

-- Remove public write access if exists
DROP POLICY IF EXISTS "Allow public insert reviews" ON cafe_reviews;
DROP POLICY IF EXISTS "Allow public update reviews" ON cafe_reviews;
DROP POLICY IF EXISTS "Allow public delete reviews" ON cafe_reviews;

-- Public: SELECT only
DROP POLICY IF EXISTS "Allow public read reviews" ON cafe_reviews;
DROP POLICY IF EXISTS "Public can read reviews" ON cafe_reviews;
CREATE POLICY "Public can read reviews"
ON cafe_reviews
FOR SELECT
TO public
USING (true);

-- Authenticated users (admins): Full CRUD
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON cafe_reviews;
CREATE POLICY "Authenticated users can insert reviews"
ON cafe_reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update reviews" ON cafe_reviews;
CREATE POLICY "Authenticated users can update reviews"
ON cafe_reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON cafe_reviews;
CREATE POLICY "Authenticated users can delete reviews"
ON cafe_reviews
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- CAFE_PHOTOS TABLE
-- ============================================
-- Enable RLS if not already enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cafe_photos'
  ) THEN
    ALTER TABLE cafe_photos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Public: SELECT only
DROP POLICY IF EXISTS "Public can read photos" ON cafe_photos;
CREATE POLICY "Public can read photos"
ON cafe_photos
FOR SELECT
TO public
USING (true);

-- Authenticated users (admins): Full CRUD
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON cafe_photos;
CREATE POLICY "Authenticated users can insert photos"
ON cafe_photos
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update photos" ON cafe_photos;
CREATE POLICY "Authenticated users can update photos"
ON cafe_photos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete photos" ON cafe_photos;
CREATE POLICY "Authenticated users can delete photos"
ON cafe_photos
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- CAFE_VISITS TABLE
-- ============================================
-- Enable RLS if not already enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cafe_visits'
  ) THEN
    ALTER TABLE cafe_visits ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Public: SELECT only
DROP POLICY IF EXISTS "Public can read visits" ON cafe_visits;
CREATE POLICY "Public can read visits"
ON cafe_visits
FOR SELECT
TO public
USING (true);

-- Authenticated users (admins): Full CRUD
DROP POLICY IF EXISTS "Authenticated users can insert visits" ON cafe_visits;
CREATE POLICY "Authenticated users can insert visits"
ON cafe_visits
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update visits" ON cafe_visits;
CREATE POLICY "Authenticated users can update visits"
ON cafe_visits
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete visits" ON cafe_visits;
CREATE POLICY "Authenticated users can delete visits"
ON cafe_visits
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================
-- Enable RLS if not already enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
    
    -- Public: INSERT and SELECT
    DROP POLICY IF EXISTS "Allow public insert submissions" ON submissions;
    DROP POLICY IF EXISTS "Public can insert submissions" ON submissions;
    CREATE POLICY "Public can insert submissions"
    ON submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read submissions" ON submissions;
    DROP POLICY IF EXISTS "Public can read submissions" ON submissions;
    CREATE POLICY "Public can read submissions"
    ON submissions
    FOR SELECT
    TO public
    USING (true);

    -- Remove public update/delete
    DROP POLICY IF EXISTS "Allow public update submissions" ON submissions;
    DROP POLICY IF EXISTS "Admins can update submissions" ON submissions;
    DROP POLICY IF EXISTS "Admins can delete submissions" ON submissions;

    -- Authenticated users (admins): UPDATE and DELETE
    DROP POLICY IF EXISTS "Authenticated users can update submissions" ON submissions;
    CREATE POLICY "Authenticated users can update submissions"
    ON submissions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON submissions;
    CREATE POLICY "Authenticated users can delete submissions"
    ON submissions
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
END $$;
