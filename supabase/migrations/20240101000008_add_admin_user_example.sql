-- Example: How to add an admin user
-- Replace 'user-email@example.com' with the actual email of the user you want to make an admin
-- 
-- First, get the user ID from auth.users:
-- SELECT id FROM auth.users WHERE email = 'user-email@example.com';
--
-- Then insert into admin_users:
-- INSERT INTO admin_users (id, email)
-- SELECT id, email FROM auth.users WHERE email = 'user-email@example.com';
--
-- Or use this function to add an admin by email:
CREATE OR REPLACE FUNCTION add_admin_by_email(user_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  -- If user doesn't exist, return false
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', user_email;
  END IF;

  -- Insert into admin_users if not already there
  INSERT INTO admin_users (id, email)
  VALUES (user_id, user_email)
  ON CONFLICT (id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (or service role)
-- GRANT EXECUTE ON FUNCTION add_admin_by_email TO authenticated;
