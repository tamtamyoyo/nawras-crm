import { createClient } from '@supabase/supabase-js';

// Get Supabase config
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomerSave() {
  console.log('🧪 Testing customer save operation...');
  
  try {
    // Test data - minimal fields to avoid trigger issues
    const testCustomer = {
      name: 'Test Customer Save Simple',
      email: 'testsimple@example.com',
      status: 'prospect',
      created_by: '550e8400-e29b-41d4-a716-446655440001' // Use existing user ID from sample
    };
    
    console.log('📝 Attempting to create customer:', testCustomer);
    
    // Try to insert customer (exactly like frontend)
    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...testCustomer
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating customer:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Customer created successfully:', data);
    }
    
    // Test reading customers
    console.log('\n📖 Testing customer read operation...');
    const { data: customers, error: readError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('❌ Error reading customers:', readError);
    } else {
      console.log('✅ Customers read successfully. Count:', customers?.length || 0);
      if (customers && customers.length > 0) {
        console.log('Sample customer:', customers[0]);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testCustomerSave();