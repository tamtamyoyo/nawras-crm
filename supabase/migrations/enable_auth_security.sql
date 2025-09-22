-- Enable leaked password protection for Auth
-- This addresses the "Leaked Password Protection Disabled" warning

-- Enable leaked password protection
ALTER SYSTEM SET auth.enable_leaked_password_protection = 'on';

-- Reload configuration
SELECT pg_reload_conf();

-- Verify the setting
SELECT name, setting FROM pg_settings WHERE name = 'auth.enable_leaked_password_protection';

SELECT