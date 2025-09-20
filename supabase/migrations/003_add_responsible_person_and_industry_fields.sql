-- Add Responsible Person and Industry Standard Fields Migration
-- This migration adds mandatory responsible person field and industry-standard fields
-- to all customer-facing forms (leads, deals, proposals, invoices)

-- Add responsible_person field to all tables
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS responsible_person TEXT NOT NULL DEFAULT 'Mr. Ali'
CHECK (responsible_person IN ('Mr. Ali', 'Mr. Mustafa', 'Mr. Taha', 'Mr. Mohammed'));

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS responsible_person TEXT NOT NULL DEFAULT 'Mr. Ali'
CHECK (responsible_person IN ('Mr. Ali', 'Mr. Mustafa', 'Mr. Taha', 'Mr. Mohammed'));

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS responsible_person TEXT NOT NULL DEFAULT 'Mr. Ali'
CHECK (responsible_person IN ('Mr. Ali', 'Mr. Mustafa', 'Mr. Taha', 'Mr. Mohammed'));

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS responsible_person TEXT NOT NULL DEFAULT 'Mr. Ali'
CHECK (responsible_person IN ('Mr. Ali', 'Mr. Mustafa', 'Mr. Taha', 'Mr. Mohammed'));

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS responsible_person TEXT NOT NULL DEFAULT 'Mr. Ali'
CHECK (responsible_person IN ('Mr. Ali', 'Mr. Mustafa', 'Mr. Taha', 'Mr. Mohammed'));

-- Add industry-standard fields for LEADS table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'subscriber'
CHECK (lifecycle_stage IN ('subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist', 'other'));

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'medium'
CHECK (priority_level IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS contact_preferences TEXT[] DEFAULT ARRAY['email'];

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS follow_up_date DATE;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_source_detail TEXT;

-- Add industry-standard fields for DEALS table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS deal_source_detail TEXT;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS competitor_info TEXT;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS decision_maker_name TEXT;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS decision_maker_email TEXT;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS decision_maker_phone TEXT;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'new_business'
CHECK (deal_type IN ('new_business', 'existing_business', 'renewal', 'upsell', 'cross_sell'));

-- Add industry-standard fields for PROPOSALS table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS proposal_type TEXT DEFAULT 'standard'
CHECK (proposal_type IN ('standard', 'custom', 'template', 'rfp_response', 'quote'));

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS validity_period INTEGER DEFAULT 30; -- days

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS approval_workflow TEXT DEFAULT 'single_approval'
CHECK (approval_workflow IN ('single_approval', 'multi_level_approval', 'committee_approval', 'auto_approval'));

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS template_used TEXT;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'email'
CHECK (delivery_method IN ('email', 'portal', 'physical_mail', 'in_person', 'fax'));

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12,2) DEFAULT 0;

-- Add industry-standard fields for INVOICES table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net_30'
CHECK (payment_terms IN ('net_15', 'net_30', 'net_45', 'net_60', 'due_on_receipt', 'cash_on_delivery'));

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100);

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS billing_address TEXT;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS purchase_order_number TEXT;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer'
CHECK (payment_method IN ('bank_transfer', 'credit_card', 'debit_card', 'cash', 'check', 'paypal', 'stripe', 'other'));

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD'
CHECK (currency_code IN ('USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY', 'JPY'));

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0.00;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Create indexes for better query performance on new fields
CREATE INDEX IF NOT EXISTS idx_leads_responsible_person ON public.leads(responsible_person);
CREATE INDEX IF NOT EXISTS idx_leads_lifecycle_stage ON public.leads(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority_level ON public.leads(priority_level);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON public.leads(follow_up_date);

CREATE INDEX IF NOT EXISTS idx_deals_responsible_person ON public.deals(responsible_person);
CREATE INDEX IF NOT EXISTS idx_deals_deal_type ON public.deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_decision_maker_email ON public.deals(decision_maker_email);

CREATE INDEX IF NOT EXISTS idx_proposals_responsible_person ON public.proposals(responsible_person);
CREATE INDEX IF NOT EXISTS idx_proposals_proposal_type ON public.proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_proposals_delivery_method ON public.proposals(delivery_method);

CREATE INDEX IF NOT EXISTS idx_invoices_responsible_person ON public.invoices(responsible_person);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON public.invoices(payment_method);
CREATE INDEX IF NOT EXISTS idx_invoices_currency_code ON public.invoices(currency_code);
CREATE INDEX IF NOT EXISTS idx_invoices_purchase_order_number ON public.invoices(purchase_order_number);

CREATE INDEX IF NOT EXISTS idx_customers_responsible_person ON public.customers(responsible_person);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.responsible_person IS 'Mandatory field indicating the person responsible for this lead';
COMMENT ON COLUMN public.leads.lifecycle_stage IS 'Current stage of the lead in the customer lifecycle';
COMMENT ON COLUMN public.leads.lead_score IS 'Numerical score indicating lead quality (0-100)';
COMMENT ON COLUMN public.leads.priority_level IS 'Priority level for follow-up activities';
COMMENT ON COLUMN public.leads.contact_preferences IS 'Preferred contact methods for this lead';
COMMENT ON COLUMN public.leads.follow_up_date IS 'Scheduled date for next follow-up activity';

COMMENT ON COLUMN public.deals.responsible_person IS 'Mandatory field indicating the person responsible for this deal';
COMMENT ON COLUMN public.deals.competitor_info IS 'Information about competing companies or solutions';
COMMENT ON COLUMN public.deals.decision_maker_name IS 'Name of the primary decision maker';
COMMENT ON COLUMN public.deals.deal_type IS 'Type of business deal (new, renewal, upsell, etc.)';

COMMENT ON COLUMN public.proposals.responsible_person IS 'Mandatory field indicating the person responsible for this proposal';
COMMENT ON COLUMN public.proposals.proposal_type IS 'Type of proposal (standard, custom, RFP response, etc.)';
COMMENT ON COLUMN public.proposals.validity_period IS 'Number of days the proposal remains valid';
COMMENT ON COLUMN public.proposals.delivery_method IS 'Method used to deliver the proposal to the client';

COMMENT ON COLUMN public.invoices.responsible_person IS 'Mandatory field indicating the person responsible for this invoice';
COMMENT ON COLUMN public.invoices.payment_terms IS 'Payment terms for the invoice';
COMMENT ON COLUMN public.invoices.billing_address IS 'Billing address for the invoice';
COMMENT ON COLUMN public.invoices.purchase_order_number IS 'Client purchase order number reference';
COMMENT ON COLUMN public.invoices.payment_method IS 'Preferred payment method for this invoice';
COMMENT ON COLUMN public.invoices.currency_code IS 'Currency code for the invoice amounts';

COMMENT ON COLUMN public.customers.responsible_person IS 'Mandatory field indicating the person responsible for this customer';