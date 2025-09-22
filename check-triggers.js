import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnpkmkqvqjqjqjqjqjqj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F2cWpxampxampxampxaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM3NzE5NzE0LCJleHAiOjIwNTMyOTU3MTR9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTriggers() {
  console.log('=== Checking triggers on customers table ===');
  
  try {
    // Check triggers on customers table
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'customers');
    
    if (triggerError) {
      console.log('Error checking triggers:', triggerError);
    } else {
      console.log('Triggers found:', triggers);
    }
    
    // Try a simple raw SQL query instead
    const { data: rawTriggers, error: rawError } = await supabase.rpc('exec_sql', {
      query: `SELECT trigger_name, event_manipulation, action_statement 
              FROM information_schema.triggers 
              WHERE event_object_table = 'customers';`
    });
    
    if (rawError) {
      console.log('Raw SQL error:', rawError);
    } else {
      console.log('Raw triggers result:', rawTriggers);
    }
    
  } catch (error) {
    console.log('General error:', error);
  }
}

async function testSimpleInsert() {
  console.log('\n=== Testing simple insert without any special handling ===');
  
  const testCustomer = {
    name: `Simple Test ${Date.now()}`,
    email: `simple${Date.now()}@example.com`,
    phone: '123-456-7890',
    company: 'Simple Test Company',
    status: 'active',
    created_by: null
  };
  
  console.log('Inserting:', testCustomer);
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(testCustomer)
      .select();
    
    if (error) {
      console.log('Insert error:', error);
    } else {
      console.log('Insert successful:', data);
    }
  } catch (error) {
    console.log('Catch error:', error);
  }
}

async function main() {
  await checkTriggers();
  await testSimpleInsert();
}

main().catch(console.error);