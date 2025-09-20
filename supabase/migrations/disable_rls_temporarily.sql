-- Temporarily disable RLS to test connectivity
-- This is for debugging purposes only

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon role for testing
GRANT ALL PRIVILEGES ON customers TO anon;