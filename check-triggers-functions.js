import { supabase } from './test-config.js'

async function checkTriggersAndFunctions() {
  try {
    console.log('🔍 Checking triggers on customers table...')
    
    // Check for triggers
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'customers'
          AND event_object_schema = 'public';
        `
      })
    
    if (triggerError) {
      console.log('❌ Could not check triggers via RPC:', triggerError.message)
    } else {
      console.log('✅ Triggers found:', triggers)
    }
    
    console.log('\n🔍 Checking functions that might affect customers...')
    
    // Check for functions
    const { data: functions, error: functionError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            routine_name,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_schema = 'public'
          AND routine_definition ILIKE '%customers%';
        `
      })
    
    if (functionError) {
      console.log('❌ Could not check functions via RPC:', functionError.message)
    } else {
      console.log('✅ Functions found:', functions)
    }
    
    console.log('\n🔍 Checking RLS policies on customers table...')
    
    // Check for RLS policies
    const { data: policies, error: policyError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'customers'
          AND schemaname = 'public';
        `
      })
    
    if (policyError) {
      console.log('❌ Could not check policies via RPC:', policyError.message)
    } else {
      console.log('✅ RLS Policies found:', policies)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkTriggersAndFunctions()
  .then(() => {
    console.log('✅ Check completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Check failed:', error)
    process.exit(1)
  })