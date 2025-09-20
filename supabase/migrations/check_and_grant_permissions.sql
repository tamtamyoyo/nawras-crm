-- Check current permissions for customers table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'customers' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions to anon role for basic read access
GRANT SELECT ON customers TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON customers TO authenticated;

-- Also grant permissions for other tables that might be needed
GRANT SELECT ON leads TO anon;
GRANT ALL PRIVILEGES ON leads TO authenticated;

GRANT SELECT ON deals TO anon;
GRANT ALL PRIVILEGES ON deals TO authenticated;

-- Check permissions after granting
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('customers', 'leads', 'deals')
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;