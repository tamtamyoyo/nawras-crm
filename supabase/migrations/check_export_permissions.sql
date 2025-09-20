-- Check current permissions for export-related tables
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN (
        'export_licenses', 
        'hs_codes', 
        'export_ports', 
        'certificates', 
        'product_categories', 
        'target_markets', 
        'incoterms',
        'customer_hs_codes',
        'customer_export_ports', 
        'customer_certificates',
        'customer_product_categories',
        'customer_target_markets',
        'customer_incoterms'
    )
ORDER BY table_name, grantee;

-- Grant SELECT permissions to anon role for reference tables
GRANT SELECT ON export_licenses TO anon;
GRANT SELECT ON hs_codes TO anon;
GRANT SELECT ON export_ports TO anon;
GRANT SELECT ON certificates TO anon;
GRANT SELECT ON product_categories TO anon;
GRANT SELECT ON target_markets TO anon;
GRANT SELECT ON incoterms TO anon;

-- Grant full permissions to authenticated role for all export tables
GRANT ALL PRIVILEGES ON export_licenses TO authenticated;
GRANT ALL PRIVILEGES ON hs_codes TO authenticated;
GRANT ALL PRIVILEGES ON export_ports TO authenticated;
GRANT ALL PRIVILEGES ON certificates TO authenticated;
GRANT ALL PRIVILEGES ON product_categories TO authenticated;
GRANT ALL PRIVILEGES ON target_markets TO authenticated;
GRANT ALL PRIVILEGES ON incoterms TO authenticated;
GRANT ALL PRIVILEGES ON customer_hs_codes TO authenticated;
GRANT ALL PRIVILEGES ON customer_export_ports TO authenticated;
GRANT ALL PRIVILEGES ON customer_certificates TO authenticated;
GRANT ALL PRIVILEGES ON customer_product_categories TO authenticated;
GRANT ALL PRIVILEGES ON customer_target_markets TO authenticated;
GRANT ALL PRIVILEGES ON customer_incoterms TO authenticated;

-- Verify permissions after granting
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN (
        'export_licenses', 
        'hs_codes', 
        'export_ports', 
        'certificates', 
        'product_categories', 
        'target_markets', 
        'incoterms',
        'customer_hs_codes',
        'customer_export_ports', 
        'customer_certificates',
        'customer_product_categories',
        'customer_target_markets',
        'customer_incoterms'
    )
ORDER BY table_name, grantee;