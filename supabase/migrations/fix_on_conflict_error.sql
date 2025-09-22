-- Fix the ON CONFLICT error by ensuring clean insert operations

-- Drop and recreate the increment_version function to be simpler
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
        NEW.version = OLD.version + 1;
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for customers table
DROP TRIGGER IF EXISTS customers_version_trigger ON customers;
CREATE TRIGGER customers_version_trigger
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Recreate triggers for leads table
DROP TRIGGER IF EXISTS leads_version_trigger ON leads;
CREATE TRIGGER leads_version_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Recreate triggers for invoices table
DROP TRIGGER IF EXISTS invoices_version_trigger ON invoices;
CREATE TRIGGER invoices_version_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Ensure RLS policies allow inserts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;

CREATE POLICY "Allow inserts for authenticated users" ON customers
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON customers TO authenticated;
GRANT INSERT ON customers TO anon;

-- Also ensure the same for leads and invoices
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;

CREATE POLICY "Allow inserts for authenticated users" ON leads
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

GRANT INSERT ON leads TO authenticated;
GRANT INSERT ON leads TO anon;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;

CREATE POLICY "Allow inserts for authenticated users" ON invoices
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

GRANT INSERT ON invoices TO authenticated;
GRANT INSERT ON invoices TO anon;