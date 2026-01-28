-- Verification SQL for submissions RLS policies
-- Run these queries in Supabase SQL Editor to verify policies are working correctly
-- 
-- IMPORTANT: These queries test the policies but may fail if run as anon user.
-- Run them in the Supabase SQL Editor where you have elevated privileges to verify structure.

-- ============================================
-- VERIFICATION 1: Check current policies
-- ============================================
-- Verify all policies exist and are correct
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'submissions'
ORDER BY policyname;

-- Expected result: 4 policies
-- 1. "Public can insert submissions" - INSERT - public
-- 2. "Admins can read submissions" - SELECT - authenticated (with is_current_user_admin())
-- 3. "Admins can update submissions" - UPDATE - authenticated (with is_current_user_admin())
-- 4. "Admins can delete submissions" - DELETE - authenticated (with is_current_user_admin())

-- ============================================
-- VERIFICATION 2: Check RLS is enabled
-- ============================================
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'submissions';

-- Expected: rowsecurity = true

-- ============================================
-- VERIFICATION 3: Test INSERT as public (should work)
-- ============================================
-- This should succeed when called from the API route (which uses anon key)
-- Note: Cannot test directly in SQL Editor as it runs with elevated privileges
-- Test via: POST /api/submissions with form data

-- ============================================
-- VERIFICATION 4: Test SELECT as public (should fail)
-- ============================================
-- This should fail when called without authentication
-- Note: Cannot test directly in SQL Editor
-- Test via: Try to query submissions table from client-side code without auth

-- ============================================
-- VERIFICATION 5: Check admin_users table and function
-- ============================================
-- Verify is_current_user_admin() function exists
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- Expected: Function exists and checks admin_users table

-- Verify admin_users table exists
SELECT COUNT(*) as admin_count
FROM admin_users;

-- ============================================
-- VERIFICATION 6: Manual test checklist
-- ============================================
-- Run these tests manually:

-- Test 1: Submit form (should work)
-- - Visit /submit page
-- - Fill out form and submit
-- - Expected: Submission created successfully

-- Test 2: Try to read submissions as anonymous user (should fail)
-- - Open browser console on any page
-- - Try: fetch('/api/submissions') or direct Supabase query
-- - Expected: Error or empty result (no submissions visible)

-- Test 3: Admin can read submissions (should work)
-- - Login as admin
-- - Visit /admin/submissions
-- - Expected: Submissions list displays correctly

-- Test 4: Admin can update submissions (should work)
-- - Login as admin
-- - Visit /admin/submissions
-- - Click "Approve" or "Reject" on a submission
-- - Expected: Submission status updates successfully

-- Test 5: Admin can delete submissions (should work)
-- - Login as admin
-- - Visit /admin/submissions
-- - Delete a submission (if delete functionality exists)
-- - Expected: Submission deleted successfully
