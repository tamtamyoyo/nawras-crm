-- Completely reset RLS policies to fix infinite recursion

-- Disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to view all users" ON users;
DROP POLICY IF EXISTS "Allow users to insert" ON users;
DROP POLICY IF EXISTS "Allow users to update own record" ON users;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customers;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON leads;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Users table policies
CREATE POLICY "Allow public read access" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Customers table policies
CREATE POLICY "Allow public read access" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Leads table policies
CREATE POLICY "Allow public read access" ON leads
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON leads
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON leads
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT SELECT ON users TO anon;

GRANT ALL PRIVILEGES ON customers TO authenticated;
GRANT SELECT ON customers TO anon;

GRANT ALL PRIVILEGES ON leads TO authenticated;
GRANT SELECT ON leads TO anon;