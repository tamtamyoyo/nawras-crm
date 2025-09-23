-- Add test users to satisfy foreign key constraints
-- This migration adds basic test users that can be referenced by created_by fields

INSERT INTO public.users (id, email, full_name, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@company.com', 'System Admin', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'manager@company.com', 'Sales Manager', 'manager'),
  ('00000000-0000-0000-0000-000000000003', 'sales@company.com', 'Sales Rep', 'sales_rep')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';