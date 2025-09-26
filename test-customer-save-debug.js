// Test script to debug customer save functionality
const { createCustomer } = require('./src/services/customerService.ts');

// Test customer data
const testCustomer = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+1-555-123-4567',
  company: 'Test Company',
  address: '123 Test St',
  status: 'active',
  source: 'website',
  responsible_person: 'Mr. Ali',
  notes: 'Test customer for debugging'
};

console.log('Testing customer creation...');
console.log('Customer data:', testCustomer);

// Test the customer creation
try {
  const result = createCustomer(testCustomer);
  console.log('Customer creation result:', result);
} catch (error) {
  console.error('Customer creation failed:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
}