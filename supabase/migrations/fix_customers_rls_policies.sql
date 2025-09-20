-- Fix RLS policies for customers table
-- Grant permissions to anon and authenticated roles

-- Grant basic permissions to roles
GRANT SELECT ON customers TO anon;
GRANT ALL PRIVILEGES ON customers TO authenticated;

-- Create RLS policies for customers table
-- Allow anon users to read all customers (for public access)
CREATE POLICY "Allow anon read access" ON customers
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users full access to customers
CREATE POLICY "Allow authenticated full access" ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;