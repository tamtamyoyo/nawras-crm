-- Create a test user for authentication testing
-- This will be handled by Supabase Auth, but we need to ensure the user profile exists

-- Insert test user profile (the auth user will be created separately)
INSERT INTO users (id, email, full_name, role, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  'Test User',
  'sales_rep',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Grant permissions for authenticated users to access their own data
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO authenticated;

-- Also grant basic read access to anon role for login page
GRANT SELECT ON users TO anon;