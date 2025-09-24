import { test, expect } from '@playwright/test';

test.describe('Comprehensive CRUD Operations Test', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout
    
    // Start from home page for navigation tests
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    // Handle authentication if needed
    if (page.url().includes('/login')) {
      console.log('🔐 Authentication required');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
  });

  test('Customers CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Customers CRUD Operations');
    
    // Navigate directly to customers page
    await page.goto('http://localhost:5173/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial customers count: ${initialCount}`);
    
    const testCustomer = {
      name: 'Test Customer ' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      phone: '+1234567890',
      company: 'Test Company'
    };
    
    // CREATE - Add new customer
    await page.getByTestId('add-customer-button').click();
    await page.waitForTimeout(1000);
    
    console.log('📝 Filling customer form...');
    await page.getByTestId('customer-name-input').fill(testCustomer.name);
    await page.getByTestId('customer-email-input').fill(testCustomer.email);
    await page.getByTestId('customer-phone-input').fill(testCustomer.phone);
    await page.getByTestId('customer-company-input').fill(testCustomer.company);
    
    console.log('💾 Submitting customer form...');
    await page.getByTestId('customer-save-button').click();
    await page.waitForTimeout(3000);
    
    // Check if modal is closed
    const modalVisible = await page.locator('[data-testid="customer-name-input"]').isVisible().catch(() => false);
    console.log(`📋 Modal still visible: ${modalVisible}`);
    
    // Reload to ensure fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🔍 Looking for customer: ${testCustomer.name}`);
    const customerExists = await page.getByText(testCustomer.name).isVisible();
    expect(customerExists).toBeTruthy();
    console.log('✅ Customer created successfully');
    
    // READ - Verify customer appears in list
    const newCount = await page.locator('.grid.gap-6 > .hover\\:shadow-md').count();
    expect(newCount).toBe(initialCount + 1);
    console.log('✅ Customer appears in list');
    
    // UPDATE - Edit the customer
    console.log('✏️ Editing customer...');
    // Find the customer card and click edit button
    const customerCard = page.locator('.hover\\:shadow-md').filter({ hasText: testCustomer.name });
    await customerCard.locator('[data-testid="edit-customer-button"]').click();
    await page.waitForSelector('[data-testid="customer-name-input"]', { state: 'visible' });
    
    const updatedName = testCustomer.name + ' Updated';
    await page.fill('[data-testid="customer-name-input"]', '');
    await page.fill('[data-testid="customer-name-input"]', updatedName);
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify update
    console.log(`🔍 Looking for updated customer: ${updatedName}`);
    const updatedCustomerExists = await page.getByText(updatedName).count() > 0;
    expect(updatedCustomerExists).toBeTruthy();
    console.log('✅ Customer updated successfully');
    
    // DELETE - Remove the customer
    console.log('🗑️ Deleting customer...');
    const updatedCustomerCard = page.locator('.hover\\:shadow-md').filter({ hasText: updatedName });
    await updatedCustomerCard.locator('[data-testid="delete-customer-button"]').click();
    
    // Handle confirmation dialog if it exists
    try {
      await page.click('button:has-text("Delete")', { timeout: 2000 });
    } catch {
      // No confirmation dialog, deletion was immediate
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify deletion
    console.log(`🔍 Verifying deletion of: ${updatedName}`);
    const deletedCustomerExists = await page.getByText(updatedName).count() > 0;
    expect(deletedCustomerExists).toBeFalsy();
    console.log('✅ Customer deleted successfully');
  });

  test('Leads CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Leads CRUD Operations');
    
    await page.goto('http://localhost:5174/leads');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const initialCount = await page.locator('[data-testid="lead-card"], .lead-card, .grid > div').count();
    console.log(`Initial leads count: ${initialCount}`);
    
    // CREATE - Add new lead
    const timestamp = Date.now();
    const testLead = {
      name: `Test Lead ${timestamp}`,
      email: `test-lead-${timestamp}@example.com`,
      phone: `555-${timestamp.toString().slice(-4)}`,
      company: `Lead Company ${timestamp}`,
      status: 'New'
    };
    
    await page.click('button:has-text("Add Lead")');
    await page.waitForTimeout(1000);
    
    // Fill lead form using data-testid selectors
    await page.fill('[data-testid="lead-name-input"]', testLead.name);
    await page.fill('[data-testid="lead-email-input"]', testLead.email);
    await page.fill('[data-testid="lead-phone-input"]', testLead.phone);
    await page.fill('[data-testid="lead-company-input"]', testLead.company);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verify lead was created
    const leadExists = await page.locator(`text=${testLead.name}`).count() > 0;
    expect(leadExists).toBeTruthy();
    console.log('✅ Lead created successfully');
    
    // READ - Verify lead appears in list
    await expect(page.getByText(testLead.name)).toBeVisible();
    await expect(page.getByText(testLead.email)).toBeVisible();
    const newCount = await page.locator('[data-testid="lead-card"], .lead-card, .grid > div').count();
    expect(newCount).toBeGreaterThan(initialCount);
    console.log('✅ Lead appears in list');
  });

  test('Deals CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Deals CRUD Operations');
    
    // First, ensure we have a customer to associate with the deal
    await page.goto('http://localhost:5174/customers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const timestamp = Date.now();
    const testCustomer = {
      name: `Deal Test Customer ${timestamp}`,
      email: `deal-customer-${timestamp}@example.com`,
      company: `Deal Test Company ${timestamp}`
    };
    
    // Create a customer first
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]', { state: 'visible' });
    await page.fill('[data-testid="customer-name-input"]', testCustomer.name);
    await page.fill('[data-testid="customer-email-input"]', testCustomer.email);
    await page.fill('[data-testid="customer-company-input"]', testCustomer.company);
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Now go to deals page
    await page.goto('http://localhost:5174/deals');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const initialCount = await page.locator('[data-testid="deal-card"], .deal-card, .grid > div').count();
    console.log(`Initial deals count: ${initialCount}`);
    
    // CREATE - Add new deal
    const testDeal = {
      title: `Test Deal ${timestamp}`,
      value: '5000',
      probability: 75,
      description: 'Test deal description',
      stage: 'Proposal'
    };
    
    await page.click('button:has-text("Add Deal")');
    await page.waitForTimeout(1000);
    
    await page.fill('[data-testid="deal-title-input"]', testDeal.title);
    
    // Select the customer we just created
    await page.selectOption('[data-testid="deal-customer-select"]', { label: testCustomer.name });
    
    await page.fill('[data-testid="deal-value-input"]', testDeal.value);
    await page.fill('[data-testid="deal-probability-input"]', testDeal.probability.toString());
    await page.fill('[data-testid="deal-description-input"]', testDeal.description);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verify deal was created
    const dealExists = await page.locator(`text=${testDeal.title}`).count() > 0;
    expect(dealExists).toBeTruthy();
    console.log('✅ Deal created successfully');
    
    // READ - Verify deal appears in list
    await expect(page.getByText(testDeal.title)).toBeVisible();
    await expect(page.getByText('$' + parseInt(testDeal.value).toLocaleString())).toBeVisible();
    
    // Verify no data erasure
    const newCount = await page.locator('[data-testid="deal-card"], .deal-card, .grid > div').count();
    expect(newCount).toBeGreaterThan(initialCount);
    console.log('✅ No data erasure detected in deals');
  });

  test('Data Persistence Across Page Refreshes', async ({ page }) => {
    console.log('🧪 Testing Data Persistence Across Page Refreshes');
    
    // Test customers persistence
    await page.goto('http://localhost:5174/customers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const timestamp = Date.now();
    const testCustomer = `Persistence Test ${timestamp}`;
    
    // Add a customer
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]', { state: 'visible' });
    await page.fill('[data-testid="customer-name-input"]', testCustomer);
    await page.fill('[data-testid="customer-email-input"]', `persist-${timestamp}@example.com`);
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(3000);
    
    // Verify customer exists
    let customerExists = await page.locator(`text=${testCustomer}`).count() > 0;
    expect(customerExists).toBeTruthy();
    console.log('✅ Customer created before refresh');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Verify customer still exists after refresh
    customerExists = await page.locator(`text=${testCustomer}`).count() > 0;
    expect(customerExists).toBeTruthy();
    console.log('✅ Customer persists after page refresh');
  });

  test('Multiple Sequential Operations Without Data Loss', async ({ page }) => {
    console.log('🧪 Testing Multiple Sequential Operations Without Data Loss');
    
    await page.goto('http://localhost:5174/customers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const timestamp = Date.now();
    const customers = [
      `Sequential Test 1 ${timestamp}`,
      `Sequential Test 2 ${timestamp}`,
      `Sequential Test 3 ${timestamp}`
    ];
    
    // Add multiple customers sequentially
    for (let i = 0; i < customers.length; i++) {
      await page.click('[data-testid="add-customer-button"]');
      await page.waitForSelector('[data-testid="customer-name-input"]', { state: 'visible' });
      
      await page.fill('[data-testid="customer-name-input"]', customers[i]);
      await page.fill('[data-testid="customer-email-input"]', `seq-test-${i}-${timestamp}@example.com`);
      await page.click('[data-testid="customer-save-button"]');
      await page.waitForTimeout(2000);
      
      console.log(`✅ Added customer ${i + 1}: ${customers[i]}`);
    }
    
    // Verify all customers exist
    for (const customer of customers) {
      const exists = await page.locator(`text=${customer}`).count() > 0;
      expect(exists).toBeTruthy();
      console.log(`✅ Customer "${customer}" persists`);
    }
    
    console.log('🎉 All sequential operations completed without data loss');
  });
});