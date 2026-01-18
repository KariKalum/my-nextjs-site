-- Create admin_users table to track admin users
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Trigger to update updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admin_users table
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
CREATE POLICY "Admins can read admin_users"
ON admin_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for cafes table
-- Remove public write access, only allow admins to write
DROP POLICY IF EXISTS "Allow public insert access" ON cafes;
DROP POLICY IF EXISTS "Allow public update access" ON cafes;
DROP POLICY IF EXISTS "Allow public delete access" ON cafes;

-- Allow admins to insert cafes
CREATE POLICY "Admins can insert cafes"
ON cafes
FOR INSERT
TO authenticated
WITH CHECK (is_current_user_admin());

-- Allow admins to update cafes
CREATE POLICY "Admins can update cafes"
ON cafes
FOR UPDATE
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Allow admins to delete cafes
CREATE POLICY "Admins can delete cafes"
ON cafes
FOR DELETE
TO authenticated
USING (is_current_user_admin());

-- Update RLS policies for submissions table (only if table exists)
-- Remove public update access, only allow admins
DO $$
BEGIN
  -- Check if submissions table exists before modifying policies
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'submissions'
  ) THEN
    -- Drop existing public update policy if it exists
    DROP POLICY IF EXISTS "Allow public update submissions" ON submissions;
    
    -- Allow admins to update submissions
    CREATE POLICY "Admins can update submissions"
    ON submissions
    FOR UPDATE
    TO authenticated
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
    
    -- Allow admins to delete submissions (if needed)
    CREATE POLICY "Admins can delete submissions"
    ON submissions
    FOR DELETE
    TO authenticated
    USING (is_current_user_admin());
  END IF;
END $$;
