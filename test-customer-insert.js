import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomerInsert() {
  console.log('Testing direct customer insert...');
  
  // Test data with minimal required fields
  const testCustomer = {
    name: 'Test Customer ' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    phone: '123-456-7890',
    company: 'Test Company',
    status: 'active',
    created_by: null
  };
  
  console.log('Inserting customer:', testCustomer);
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([testCustomer])
      .select();
    
    if (error) {
      console.error('Insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('Insert successful:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

async function runDebugQueries() {
  console.log('\n=== Running debug queries ===');
  
  // Check for functions with ON CONFLICT
  console.log('\n1. Checking functions with ON CONFLICT:');
  const { data: functions, error: funcError } = await supabase
    .rpc('sql', { query: "SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_definition ILIKE '%ON CONFLICT%';" })
    .catch(() => ({ data: null, error: 'RPC not available' }));
  
  if (funcError) {
    console.log('Cannot check functions:', funcError);
  } else {
    console.log('Functions with ON CONFLICT:', functions);
  }
  
  // Check triggers on customers table
  console.log('\n2. Checking triggers on customers table:');
  const { data: triggers, error: trigError } = await supabase
    .from('information_schema.triggers')
    .select('*')
    .eq('event_object_table', 'customers')
    .catch(() => ({ data: null, error: 'Cannot access triggers' }));
  
  if (trigError) {
    console.log('Cannot check triggers:', trigError);
  } else {
    console.log('Triggers on customers:', triggers);
  }
  
  // Check constraints on customers table
  console.log('\n3. Checking constraints on customers table:');
  const { data: constraints, error: constError } = await supabase
    .from('information_schema.table_constraints')
    .select('*')
    .eq('table_name', 'customers')
    .catch(() => ({ data: null, error: 'Cannot access constraints' }));
  
  if (constError) {
    console.log('Cannot check constraints:', constError);
  } else {
    console.log('Constraints on customers:', constraints);
  }
}

async function main() {
  console.log('=== Customer Insert Test ===');
  
  const success = await testCustomerInsert();
  
  if (!success) {
    await runDebugQueries();
  }
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);