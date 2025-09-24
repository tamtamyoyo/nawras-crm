import { test, expect } from '@playwright/test';

test.describe('CRM Comprehensive Functionality Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication bypass to take effect
    await page.waitForTimeout(2000);
    
    // Ensure navigation is visible (testing bypass should work)
    const navElement = page.locator('[data-testid="desktop-nav-dashboard"]');
    await navElement.waitFor({ timeout: 10000 });
  });

  test('Complete Customer CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Customer CRUD Operations');
    
    // Navigate to customers page
    await page.click('[data-testid="desktop-nav-customers"]');
    await page.waitForLoadState('networkidle');
    
    // Test CREATE operation
    console.log('📝 Testing Customer Creation');
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]');
    
    const testCustomer = {
      name: `Test Customer ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      phone: '555-0123',
      company: 'Test Company',
      address: '123 Test Street'
    };
    
    await page.fill('[data-testid="customer-name-input"]', testCustomer.name);
    await page.fill('[data-testid="customer-email-input"]', testCustomer.email);
    await page.fill('[data-testid="customer-phone-input"]', testCustomer.phone);
    await page.fill('[data-testid="customer-company-input"]', testCustomer.company);
    await page.fill('[data-testid="customer-address-input"]', testCustomer.address);
    
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(2000);
    
    // Verify customer appears in list
    const customerCard = page.locator('.hover\\:shadow-md').filter({ hasText: testCustomer.name });
    await expect(customerCard).toBeVisible();
    console.log('✅ Customer creation successful');
    
    // Test READ operation - reload page and verify persistence
    console.log('📖 Testing Customer Data Persistence');
    await page.reload();
    await page.waitForLoadState('networkidle');
    const persistedCustomerCard = page.locator('.hover\\:shadow-md').filter({ hasText: testCustomer.name });
    await expect(persistedCustomerCard).toBeVisible();
    console.log('✅ Customer data persists after reload');
    
    // Test UPDATE operation
    console.log('✏️ Testing Customer Update');
    await persistedCustomerCard.locator('[data-testid="edit-customer-button"]').click();
    await page.waitForSelector('[data-testid="customer-name-input"]');
    
    const updatedName = `${testCustomer.name} - Updated`;
    await page.fill('[data-testid="customer-name-input"]', updatedName);
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(2000);
    
    // Verify update
    const updatedCustomerCard = page.locator('.hover\\:shadow-md').filter({ hasText: updatedName });
    await expect(updatedCustomerCard).toBeVisible();
    console.log('✅ Customer update successful');
    
    // Test DELETE operation
    console.log('🗑️ Testing Customer Deletion');
    await updatedCustomerCard.locator('xpath=..').locator('[data-testid="delete-customer-button"]').click();
    await page.waitForTimeout(2000);
    
    // Verify deletion
    await expect(updatedCustomerCard).not.toBeVisible();
    console.log('✅ Customer deletion successful');
  });

  test('Complete Lead CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Lead CRUD Operations');
    
    // Navigate to leads page
    await page.click('[data-testid="desktop-nav-leads"]');
    await page.waitForLoadState('networkidle');
    
    // Test CREATE operation
    console.log('📝 Testing Lead Creation');
    await page.click('[data-testid="add-lead-button"]');
    await page.waitForSelector('[data-testid="lead-name-input"]');
    
    const testLead = {
      name: `Test Lead ${Date.now()}`,
      email: `lead${Date.now()}@example.com`,
      phone: '555-0456',
      company: 'Lead Company'
    };
    
    await page.fill('[data-testid="lead-name-input"]', testLead.name);
    await page.fill('[data-testid="lead-email-input"]', testLead.email);
    await page.fill('[data-testid="lead-phone-input"]', testLead.phone);
    await page.fill('[data-testid="lead-company-input"]', testLead.company);
    
    await page.click('[data-testid="lead-save-button"]');
    await page.waitForTimeout(2000);
    
    // Verify lead appears in list
    const leadCard = page.locator(`text=${testLead.name}`);
    await expect(leadCard).toBeVisible();
    console.log('✅ Lead creation successful');
    
    // Test READ operation - reload page and verify persistence
    console.log('📖 Testing Lead Data Persistence');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(leadCard).toBeVisible();
    console.log('✅ Lead data persists after reload');
    
    // Test UPDATE operation
    console.log('✏️ Testing Lead Update');
    await leadCard.locator('xpath=..').locator('[data-testid="edit-lead-button"]').click();
    await page.waitForSelector('[data-testid="lead-name-input"]');
    
    const updatedName = `${testLead.name} - Updated`;
    await page.fill('[data-testid="lead-name-input"]', updatedName);
    await page.click('[data-testid="lead-save-button"]');
    await page.waitForTimeout(2000);
    
    // Verify update
    const updatedLeadCard = page.locator(`text=${updatedName}`);
    await expect(updatedLeadCard).toBeVisible();
    console.log('✅ Lead update successful');
    
    // Test DELETE operation
    console.log('🗑️ Testing Lead Deletion');
    await updatedLeadCard.locator('xpath=..').locator('[data-testid="delete-lead-button"]').click();
    await page.waitForTimeout(2000);
    
    // Verify deletion
    await expect(updatedLeadCard).not.toBeVisible();
    console.log('✅ Lead deletion successful');
  });

  test('Complete Deal CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Deal CRUD Operations');
    
    // Navigate to deals page
    await page.click('[data-testid="desktop-nav-deals"]');
    await page.waitForLoadState('networkidle');
    
    // Test CREATE operation
    console.log('📝 Testing Deal Creation');
    await page.click('[data-testid="add-deal-button"]');
    await page.waitForSelector('[data-testid="deal-title-input"]');
    
    const testDeal = {
      title: `Test Deal ${Date.now()}`,
      value: '50000',
      description: 'Test deal description'
    };
    
    await page.fill('[data-testid="deal-title-input"]', testDeal.title);
    await page.fill('[data-testid="deal-value-input"]', testDeal.value);
    await page.fill('[data-testid="deal-description-input"]', testDeal.description);
    
    await page.click('[data-testid="deal-save-button"]');
    await page.waitForTimeout(2000);
    
    // Verify deal appears in list
    const dealCard = page.locator(`text=${testDeal.title}`);
    await expect(dealCard).toBeVisible();
    console.log('✅ Deal creation successful');
    
    // Test READ operation - reload page and verify persistence
    console.log('📖 Testing Deal Data Persistence');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(dealCard).toBeVisible();
    console.log('✅ Deal data persists after reload');
    
    // Test UPDATE operation
    console.log('✏️ Testing Deal Update');
    await dealCard.locator('xpath=..').locator('[data-testid="edit-deal-button"]').click();
    await page.waitForSelector('[data-testid="deal-title-input"]');
    
    const updatedTitle = `${testDeal.title} - Updated`;
    await page.fill('[data-testid="deal-title-input"]', updatedTitle);
    await page.click('[data-testid="deal-save-button"]');
    await page.waitForTimeout(2000);
    
    // Verify update
    const updatedDealCard = page.locator(`text=${updatedTitle}`);
    await expect(updatedDealCard).toBeVisible();
    console.log('✅ Deal update successful');
    
    // Test DELETE operation
    console.log('🗑️ Testing Deal Deletion');
    await updatedDealCard.locator('xpath=..').locator('[data-testid="delete-deal-button"]').click();
    await page.waitForTimeout(2000);
    
    // Verify deletion
    await expect(updatedDealCard).not.toBeVisible();
    console.log('✅ Deal deletion successful');
  });

  test('Data Persistence Across Navigation', async ({ page }) => {
    console.log('🧪 Testing Data Persistence Across Navigation');
    
    // Create a customer
    await page.click('[data-testid="desktop-nav-customers"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]');
    
    const testCustomer = `Navigation Test Customer ${Date.now()}`;
    await page.fill('[data-testid="customer-name-input"]', testCustomer);
    await page.fill('[data-testid="customer-email-input"]', `nav${Date.now()}@test.com`);
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(2000);
    
    // Navigate to different pages and back
    await page.click('[data-testid="desktop-nav-leads"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="desktop-nav-deals"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="desktop-nav-dashboard"]');
    await page.waitForLoadState('networkidle');
    
    // Return to customers and verify data still exists
    await page.click('[data-testid="desktop-nav-customers"]');
    await page.waitForLoadState('networkidle');
    
    const customerCard = page.locator(`text=${testCustomer}`);
    await expect(customerCard).toBeVisible();
    console.log('✅ Data persists across navigation');
  });

  test('Form Validation and Error Handling', async ({ page }) => {
    console.log('🧪 Testing Form Validation');
    
    // Test customer form validation
    await page.click('[data-testid="desktop-nav-customers"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]');
    
    // Try to save without required fields
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(1000);
    
    // Check if form validation prevents submission
    const nameInput = page.locator('[data-testid="customer-name-input"]');
    await expect(nameInput).toBeVisible(); // Form should still be open
    console.log('✅ Form validation working correctly');
    
    // Cancel the form
    await page.click('[data-testid="customer-cancel-button"]');
    await page.waitForTimeout(1000);
  });
});