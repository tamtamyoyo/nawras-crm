-- Check current RLS policies for proposals table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'proposals';

-- Check current permissions for anon and authenticated roles
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'proposals'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can insert their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete their own proposals" ON proposals;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON proposals;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON proposals;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON proposals;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON proposals;

-- Grant basic permissions to roles
GRANT SELECT ON proposals TO anon;
GRANT ALL PRIVILEGES ON proposals TO authenticated;

-- Create comprehensive RLS policies for proposals
-- Allow authenticated users to view all proposals (for now - can be restricted later)
CREATE POLICY "Enable read access for authenticated users" ON proposals
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert proposals
CREATE POLICY "Enable insert access for authenticated users" ON proposals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update proposals they created
CREATE POLICY "Enable update access for authenticated users" ON proposals
    FOR UPDATE USING (auth.role() = 'authenticated' AND (created_by = auth.uid() OR created_by IS NULL));

-- Allow authenticated users to delete proposals they created
CREATE POLICY "Enable delete access for authenticated users" ON proposals
    FOR DELETE USING (auth.role() = 'authenticated' AND (created_by = auth.uid() OR created_by IS NULL));

-- Allow anonymous users to view proposals (for public access scenarios)
CREATE POLICY "Enable read access for anonymous users" ON proposals
    FOR SELECT USING (auth.role() = 'anon');

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'proposals';

-- Verify permissions are granted
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'proposals'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;