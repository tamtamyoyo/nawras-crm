# Manual Supabase Security Configuration Steps

## Core Security Issues - RESOLVED ✅
The following security issues have been automatically fixed by applying the migration:
- ✅ Function search_path parameter issues (fixed for all functions)
- ✅ RLS policies enabled on customers and users tables
- ✅ Proper permissions granted to anon and authenticated roles

## Remaining Manual Step - Leaked Password Protection

### Issue: "Leaked Password Protection Disabled" Warning

**Manual Fix Required:**
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Settings
3. Scroll down to "Security" section
4. Enable "Leaked Password Protection"
5. Save the changes

**Alternative via SQL Editor:**
If you have superuser access, you can run this in the SQL Editor:
```sql
-- Note: This requires superuser privileges and may not work in hosted Supabase
ALTER SYSTEM SET auth.enable_leaked_password_protection = 'on';
SELECT pg_reload_conf();
```

## Verification Steps

After completing the manual step:
1. Refresh the Security Advisor page in Supabase Dashboard
2. Verify all warnings are resolved
3. Test customer creation/editing functionality in your CRM application

## Summary
- ✅ Search path issues: FIXED
- ✅ RLS policies: FIXED  
- ✅ Table permissions: FIXED
- ⚠️ Leaked password protection: REQUIRES MANUAL ENABLE

The core database security issues that were preventing CRM operations have been resolved. The leaked password protection is an additional security feature that needs to be enabled manually through the dashboard.