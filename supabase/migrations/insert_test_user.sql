-- Insert test user into users table
-- First, get the auth user ID for test@example.com

-- Insert the test user if not exists
INSERT INTO users (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  'Test User',
  'admin'
FROM auth.users au
WHERE au.email = 'test@example.com'
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = au.id
);

-- Check if the user was inserted
SELECT u.id, u.email, u.full_name, u.role
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'test@example.com';