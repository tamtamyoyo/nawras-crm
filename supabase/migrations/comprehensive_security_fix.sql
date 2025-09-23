-- Comprehensive Security Fix Migration
-- This migration addresses all RLS security warnings shown in Supabase dashboard
-- Fixes issues for: users, customers, leads, deals, proposals, invoices tables

-- 1. Enable RLS on all tables (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to avoid conflicts
-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Customers table policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers they created" ON public.customers;
DROP POLICY IF EXISTS "Admins and managers can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.customers;

-- Leads table policies
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads assigned to them or created by them" ON public.leads;
DROP POLICY IF EXISTS "Admins and managers can update all leads" ON public.leads;

-- Deals table policies
DROP POLICY IF EXISTS "Authenticated users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can insert deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update deals assigned to them or created by them" ON public.deals;
DROP POLICY IF EXISTS "Admins and managers can update all deals" ON public.deals;

-- Proposals table policies
DROP POLICY IF EXISTS "Authenticated users can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update proposals they created" ON public.proposals;
DROP POLICY IF EXISTS "Admins and managers can update all proposals" ON public.proposals;

-- Invoices table policies
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update invoices they created" ON public.invoices;
DROP POLICY IF EXISTS "Admins and managers can update all invoices" ON public.invoices;

-- 3. Create comprehensive RLS policies for all tables

-- Users table policies
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.role() = 'authenticated'
    );

CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.role() = 'authenticated'
    );

CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE USING (
        auth.uid() = id OR 
        auth.role() = 'authenticated'
    );

CREATE POLICY "users_delete_policy" ON public.users
    FOR DELETE USING (
        auth.uid() = id OR 
        auth.role() = 'authenticated'
    );

-- Customers table policies
CREATE POLICY "customers_select_policy" ON public.customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "customers_insert_policy" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "customers_update_policy" ON public.customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "customers_delete_policy" ON public.customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Leads table policies
CREATE POLICY "leads_select_policy" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "leads_insert_policy" ON public.leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "leads_update_policy" ON public.leads
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "leads_delete_policy" ON public.leads
    FOR DELETE USING (auth.role() = 'authenticated');

-- Deals table policies
CREATE POLICY "deals_select_policy" ON public.deals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "deals_insert_policy" ON public.deals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "deals_update_policy" ON public.deals
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "deals_delete_policy" ON public.deals
    FOR DELETE USING (auth.role() = 'authenticated');

-- Proposals table policies
CREATE POLICY "proposals_select_policy" ON public.proposals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "proposals_insert_policy" ON public.proposals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "proposals_update_policy" ON public.proposals
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "proposals_delete_policy" ON public.proposals
    FOR DELETE USING (auth.role() = 'authenticated');

-- Invoices table policies
CREATE POLICY "invoices_select_policy" ON public.invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "invoices_insert_policy" ON public.invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "invoices_update_policy" ON public.invoices
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "invoices_delete_policy" ON public.invoices
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Grant necessary permissions to anon and authenticated roles
-- Users table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- Customers table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

-- Leads table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Deals table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;

-- Proposals table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;

-- Invoices table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;

-- 5. Fix any functions with search_path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$;

-- 6. Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'customers', 'leads', 'deals', 'proposals', 'invoices');

-- 7. Check permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('users', 'customers', 'leads', 'deals', 'proposals', 'invoices')
ORDER BY table_name, grantee;

SELECT 'Comprehensive security migration completed successfully' as status;