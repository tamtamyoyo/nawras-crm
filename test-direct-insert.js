import { createClient } from '@supabase/supabase-js';

// Use actual Supabase config from .env
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDirectInsert() {
  console.log('Testing direct customer insert with minimal fields...');
  
  try {
    // Test 1: Insert with only required fields
    console.log('\n=== Test 1: Minimal insert ===');
    const { data: result1, error: error1 } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer Direct',
        email: 'test-direct@example.com',
        created_by: null
      })
      .select();
    
    if (error1) {
      console.error('Insert failed:', error1);
      console.error('Error code:', error1.code);
      console.error('Error message:', error1.message);
      console.error('Error details:', error1.details);
      console.error('Error hint:', error1.hint);
    } else {
      console.log('Insert successful:', result1);
    }
    
    // Test 2: Insert without created_by field at all
    console.log('\n=== Test 2: Insert without created_by field ===');
    const { data: result2, error: error2 } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer No CreatedBy',
        email: 'test-no-created-by@example.com'
      })
      .select();
    
    if (error2) {
      console.error('Insert failed:', error2);
      console.error('Error code:', error2.code);
      console.error('Error message:', error2.message);
      console.error('Error details:', error2.details);
      console.error('Error hint:', error2.hint);
    } else {
      console.log('Insert successful:', result2);
    }
    
    // Test 3: Check what constraints exist on the customers table
    console.log('\n=== Test 3: Check table constraints ===');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            tc.table_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'customers'
          ORDER BY tc.constraint_type, tc.constraint_name;
        `
      });
    
    if (constraintError) {
      console.error('Constraint query failed:', constraintError);
    } else {
      console.log('Table constraints:', constraints);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testDirectInsert();