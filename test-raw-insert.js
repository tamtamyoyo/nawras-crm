import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRawInsert() {
  console.log('🧪 Testing raw insert operations...')
  
  // Test 1: Check what constraints exist on customers table
  console.log('\n📋 Checking constraints on customers table:')
  const { data: constraints, error: constraintError } = await supabase
    .rpc('sql', {
      query: `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          tc.is_deferrable,
          tc.initially_deferred
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'customers'
        ORDER BY tc.constraint_type, tc.constraint_name;
      `
    })
  
  if (constraintError) {
    console.log('⚠️ Could not check constraints:', constraintError.message)
  } else {
    console.log('Constraints:', constraints)
  }
  
  // Test 2: Check for any functions that might be adding ON CONFLICT
  console.log('\n🔍 Checking for functions with ON CONFLICT:')
  const { data: functions, error: functionError } = await supabase
    .rpc('sql', {
      query: `
        SELECT 
          p.proname as function_name,
          p.prosrc as function_source
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND (p.prosrc ILIKE '%ON CONFLICT%' OR p.prosrc ILIKE '%on conflict%');
      `
    })
  
  if (functionError) {
    console.log('⚠️ Could not check functions:', functionError.message)
  } else {
    console.log('Functions with ON CONFLICT:', functions)
  }
  
  // Test 3: Try the simplest possible insert
  console.log('\n🎯 Testing simplest customer insert:')
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: 'Simple Test ' + Date.now()
      })
    
    if (error) {
      console.error('❌ Simple insert failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ Simple insert succeeded:', data)
    }
  } catch (err) {
    console.error('💥 Exception during insert:', err)
  }
  
  // Test 4: Check current user and permissions
  console.log('\n👤 Checking current user and permissions:')
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Current user:', user ? user.id : 'Not authenticated')
  
  // Test 5: Check RLS policies
  console.log('\n🔒 Checking RLS policies:')
  const { data: policies, error: policyError } = await supabase
    .rpc('sql', {
      query: `
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
        AND tablename = 'customers'
        ORDER BY policyname;
      `
    })
  
  if (policyError) {
    console.log('⚠️ Could not check policies:', policyError.message)
  } else {
    console.log('RLS Policies:', policies)
  }
}

testRawInsert()