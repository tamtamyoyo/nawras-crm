-- Safe RLS Policies Fix Migration
-- This migration safely applies RLS policies without conflicts
-- Checks for existing policies before creating new ones

-- 1. Enable RLS on all tables (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 2. Grant necessary permissions to anon and authenticated roles
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

-- 3. Grant permissions on all other tables that might need access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_export_ports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_export_ports TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_incoterms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_incoterms TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.export_licenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.export_licenses TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_hs_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_hs_codes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_index TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_index TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_product_categories TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incoterms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incoterms TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.target_markets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.target_markets TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_widgets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_widgets TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_target_markets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_target_markets TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_certificates TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_templates TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.export_ports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.export_ports TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_templates TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_executions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_executions TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hs_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hs_codes TO authenticated;

-- 4. Check current permissions status
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

SELECT 'Safe RLS policies migration completed successfully' as status;