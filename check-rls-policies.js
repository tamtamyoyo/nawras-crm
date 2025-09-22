import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('=== Checking RLS Policies ===\n');
  
  try {
    // Check RLS policies for all tables
    const { data: policies, error: policiesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          ORDER BY tablename, policyname;
        `
      });
    
    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
    } else {
      console.log('RLS Policies:');
      console.table(policies);
    }
    
    // Check table permissions
    const { data: permissions, error: permError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            grantee, 
            table_name, 
            privilege_type 
          FROM information_schema.role_table_grants 
          WHERE table_schema = 'public' 
            AND grantee IN ('anon', 'authenticated') 
            AND table_name IN ('customers', 'leads', 'invoices')
          ORDER BY table_name, grantee;
        `
      });
    
    if (permError) {
      console.error('Error fetching permissions:', permError);
    } else {
      console.log('\nTable Permissions:');
      console.table(permissions);
    }
    
    // Check current user context
    const { data: user, error: userError } = await supabase.auth.getUser();
    console.log('\nCurrent user context:', user?.user ? 'Authenticated' : 'Anonymous');
    
    // Test simple selects on each table
    console.log('\n=== Testing Table Access ===');
    
    const tables = ['customers', 'leads', 'invoices'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Access OK (${data?.length || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkRLSPolicies();