-- Clean up all triggers and functions to fix ON CONFLICT error
-- This migration ensures no hidden functions are causing the issue

-- Drop ALL triggers on customers, leads, and invoices tables
DROP TRIGGER IF EXISTS customers_version_trigger ON customers CASCADE;
DROP TRIGGER IF EXISTS leads_version_trigger ON leads CASCADE;
DROP TRIGGER IF EXISTS invoices_version_trigger ON invoices CASCADE;
DROP TRIGGER IF EXISTS deals_version_trigger ON deals CASCADE;
DROP TRIGGER IF EXISTS proposals_version_trigger ON proposals CASCADE;
DROP TRIGGER IF EXISTS calendar_events_version_trigger ON calendar_events CASCADE;

-- Drop any other potential triggers that might exist
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Drop all triggers on customers table
    FOR trigger_record IN 
        SELECT tgname FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        WHERE c.relname = 'customers' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON customers CASCADE';
    END LOOP;
    
    -- Drop all triggers on leads table
    FOR trigger_record IN 
        SELECT tgname FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        WHERE c.relname = 'leads' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON leads CASCADE';
    END LOOP;
    
    -- Drop all triggers on invoices table
    FOR trigger_record IN 
        SELECT tgname FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        WHERE c.relname = 'invoices' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON invoices CASCADE';
    END LOOP;
END $$;

-- Drop the increment_version function completely
DROP FUNCTION IF EXISTS increment_version() CASCADE;

-- Create a completely clean increment_version function
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations, set version to 1 and updated_at to now
    IF TG_OP = 'INSERT' THEN
        NEW.version = 1;
        NEW.updated_at = NOW();
    -- For UPDATE operations, increment version and set updated_at
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.version = COALESCE(OLD.version, 0) + 1;
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create clean triggers
CREATE TRIGGER customers_version_trigger
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER leads_version_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER invoices_version_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Ensure proper permissions
GRANT INSERT, SELECT, UPDATE, DELETE ON customers TO authenticated;
GRANT INSERT, SELECT ON customers TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON leads TO authenticated;
GRANT INSERT, SELECT ON leads TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON invoices TO authenticated;
GRANT INSERT, SELECT ON invoices TO anon;

-- Clean RLS policies
DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Allow customer inserts" ON customers;

CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON leads;
DROP POLICY IF EXISTS "Allow lead inserts" ON leads;

CREATE POLICY "leads_insert_policy" ON leads
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON invoices;
DROP POLICY IF EXISTS "Allow invoice inserts" ON invoices;

CREATE POLICY "invoices_insert_policy" ON invoices
    FOR INSERT 
    WITH CHECK (true);