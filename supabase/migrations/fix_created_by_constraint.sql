-- Fix created_by constraint issue for anonymous users
-- Make created_by nullable to allow anonymous customer creation

-- Drop the foreign key constraint on customers table
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_created_by_fkey;

-- Make created_by nullable
ALTER TABLE customers ALTER COLUMN created_by DROP NOT NULL;

-- Add back the foreign key constraint but allow NULL values
ALTER TABLE customers ADD CONSTRAINT customers_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Do the same for leads table
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_created_by_fkey;
ALTER TABLE leads ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE leads ADD CONSTRAINT leads_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Do the same for deals table
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_created_by_fkey;
ALTER TABLE deals ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE deals ADD CONSTRAINT deals_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Do the same for proposals table
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_created_by_fkey;
ALTER TABLE proposals ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE proposals ADD CONSTRAINT proposals_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Do the same for invoices table
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
ALTER TABLE invoices ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE invoices ADD CONSTRAINT invoices_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update any existing records with invalid UUIDs to NULL
UPDATE customers SET created_by = NULL WHERE created_by = '00000000-0000-0000-0000-000000000000';
UPDATE leads SET created_by = NULL WHERE created_by = '00000000-0000-0000-0000-000000000000';
UPDATE deals SET created_by = NULL WHERE created_by = '00000000-0000-0000-0000-000000000000';
UPDATE proposals SET created_by = NULL WHERE created_by = '00000000-0000-0000-0000-000000000000';
UPDATE invoices SET created_by = NULL WHERE created_by = '00000000-0000-0000-0000-000000000000';