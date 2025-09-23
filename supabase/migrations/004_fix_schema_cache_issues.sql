-- Fix schema cache issues and ensure proper column definitions
-- This migration addresses the 'contact_preference' vs 'contact_preferences' issue

-- First, let's ensure the contact_preferences column exists with proper definition
ALTER TABLE public.leads 
ALTER COLUMN contact_preferences SET DEFAULT ARRAY['email']::text[];

-- Add a comment to ensure schema cache recognizes the column
COMMENT ON COLUMN public.leads.contact_preferences IS 'Array of preferred contact methods: email, phone, whatsapp, in_person';

-- Refresh the schema cache by updating table statistics
ANALYZE public.leads;

-- Ensure proper permissions are set for the leads table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT ON public.leads TO anon;

-- Fix any potential foreign key issues by ensuring users table has proper structure
-- Check if we need to create a basic users table for foreign key references
DO $$
BEGIN
    -- Check if auth.users exists and create a view if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Create a view that maps to auth.users for foreign key compatibility
        CREATE VIEW public.users AS 
        SELECT 
            id,
            email,
            raw_user_meta_data->>'full_name' as full_name,
            created_at,
            updated_at
        FROM auth.users;
        
        -- Grant permissions on the view
        GRANT SELECT ON public.users TO authenticated;
        GRANT SELECT ON public.users TO anon;
    END IF;
END $$;

-- Refresh all table statistics to update schema cache
ANALYZE public.customers;
ANALYZE public.deals;
ANALYZE public.proposals;
ANALYZE public.invoices;

-- Add indexes for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_created_by ON public.deals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON public.proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);