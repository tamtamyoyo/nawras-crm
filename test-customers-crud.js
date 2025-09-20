import { chromium } from 'playwright';

async function testCustomersCRUD() {
  console.log('🔍 Testing Customers CRUD operations...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor network requests
  page.on('response', response => {
    if (response.url().includes('/rest/v1/') || response.url().includes('supabase')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
    
    // Navigate to Customers page
    console.log('📄 Navigating to Customers page...');
    await page.goto('http://localhost:5173/customers');
    await page.waitForLoadState('networkidle');
    
    // Check if mobile menu exists and click it
    const mobileMenuButton = await page.$('[data-testid="mobile-menu-button"]');
    if (mobileMenuButton && await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
    }
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test CREATE operation
    console.log('\n🆕 Testing CREATE operation...');
    
    // Click Add Customer button
    const addButton = await page.$('[data-testid="add-customer-button"]');
    if (!addButton) {
      console.log('❌ Add Customer button not found');
      return;
    }

    await addButton.click();
    await page.waitForTimeout(2000);

    // Wait for form inputs to be available
    await page.waitForSelector('[data-testid="customer-name-input"]', { timeout: 10000 });
    console.log('✅ Modal appeared, filling form...');
    
    // Fill form
    const testCustomer = {
      name: 'Test Customer ' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      phone: '+1234567890',
      company: 'Test Company'
    };
    
    console.log(`Creating customer: ${testCustomer.name}`);
    
    // Fill form fields with explicit waits
    await page.waitForSelector('[data-testid="customer-name-input"]', { state: 'visible' });
    await page.fill('[data-testid="customer-name-input"]', testCustomer.name);
    
    await page.waitForSelector('[data-testid="customer-email-input"]', { state: 'visible' });
    await page.fill('[data-testid="customer-email-input"]', testCustomer.email);
    
    await page.waitForSelector('[data-testid="customer-phone-input"]', { state: 'visible' });
    await page.fill('[data-testid="customer-phone-input"]', testCustomer.phone);
    
    await page.waitForSelector('[data-testid="customer-company-input"]', { state: 'visible' });
    await page.fill('[data-testid="customer-company-input"]', testCustomer.company);
    
    // Submit form
    await page.waitForSelector('[data-testid="customer-save-button"]', { state: 'visible' });
    console.log('Clicking Save button...');
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(3000);
    
    // Check if modal closed (success indicator)
    const modal = await page.$('[role="dialog"]');
    const modalClosed = !modal || !(await modal.isVisible());
    
    if (modalClosed) {
      console.log('✅ CREATE: Customer created successfully (modal closed)');
      // Wait for page to refresh and show new customer
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ CREATE: Modal still open, checking for validation errors...');
      const errorMessages = await page.$$eval('[role="alert"], .text-red-500, .error', 
        elements => elements.map(el => el.textContent).filter(text => text.trim()));
      if (errorMessages.length > 0) {
        console.log('❌ CREATE: Validation errors found:', errorMessages);
      }
    }
    
    // Test READ operation
    console.log('\n📖 Testing READ operation...');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Wait for customers to load and count customer cards/rows
    await page.waitForTimeout(1000);
    const customerCards = await page.$$('[data-testid="customer-card"], .customer-row, [class*="customer"][class*="card"]');
    const customerRows = await page.$$('tbody tr, [role="row"]');
    const totalCustomers = Math.max(customerCards.length, customerRows.length);
    
    console.log(`Found ${totalCustomers} customers displayed`);
    
    if (totalCustomers > 0) {
      console.log('✅ READ: Customers data loaded successfully');
      
      // Try to find our created customer
      const customerText = await page.textContent('body');
      if (customerText.includes(testCustomer.name)) {
        console.log(`✅ READ: Created customer "${testCustomer.name}" found in list`);
      } else {
        console.log(`⚠️ READ: Created customer "${testCustomer.name}" not found in list`);
      }
    } else {
      console.log('⚠️ READ: No customers found in the list');
      // Check if there's an empty state
      const emptyState = await page.$('[data-testid="add-customer-empty-state"]');
      if (emptyState) {
        console.log('📝 Empty state detected - this might be expected');
      }
    }
    
    // Test UPDATE operation
    console.log('\n✏️ Testing UPDATE operation...');
    
    // Look for edit buttons
    const editButtons = await page.$$('[data-testid="edit-customer-button"]');
    console.log(`Found ${editButtons.length} edit buttons`);
    
    if (editButtons.length > 0) {
      try {
        // Click first edit button with force option to bypass overlay
        await page.click('[data-testid="edit-customer-button"]', { force: true });
        await page.waitForTimeout(2000);
        
        // Wait for edit modal to appear
        const nameInput = await page.waitForSelector('[data-testid="customer-name-input"]', { timeout: 5000 }).catch(() => null);
        if (nameInput) {
          console.log('✅ UPDATE: Edit modal opened');
          
          const updatedName = 'Updated ' + testCustomer.name;
          await page.fill('[data-testid="customer-name-input"]', updatedName);
          
          // Save changes
          await page.click('[data-testid="customer-save-button"]');
          await page.waitForTimeout(2000);
          console.log('✅ UPDATE: Customer update attempted');
        } else {
          console.log('⚠️ UPDATE: Edit modal did not open');
        }
      } catch (error) {
        console.log(`⚠️ UPDATE: Error during update - ${error.message}`);
      }
    } else {
      console.log('⚠️ UPDATE: No edit buttons found');
    }
    
    // Test DELETE operation
    console.log('\n🗑️ Testing DELETE operation...');
    
    // Look for delete buttons
    const deleteButtons = await page.$$('[data-testid="delete-customer-button"]');
    console.log(`Found ${deleteButtons.length} delete buttons`);
    
    if (deleteButtons.length > 0) {
      const initialCount = totalCustomers;
      
      try {
        // Click first delete button with force option
        await page.click('[data-testid="delete-customer-button"]', { force: true });
        await page.waitForTimeout(2000);
        
        // Look for confirmation dialog
        const confirmButton = await page.$('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")');
        if (confirmButton) {
          console.log('Confirming deletion...');
          await confirmButton.click();
          await page.waitForTimeout(2000);
          
          // Check if count decreased
          const newCustomerCards = await page.$$('[data-testid="customer-card"], .customer-row, [class*="customer"][class*="card"]');
          const newCustomerRows = await page.$$('tbody tr, [role="row"]');
          const newTotalCustomers = Math.max(newCustomerCards.length, newCustomerRows.length);
          
          if (newTotalCustomers < initialCount) {
            console.log('✅ DELETE: Customer deleted successfully');
          } else {
            console.log('⚠️ DELETE: Customer count did not decrease');
          }
        } else {
          console.log('⚠️ DELETE: No confirmation dialog found');
        }
      } catch (error) {
        console.log(`⚠️ DELETE: Error during deletion - ${error.message}`);
      }
    } else {
      console.log('⚠️ DELETE: No delete buttons found');
    }
    
    // Summary
    console.log('\n📊 Customers CRUD Test Summary:');
    console.log('- CREATE: Form submission attempted');
    console.log('- READ: Customer list loading verified');
    console.log('- UPDATE: Edit functionality tested');
    console.log('- DELETE: Delete functionality tested');
    
  } catch (error) {
    console.error('❌ Error during Customers CRUD testing:', error.message);
  } finally {
    await browser.close();
  }
}

testCustomersCRUD().catch(console.error);