-- Tighten RLS policies for submissions table
-- Remove permissive public/authenticated read/update/delete policies
-- Restrict SELECT/UPDATE/DELETE to admins only (using is_current_user_admin())
-- Keep public INSERT for form submissions

-- ============================================
-- STEP 1: Drop all existing policies on submissions
-- ============================================
-- Drop all possible policy names from various migrations
DROP POLICY IF EXISTS "Allow public insert submissions" ON submissions;
DROP POLICY IF EXISTS "Public can insert submissions" ON submissions;
DROP POLICY IF EXISTS "Allow public read submissions" ON submissions;
DROP POLICY IF EXISTS "Public can read submissions" ON submissions;
DROP POLICY IF EXISTS "Allow public update submissions" ON submissions;
DROP POLICY IF EXISTS "Public can update submissions" ON submissions;
DROP POLICY IF EXISTS "Allow public delete submissions" ON submissions;
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON submissions;
DROP POLICY IF EXISTS "Allow authenticated select submissions" ON submissions;
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON submissions;
DROP POLICY IF EXISTS "Allow authenticated update submissions" ON submissions;
DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON submissions;
DROP POLICY IF EXISTS "Allow authenticated delete submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can read submissions" ON submissions;

-- ============================================
-- STEP 2: Create new restrictive policies
-- ============================================

-- Policy 1: Public can INSERT submissions (for form submissions)
CREATE POLICY "Public can insert submissions"
ON submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Only admins can SELECT submissions
CREATE POLICY "Admins can read submissions"
ON submissions
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- Policy 3: Only admins can UPDATE submissions
CREATE POLICY "Admins can update submissions"
ON submissions
FOR UPDATE
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Policy 4: Only admins can DELETE submissions
CREATE POLICY "Admins can delete submissions"
ON submissions
FOR DELETE
TO authenticated
USING (is_current_user_admin());
