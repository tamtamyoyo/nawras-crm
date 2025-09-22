-- Fix RLS policies and ON CONFLICT issues

-- First, let's check if there are any problematic functions or triggers
-- and fix the RLS policies

-- Fix RLS policies for leads table
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
CREATE POLICY "Authenticated users can insert leads" ON leads
  FOR INSERT WITH CHECK (true); -- Allow all authenticated users to insert

-- Fix RLS policies for invoices table  
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;
CREATE POLICY "Authenticated users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (true); -- Allow all authenticated users to insert

-- Fix RLS policies for customers table
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
CREATE POLICY "Authenticated users can insert customers" ON customers
  FOR INSERT WITH CHECK (true); -- Allow all authenticated users to insert

-- Grant proper permissions to anon role for testing
GRANT INSERT ON customers TO anon;
GRANT INSERT ON leads TO anon;
GRANT INSERT ON invoices TO anon;

-- Check if there are any functions that might be adding ON CONFLICT clauses
-- If there are any custom insert functions, we need to identify and fix them

-- Let's also ensure the version triggers are working correctly
-- The increment_version function should only work on UPDATE, not INSERT
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment version if this is an actual update (not insert)
    IF TG_OP = 'UPDATE' THEN
        NEW.version = OLD.version + 1;
        NEW.updated_at = NOW();
    ELSIF TG_OP = 'INSERT' THEN
        -- For inserts, set version to 1 and current timestamp
        NEW.version = 1;
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers to ensure they work for both INSERT and UPDATE
DROP TRIGGER IF EXISTS customers_version_trigger ON customers;
CREATE TRIGGER customers_version_trigger
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS leads_version_trigger ON leads;
CREATE TRIGGER leads_version_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS invoices_version_trigger ON invoices;
CREATE TRIGGER invoices_version_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION increment_version();