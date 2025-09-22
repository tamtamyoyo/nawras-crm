// Test customer creation using the same logic as the frontend
import { createClient } from '@supabase/supabase-js';

// Use the actual environment variables from .env
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendCustomerCreation() {
  console.log('=== Testing Frontend Customer Creation Logic ===');
  
  // Simulate the exact form data structure from the frontend
  const formData = {
    name: `Frontend Test ${Date.now()}`,
    email: `frontend${Date.now()}@example.com`,
    phone: '123-456-7890',
    company: 'Frontend Test Company',
    address: '123 Test Street',
    notes: 'Test customer created via frontend simulation',
    status: 'prospect',
    responsible_person: 'Mr. Ali'
  };
  
  console.log('Form data to insert:', formData);
  
  try {
    // Simulate the exact insert logic from Customers.tsx
    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...formData,
        created_by: null // This is what the frontend now uses for anonymous users
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Insert failed:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
      return false;
    }
    
    console.log('✅ Customer created successfully:', data);
    return true;
    
  } catch (error) {
    console.log('❌ Catch error:', error);
    return false;
  }
}

async function testCustomerRead() {
  console.log('\n=== Testing Customer Read ===');
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Read failed:', error);
      return false;
    }
    
    console.log('✅ Read successful. Found', data.length, 'customers');
    if (data.length > 0) {
      console.log('Sample customer:', data[0]);
    }
    return true;
    
  } catch (error) {
    console.log('❌ Catch error:', error);
    return false;
  }
}

async function main() {
  console.log('Testing customer operations with current frontend logic...');
  
  // Test read first to verify connection
  const readSuccess = await testCustomerRead();
  if (!readSuccess) {
    console.log('\n❌ Cannot proceed - database connection failed');
    return;
  }
  
  // Test create
  const createSuccess = await testFrontendCustomerCreation();
  
  if (createSuccess) {
    console.log('\n🎉 SUCCESS: Customer creation is working!');
    console.log('The ON CONFLICT issue has been resolved.');
  } else {
    console.log('\n❌ FAILED: Customer creation still has issues.');
  }
}

main().catch(console.error);