-- Fix customer status constraint to include 'prospect'
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_status_check;
ALTER TABLE customers ADD CONSTRAINT customers_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'prospect'::text]));