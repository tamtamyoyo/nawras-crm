-- Fix infinite recursion in users table RLS policies

-- First, drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create simple, non-recursive policies
-- Allow authenticated users to read all user profiles (needed for dropdowns, assignments, etc.)
CREATE POLICY "authenticated_users_read_all" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Allow users to insert their own profile during registration
CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT ON users TO authenticated;
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;