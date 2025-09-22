/**
 * Browser-based CRM Functionality Test
 * Run this in the browser console to test all CRUD operations
 */

// Import Supabase client from the global scope
const testCRM = async () => {
  console.log('🚀 Starting CRM Functionality Tests...');
  console.log('=' .repeat(60));
  
  // Get supabase from window or import
  const { supabase } = await import('/src/lib/supabase-client.js');
  
  if (!supabase) {
    console.error('❌ Supabase client not available');
    return false;
  }
  
  console.log('✅ Supabase client loaded successfully');
  
  // Test data
  const testLead = {
    name: 'Test Lead ' + Date.now(),
    email: `testlead${Date.now()}@example.com`,
    phone: '+1234567890',
    company: 'Test Company',
    status: 'new',
    source: 'website',
    notes: 'Test lead for CRM functionality testing'
  };
  
  const testCustomer = {
    name: 'Test Customer ' + Date.now(),
    email: `testcustomer${Date.now()}@example.com`,
    phone: '+1234567891',
    company: 'Test Customer Company',
    address: '123 Test Street',
    city: 'Test City',
    country: 'Test Country'
  };
  
  const testDeal = {
    title: 'Test Deal ' + Date.now(),
    amount: 5000,
    stage: 'proposal',
    probability: 75,
    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Test deal for CRM functionality testing'
  };
  
  const testInvoice = {
    invoice_number: `INV-TEST-${Date.now()}`,
    amount: 1000,
    status: 'draft',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Test invoice for CRM functionality testing'
  };
  
  const results = {};
  
  // Test Leads CRUD
  try {
    console.log('\n🧪 Testing Leads CRUD Operations...');
    
    // CREATE
    console.log('📝 Creating test lead...');
    const { data: createdLead, error: createError } = await supabase
      .from('leads')
      .insert([testLead])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Lead creation failed:', createError);
      results.leads = false;
    } else {
      console.log('✅ Lead created successfully:', createdLead.id);
      
      // READ
      console.log('📖 Reading leads...');
      const { data: leads, error: readError } = await supabase
        .from('leads')
        .select('*')
        .limit(5);
      
      if (readError) {
        console.error('❌ Lead reading failed:', readError);
        results.leads = false;
      } else {
        console.log(`✅ Successfully read ${leads.length} leads`);
        
        // UPDATE
        console.log('✏️ Updating test lead...');
        const { data: updatedLead, error: updateError } = await supabase
          .from('leads')
          .update({ status: 'contacted', notes: 'Updated test lead' })
          .eq('id', createdLead.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Lead update failed:', updateError);
          results.leads = false;
        } else {
          console.log('✅ Lead updated successfully');
          
          // DELETE
          console.log('🗑️ Deleting test lead...');
          const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .eq('id', createdLead.id);
          
          if (deleteError) {
            console.error('❌ Lead deletion failed:', deleteError);
            results.leads = false;
          } else {
            console.log('✅ Lead deleted successfully');
            results.leads = true;
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Leads CRUD test failed:', error);
    results.leads = false;
  }
  
  // Test Customers CRUD
  try {
    console.log('\n🧪 Testing Customers CRUD Operations...');
    
    // CREATE
    console.log('📝 Creating test customer...');
    const { data: createdCustomer, error: createError } = await supabase
      .from('customers')
      .insert([testCustomer])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Customer creation failed:', createError);
      results.customers = false;
    } else {
      console.log('✅ Customer created successfully:', createdCustomer.id);
      
      // READ
      console.log('📖 Reading customers...');
      const { data: customers, error: readError } = await supabase
        .from('customers')
        .select('*')
        .limit(5);
      
      if (readError) {
        console.error('❌ Customer reading failed:', readError);
        results.customers = false;
      } else {
        console.log(`✅ Successfully read ${customers.length} customers`);
        
        // UPDATE
        console.log('✏️ Updating test customer...');
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({ city: 'Updated Test City' })
          .eq('id', createdCustomer.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Customer update failed:', updateError);
          results.customers = false;
        } else {
          console.log('✅ Customer updated successfully');
          
          // DELETE
          console.log('🗑️ Deleting test customer...');
          const { error: deleteError } = await supabase
            .from('customers')
            .delete()
            .eq('id', createdCustomer.id);
          
          if (deleteError) {
            console.error('❌ Customer deletion failed:', deleteError);
            results.customers = false;
          } else {
            console.log('✅ Customer deleted successfully');
            results.customers = true;
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Customers CRUD test failed:', error);
    results.customers = false;
  }
  
  // Test Deals CRUD
  try {
    console.log('\n🧪 Testing Deals CRUD Operations...');
    
    // CREATE
    console.log('📝 Creating test deal...');
    const { data: createdDeal, error: createError } = await supabase
      .from('deals