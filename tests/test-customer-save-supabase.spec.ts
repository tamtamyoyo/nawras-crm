import { test, expect } from '@playwright/test';

test.describe('Customer Save to Supabase Test', () => {
  test('Verify customer is saved to Supabase and appears in list', async ({ page }) => {
    console.log('🔍 Starting Supabase customer save test');
    
    // Navigate to customers page
    await page.goto('http://localhost:5176/customers');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to customers page');
    
    // Wait for initial data load
    await page.waitForTimeout(3000);
    
    // Count initial customers
    const initialCustomerCards = await page.locator('.hover\\:shadow-md').count();
    console.log(`📊 Initial customer count: ${initialCustomerCards}`);
    
    // Create test customer with unique name
    const timestamp = Date.now();
    const testCustomer = {
      name: `Test Customer ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: `+1234567${timestamp.toString().slice(-3)}`,
      company: `Test Company ${timestamp}`,
      address: `123 Test St ${timestamp}`
    };
    
    console.log('🔍 Test customer data:', testCustomer);
    
    // Click add customer button
    await page.click('[data-testid="add-customer-button"]');
    // Wait for modal to appear by checking for the name input field
    await page.waitForSelector('[data-testid="customer-name-input"]');
    console.log('✅ Modal opened');
    
    // Fill out the form using data-testid selectors
    await page.fill('[data-testid="customer-name-input"]', testCustomer.name);
    await page.fill('[data-testid="customer-email-input"]', testCustomer.email);
    await page.fill('[data-testid="customer-phone-input"]', testCustomer.phone);
    await page.fill('[data-testid="customer-company-input"]', testCustomer.company);
    await page.fill('[data-testid="customer-address-input"]', testCustomer.address);
    console.log('✅ Form filled');
    
    // Save customer
    await page.click('[data-testid="customer-save-button"]');
    console.log('✅ Save button clicked');
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="customer-modal"]', { state: 'hidden', timeout: 10000 });
    console.log('✅ Modal closed');
    
    // Wait for potential data refresh
    await page.waitForTimeout(2000);
    
    // Check if customer appears in the list
    const finalCustomerCards = await page.locator('.hover\\:shadow-md').count();
    console.log(`📊 Final customer count: ${finalCustomerCards}`);
    
    // Look for the specific customer
    const customerCard = page.locator('.hover\\:shadow-md').filter({ hasText: testCustomer.name });
    const isVisible = await customerCard.isVisible();
    console.log(`🔍 Customer card visible: ${isVisible}`);
    
    if (isVisible) {
      console.log('✅ Customer successfully created and visible');
      
      // Verify customer details
      await expect(customerCard.locator('h3')).toContainText(testCustomer.name);
      await expect(customerCard).toContainText(testCustomer.email);
      await expect(customerCard).toContainText(testCustomer.company);
      console.log('✅ Customer details verified');
    } else {
      console.log('❌ Customer not found in list');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/customer-save-debug.png', fullPage: true });
      
      // Check console logs for errors
      const logs = await page.evaluate(() => {
        return (window as any).testLogs || [];
      });
      console.log('🔍 Browser logs:', logs);
      
      // Check if we're in offline mode
      const offlineMode = await page.evaluate(() => {
        return localStorage.getItem('offlineMode') || 'not set';
      });
      console.log('🔍 Offline mode status:', offlineMode);
      
      throw new Error('Customer was not found in the list after creation');
    }
  });
});