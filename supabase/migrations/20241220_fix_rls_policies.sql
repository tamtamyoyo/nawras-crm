-- Fix RLS policies for all tables to allow CRUD operations
-- This migration creates comprehensive RLS policies for anonymous and authenticated users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous access" ON customers;
DROP POLICY IF EXISTS "Allow authenticated access" ON customers;
DROP POLICY IF EXISTS "Allow anonymous access" ON leads;
DROP POLICY IF EXISTS "Allow authenticated access" ON leads;
DROP POLICY IF EXISTS "Allow anonymous access" ON deals;
DROP POLICY IF EXISTS "Allow authenticated access" ON deals;
DROP POLICY IF EXISTS "Allow anonymous access" ON proposals;
DROP POLICY IF EXISTS "Allow authenticated access" ON proposals;
DROP POLICY IF EXISTS "Allow anonymous access" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated access" ON invoices;

-- Create comprehensive RLS policies for customers table
CREATE POLICY "Allow anonymous full access to customers" ON customers
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to customers" ON customers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create comprehensive RLS policies for leads table
CREATE POLICY "Allow anonymous full access to leads" ON leads
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to leads" ON leads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create comprehensive RLS policies for deals table
CREATE POLICY "Allow anonymous full access to deals" ON deals
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to deals" ON deals
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create comprehensive RLS policies for proposals table
CREATE POLICY "Allow anonymous full access to proposals" ON proposals
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to proposals" ON proposals
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create comprehensive RLS policies for invoices table
CREATE POLICY "Allow anonymous full access to invoices" ON invoices
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to invoices" ON invoices
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure all necessary permissions are granted
GRANT ALL PRIVILEGES ON customers TO anon, authenticated;
GRANT ALL PRIVILEGES ON leads TO anon, authenticated;
GRANT ALL PRIVILEGES ON deals TO anon, authenticated;
GRANT ALL PRIVILEGES ON proposals TO anon, authenticated;
GRANT ALL PRIVILEGES ON invoices TO anon, authenticated;

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Ensure the uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

COMMIT;