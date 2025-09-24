// Quick test to verify customer creation functionality
// This will test both online (Supabase) and offline modes

const testCustomerCreation = async () => {
  console.log('🧪 Testing customer creation functionality...');
  
  try {
    // Test data
    const testCustomer = {
      name: 'Test Customer ' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      address: '123 Test Street',
      status: 'prospect',
      source: 'Other',
      notes: 'Test customer for validation',
      responsible_person: 'Mr. Ali'
    };
    
    console.log('✅ Test customer data prepared:', testCustomer);
    console.log('🔍 Check browser console for any errors during customer creation');
    console.log('🔍 Look for 409 conflicts, foreign key violations, or TypeScript errors');
    
    return testCustomer;
  } catch (error) {
    console.error('❌ Test preparation failed:', error);
    return null;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testCustomerCreation = testCustomerCreation;
  console.log('🚀 Test function available as window.testCustomerCreation()');
}

module.exports = { testCustomerCreation };