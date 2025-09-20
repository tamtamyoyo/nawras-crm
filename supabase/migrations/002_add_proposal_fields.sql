-- Add missing fields to proposals table
ALTER TABLE proposals ADD COLUMN notes TEXT;
ALTER TABLE proposals ADD COLUMN total_amount DECIMAL(10,2);