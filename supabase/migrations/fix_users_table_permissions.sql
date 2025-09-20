-- Check current permissions for users table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant necessary permissions to anon role (for public access)
GRANT SELECT ON public.users TO anon;

-- Grant full permissions to authenticated role (for logged-in users)
GRANT ALL PRIVILEGES ON public.users TO authenticated;

-- Verify permissions after granting
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;