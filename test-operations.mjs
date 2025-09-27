import { supabase } from './test-config.js';

console.log('🔍 Testing database operations...');
console.log('Supabase URL:', supabaseUrl);
console.log('Using key:', supabaseKey.substring(0, 20) + '...');

// Test 1: Check if we can connect and get table info
try {
  console.log('\n📋 Testing table access...');
  
  // Test customers table
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .limit(1);
  
  if (customersError) {
    console.log('❌ Customers table error:', customersError.message);
  } else {
    console.log('✅ Customers table accessible, sample count:', customers?.length || 0);
  }
  
  // Test leads table
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
  
  if (leadsError) {
    console.log('❌ Leads table error:', leadsError.message);
  } else {
    console.log('✅ Leads table accessible, sample count:', leads?.length || 0);
  }
  
} catch (error) {
  console.log('❌ Connection error:', error.message);
}

// Test 2: Try to create a test customer
try {
  console.log('\n👤 Testing customer creation...');
  
  const testCustomer = {
    name: 'Test Customer ' + Date.now(),
    email: 'test@example.com',
    phone: '+1234567890',
    company: 'Test Company',
    address: '123 Test St',
    status: 'prospect',
    source: 'Other',
    notes: 'Test customer for schema validation',
    responsible_person: 'Mr. Ali'
  };
  
  const { data: newCustomer, error: customerError } = await supabase
    .from('customers')
    .insert(testCustomer)
    .select()
    .single();
  
  if (customerError) {
    console.log('❌ Customer creation error:', customerError.message);
    console.log('Error details:', customerError);
  } else {
    console.log('✅ Customer created successfully:', newCustomer.id);
    
    // Clean up - delete the test customer
    await supabase.from('customers').delete().eq('id', newCustomer.id);
    console.log('🧹 Test customer cleaned up');
  }
  
} catch (error) {
  console.log('❌ Customer test error:', error.message);
}

// Test 3: Try to create a test lead
try {
  console.log('\n🎯 Testing lead creation...');
  
  const testLead = {
    name: 'Test Lead ' + Date.now(),
    email: 'testlead@example.com',
    phone: '+1234567890',
    company: 'Test Lead Company',
    status: 'new',
    source: 'Website',
    lifecycle_stage: 'lead',
    priority_level: 'medium',
    contact_preferences: ['email'],
    responsible_person: 'Mr. Ali',
    notes: 'Test lead for schema validation'
  };
  
  const { data: newLead, error: leadError } = await supabase
    .from('leads')
    .insert(testLead)
    .select()
    .single();
  
  if (leadError) {
    console.log('❌ Lead creation error:', leadError.message);
    console.log('Error details:', leadError);
  } else {
    console.log('✅ Lead created successfully:', newLead.id);
    
    // Clean up - delete the test lead
    await supabase.from('leads').delete().eq('id', newLead.id);
    console.log('🧹 Test lead cleaned up');
  }
  
} catch (error) {
  console.log('❌ Lead test error:', error.message);
}

console.log('\n🏁 Database operation tests completed!');