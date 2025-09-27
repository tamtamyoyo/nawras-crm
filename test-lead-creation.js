import { supabase } from './test-config.js';

async function testLeadCreation() {
  console.log('🧪 Testing lead creation with contact_preferences...');
  
  try {
    // Test data with contact_preferences (plural)
    const testLead = {
      name: 'Test Lead Schema Fix',
      email: 'testlead@example.com',
      status: 'new',
      responsible_person: 'Mr. Ali',
      contact_preferences: ['email', 'phone'], // This should work now
      created_by: null // Allow null for anonymous users
    };
    
    console.log('📝 Attempting to create lead:', testLead);
    
    // Try to insert lead
    const { data, error } = await supabase
      .from('leads')
      .insert([testLead])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Lead creation failed:', error);
      return false;
    }
    
    console.log('✅ Lead created successfully:', data);
    
    // Clean up - delete the test lead
    await supabase
      .from('leads')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Test lead cleaned up');
    return true;
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return false;
  }
}

async function testCustomerCreation() {
  console.log('🧪 Testing customer creation with null created_by...');
  
  try {
    // Test data with null created_by
    const testCustomer = {
      name: 'Test Customer FK Fix',
      email: 'testcustomer@example.com',
      status: 'prospect',
      responsible_person: 'Mr. Ali',
      created_by: null // This should work now
    };
    
    console.log('📝 Attempting to create customer:', testCustomer);
    
    // Try to insert customer
    const { data, error } = await supabase
      .from('customers')
      .insert([testCustomer])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Customer creation failed:', error);
      return false;
    }
    
    console.log('✅ Customer created successfully:', data);
    
    // Clean up - delete the test customer
    await supabase
      .from('customers')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Test customer cleaned up');
    return true;
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting database schema tests...');
  
  const leadTest = await testLeadCreation();
  const customerTest = await testCustomerCreation();
  
  console.log('\n📊 Test Results:');
  console.log(`Lead creation: ${leadTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Customer creation: ${customerTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (leadTest && customerTest) {
    console.log('\n🎉 All database schema issues are fixed!');
  } else {
    console.log('\n⚠️  Some issues remain - check the errors above');
  }
}

runTests().catch(console.error);