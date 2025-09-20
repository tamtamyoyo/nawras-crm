-- Fix permissions for customers table
-- Grant permissions to anon and authenticated roles

GRANT SELECT ON customers TO anon;
GRANT ALL PRIVILEGES ON customers TO authenticated;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'customers'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;