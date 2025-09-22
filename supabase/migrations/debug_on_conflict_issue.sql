-- Debug ON CONFLICT issue by checking for any functions or triggers that might be adding ON CONFLICT clauses

-- Check for any functions that might be interfering with inserts
SELECT 
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosrc ILIKE '%ON CONFLICT%';

-- Check for any triggers on customers table
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('customers', 'leads', 'invoices')
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check for any policies that might be causing issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'leads', 'invoices');

-- Check constraints on customers table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'customers'
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');