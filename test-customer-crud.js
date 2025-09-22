import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomerCRUD() {
  console.log('🧪 Testing Customer CRUD Operations...');
  
  try {
    // Test CREATE
    console.log('\n1. Testing CREATE operation...');
    const testCustomer = {
      name: 'Test Customer ' + Date.now(),
      email: 'test@example.com',
      phone: '123-456-7890',
      company: 'Test Company',
      address: '123 Test St',
      status: 'prospect',
      source: 'Website',
      notes: 'Test customer for CRUD operations',
      responsible_person: 'Mr. Ali',
      created_by: null
    };
    
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert(testCustomer)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ CREATE failed:', createError);
      return;
    }
    
    console.log('✅ CREATE successful:', newCustomer.name);
    const customerId = newCustomer.id;
    
    // Test READ
    console.log('\n2. Testing READ operation...');
    const { data: readCustomer, error: readError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (readError) {
      console.error('❌ READ failed:', readError);
      return;
    }
    
    console.log('✅ READ successful:', readCustomer.name);
    
    // Test UPDATE
    console.log('\n3. Testing UPDATE operation...');
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({ 
        company: 'Updated Test Company',
        notes: 'Updated notes'
      })
      .eq('id', customerId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ UPDATE failed:', updateError);
      return;
    }
    
    console.log('✅ UPDATE successful:', updatedCustomer.company);
    
    // Test DELETE
    console.log('\n4. Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    
    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError);
      return;
    }
    
    console.log('✅ DELETE successful');
    
    console.log('\n🎉 All CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testCustomerCRUD();