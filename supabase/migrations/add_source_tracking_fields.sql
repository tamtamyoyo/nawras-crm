-- Add source tracking fields to all relevant tables
-- This migration adds a 'source' column to track where leads/customers originated

-- Add source field to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Other';

-- Add source field to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Other';

-- Add source field to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Other';

-- Add source field to proposals table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Other';

-- Add source field to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Other';

-- Add check constraints to ensure valid source values
ALTER TABLE public.customers 
ADD CONSTRAINT customers_source_check 
CHECK (source IN ('Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other'));

ALTER TABLE public.leads 
ADD CONSTRAINT leads_source_check 
CHECK (source IN ('Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other'));

ALTER TABLE public.deals 
ADD CONSTRAINT deals_source_check 
CHECK (source IN ('Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other'));

ALTER TABLE public.proposals 
ADD CONSTRAINT proposals_source_check 
CHECK (source IN ('Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other'));

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_source_check 
CHECK (source IN ('Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_source ON public.customers(source);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_deals_source ON public.deals(source);
CREATE INDEX IF NOT EXISTS idx_proposals_source ON public.proposals(source);
CREATE INDEX IF NOT EXISTS idx_invoices_source ON public.invoices(source);