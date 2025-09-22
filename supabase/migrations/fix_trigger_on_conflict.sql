-- Fix the ON CONFLICT issue by ensuring triggers don't use ON CONFLICT clauses
-- and are properly configured for both INSERT and UPDATE operations

-- Drop and recreate the increment_version function to be clean and simple
DROP FUNCTION IF EXISTS increment_version() CASCADE;

CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations, set version to 1 and updated_at to now
    IF TG_OP = 'INSERT' THEN
        NEW.version = COALESCE(NEW.version, 1);
        NEW.updated_at = COALESCE(NEW.updated_at, NOW());
    -- For UPDATE operations, increment version and set updated_at
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.version = COALESCE(OLD.version, 0) + 1;
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop all existing triggers to ensure clean state
DROP TRIGGER IF EXISTS customers_version_trigger ON customers;
DROP TRIGGER IF EXISTS leads_version_trigger ON leads;
DROP TRIGGER IF EXISTS deals_version_trigger ON deals;
DROP TRIGGER IF EXISTS proposals_version_trigger ON proposals;
DROP TRIGGER IF EXISTS invoices_version_trigger ON invoices;
DROP TRIGGER IF EXISTS calendar_events_version_trigger ON calendar_events;

-- Recreate triggers for customers table
CREATE TRIGGER customers_version_trigger
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Recreate triggers for leads table
CREATE TRIGGER leads_version_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Recreate triggers for deals table
CREATE TRIGGER deals_version_trigger
    BEFORE INSERT OR UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Recreate triggers for proposals table
CREATE TRIGGER proposals_version_trigger
    BEFORE INSERT OR UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Recreate triggers for invoices table
CREATE TRIGGER invoices_version_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Recreate triggers for calendar_events table
CREATE TRIGGER calendar_events_version_trigger
    BEFORE INSERT OR UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Ensure RLS policies allow inserts for both authenticated and anon users
DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;

CREATE POLICY "Allow customer inserts" ON customers
    FOR INSERT 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON customers TO authenticated;
GRANT INSERT ON customers TO anon;
GRANT SELECT ON customers TO authenticated;
GRANT SELECT ON customers TO anon;
GRANT UPDATE ON customers TO authenticated;
GRANT DELETE ON customers TO authenticated;

-- Do the same for leads
DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON leads;

CREATE POLICY "Allow lead inserts" ON leads
    FOR INSERT 
    WITH CHECK (true);

GRANT INSERT ON leads TO authenticated;
GRANT INSERT ON leads TO anon;
GRANT SELECT ON leads TO authenticated;
GRANT SELECT ON leads TO anon;
GRANT UPDATE ON leads TO authenticated;
GRANT DELETE ON leads TO authenticated;

-- Do the same for invoices
DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON invoices;

CREATE POLICY "Allow invoice inserts" ON invoices
    FOR INSERT 
    WITH CHECK (true);

GRANT INSERT ON invoices TO authenticated;
GRANT INSERT ON invoices TO anon;
GRANT SELECT ON invoices TO authenticated;
GRANT SELECT ON invoices TO anon;
GRANT UPDATE ON invoices TO authenticated;
GRANT DELETE ON invoices TO authenticated;