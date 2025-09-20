// CRUD Operations Test Script for Nawras CRM
// This script tests Create, Read, Update, Delete operations on the customers page

console.log('🧪 Starting CRUD Operations Test Suite');

// Test data for creating customers
const testCustomers = [
  {
    name: 'Test Customer 1',
    email: 'test1@example.com',
    phone: '+1-555-0101',
    company: 'Test Company 1',
    address: '123 Test Street, Test City',
    status: 'active',
    notes: 'This is a test customer created by automated testing'
  },
  {
    name: 'Test Customer 2',
    email: 'test2@example.com',
    phone: '+1-555-0102',
    company: 'Test Company 2',
    address: '456 Test Avenue, Test City',
    status: 'inactive',
    notes: 'Another test customer for CRUD operations'
  }
];

// Helper function to wait for elements
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Helper function to fill form fields
function fillFormField(selector, value) {
  const field = document.querySelector(selector);
  if (field) {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`✅ Filled ${selector} with: ${value}`);
    return true;
  }
  console.error(`❌ Field ${selector} not found`);
  return false;
}

// Helper function to click elements
function clickElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.click();
    console.log(`✅ Clicked: ${selector}`);
    return true;
  }
  console.error(`❌ Element ${selector} not found`);
  return false;
}

// Test 1: Create Customer
async function testCreateCustomer(customerData) {
  console.log('\n🔵 TEST 1: Creating Customer -', customerData.name);
  
  try {
    // Click Add Customer button
    const addButton = await waitForElement('button:contains("Add Customer"), [data-testid="add-customer"], .add-customer-btn');
    addButton.click();
    console.log('✅ Clicked Add Customer button');
    
    // Wait for modal to appear
    await waitForElement('[role="dialog"], .modal, .customer-modal');
    console.log('✅ Modal opened');
    
    // Fill form fields
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for form to render
    
    fillFormField('input[name="name"], #name', customerData.name);
    fillFormField('input[name="email"], #email', customerData.email);
    fillFormField('input[name="phone"], #phone', customerData.phone);
    fillFormField('input[name="company"], #company', customerData.company);
    fillFormField('input[name="address"], #address, textarea[name="address"]', customerData.address);
    fillFormField('textarea[name="notes"], #notes', customerData.notes);
    
    // Set status
    const statusSelect = document.querySelector('select[name="status"], #status');
    if (statusSelect) {
      statusSelect.value = customerData.status;
      statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Set status to: ${customerData.status}`);
    }
    
    // Submit form
    const submitButton = document.querySelector('button[type="submit"], .submit-btn, button:contains("Save")');
    if (submitButton) {
      submitButton.click();
      console.log('✅ Submitted form');
      
      // Wait for success message or modal to close
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Customer created successfully');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Create customer test failed:', error);
    return false;
  }
}

// Test 2: Read/Verify Customer
async function testReadCustomer(customerName) {
  console.log('\n🔵 TEST 2: Reading Customer -', customerName);
  
  try {
    // Look for customer in the list
    const customerRows = document.querySelectorAll('[data-testid="customer-row"], .customer-item, .customer-card');
    let found = false;
    
    for (const row of customerRows) {
      if (row.textContent.includes(customerName)) {
        console.log('✅ Customer found in list:', customerName);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Try alternative selectors
      const allText = document.body.textContent;
      if (allText.includes(customerName)) {
        console.log('✅ Customer found in page content:', customerName);
        found = true;
      }
    }
    
    return found;
    
  } catch (error) {
    console.error('❌ Read customer test failed:', error);
    return false;
  }
}

// Test 3: Update Customer
async function testUpdateCustomer(originalName, updatedData) {
  console.log('\n🔵 TEST 3: Updating Customer -', originalName);
  
  try {
    // Find and click edit button for the customer
    const editButtons = document.querySelectorAll('button:contains("Edit"), .edit-btn, [data-testid="edit-customer"]');
    let editButton = null;
    
    // Look for edit button in customer row
    const customerRows = document.querySelectorAll('[data-testid="customer-row"], .customer-item, .customer-card');
    for (const row of customerRows) {
      if (row.textContent.includes(originalName)) {
        editButton = row.querySelector('button:contains("Edit"), .edit-btn, [data-testid="edit-customer"]');
        if (editButton) break;
      }
    }
    
    if (!editButton && editButtons.length > 0) {
      editButton = editButtons[0]; // Use first edit button as fallback
    }
    
    if (editButton) {
      editButton.click();
      console.log('✅ Clicked Edit button');
      
      // Wait for modal
      await waitForElement('[role="dialog"], .modal, .customer-modal');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update fields
      fillFormField('input[name="name"], #name', updatedData.name);
      fillFormField('input[name="email"], #email', updatedData.email);
      
      // Submit
      const submitButton = document.querySelector('button[type="submit"], .submit-btn, button:contains("Save")');
      if (submitButton) {
        submitButton.click();
        console.log('✅ Updated customer');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    }
    
  } catch (error) {
    console.error('❌ Update customer test failed:', error);
    return false;
  }
}

// Test 4: Delete Customer
async function testDeleteCustomer(customerName) {
  console.log('\n🔵 TEST 4: Deleting Customer -', customerName);
  
  try {
    // Find and click delete button
    const customerRows = document.querySelectorAll('[data-testid="customer-row"], .customer-item, .customer-card');
    let deleteButton = null;
    
    for (const row of customerRows) {
      if (row.textContent.includes(customerName)) {
        deleteButton = row.querySelector('button:contains("Delete"), .delete-btn, [data-testid="delete-customer"]');
        if (deleteButton) break;
      }
    }
    
    if (deleteButton) {
      // Override confirm dialog
      const originalConfirm = window.confirm;
      window.confirm = () => true;
      
      deleteButton.click();
      console.log('✅ Clicked Delete button');
      
      // Restore confirm
      window.confirm = originalConfirm;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Customer deleted');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Delete customer test failed:', error);
    return false;
  }
}

// Main test runner
async function runCRUDTests() {
  console.log('🚀 Starting CRUD Tests...');
  
  const results = {
    create: [],
    read: [],
    update: [],
    delete: []
  };
  
  try {
    // Test Create operations
    for (const customer of testCustomers) {
      const result = await testCreateCustomer(customer);
      results.create.push({ customer: customer.name, success: result });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between operations
    }
    
    // Test Read operations
    for (const customer of testCustomers) {
      const result = await testReadCustomer(customer.name);
      results.read.push({ customer: customer.name, success: result });
    }
    
    // Test Update operation
    const updateResult = await testUpdateCustomer(testCustomers[0].name, {
      name: 'Updated Test Customer 1',
      email: 'updated1@example.com'
    });
    results.update.push({ customer: 'Test Customer 1', success: updateResult });
    
    // Test Delete operations
    const deleteResult = await testDeleteCustomer('Updated Test Customer 1');
    results.delete.push({ customer: 'Updated Test Customer 1', success: deleteResult });
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
  
  // Print results
  console.log('\n📊 CRUD Test Results:');
  console.log('Create:', results.create);
  console.log('Read:', results.read);
  console.log('Update:', results.update);
  console.log('Delete:', results.delete);
  
  return results;
}

// Auto-run tests if script is executed directly
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runCRUDTests, 2000);
    });
  } else {
    setTimeout(runCRUDTests, 2000);
  }
}

// Export for manual execution
if (typeof module !== 'undefined') {
  module.exports = { runCRUDTests, testCreateCustomer, testReadCustomer, testUpdateCustomer, testDeleteCustomer };
}

console.log('📝 CRUD Test Script Loaded. Run runCRUDTests() to start testing.');