-- Create test user profile in public.users table
-- The auth user will be created via the auth API

-- First ensure the test user profile exists
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  'Test User',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = 'test@example.com',
  full_name = 'Test User',
  role = 'admin',
  updated_at = NOW();

-- Ensure proper permissions are granted
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.proposals TO authenticated;
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.calendar_events TO authenticated;

-- Grant read access to anon for login
GRANT SELECT ON public.users TO anon;