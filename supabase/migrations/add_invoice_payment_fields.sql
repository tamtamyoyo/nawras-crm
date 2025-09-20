-- Add missing payment_terms and tax_rate fields to invoices table
ALTER TABLE invoices 
ADD COLUMN payment_terms TEXT CHECK (payment_terms IN ('net_15', 'net_30', 'net_45', 'net_60', 'due_on_receipt')) DEFAULT 'net_30',
ADD COLUMN tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- Update existing invoices to have default values
UPDATE invoices SET payment_terms = 'net_30', tax_rate = 0.00 WHERE payment_terms IS NULL OR tax_rate IS NULL;