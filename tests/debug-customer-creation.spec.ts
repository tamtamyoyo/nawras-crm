import { test, expect } from '@playwright/test';

test.describe('Debug Customer Creation', () => {
  test('should debug customer creation and UI update', async ({ page }) => {
    // Navigate to customers page
    await page.goto('http://localhost:5176/customers');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="page-title"]');
    
    // Count initial customers
    const initialCards = await page.locator('.grid.gap-6 > .hover\\:shadow-md').count();
    console.log(`Initial customer count: ${initialCards}`);
    
    // Open add customer modal
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]');
    
    // Fill form with unique data
    const uniqueName = `Test Customer ${Date.now()}`;
    await page.fill('[data-testid="customer-name-input"]', uniqueName);
    await page.fill('[data-testid="customer-email-input"]', `test${Date.now()}@example.com`);
    await page.fill('[data-testid="customer-phone-input"]', '555-0123');
    
    // Monitor console logs during submission
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="customer-name-input"]', { state: 'detached', timeout: 10000 });
    
    // Wait a bit for UI to update
    await page.waitForTimeout(2000);
    
    // Check if customer was added to the store by evaluating window state
    const storeCustomers = await page.evaluate(() => {
      // Access the zustand store directly
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        return store.getState().customers;
      }
      return null;
    });
    
    console.log('Store customers:', storeCustomers?.length || 'Store not accessible');
    
    // Count customers after creation
    const finalCards = await page.locator('.grid.gap-6 > .hover\\:shadow-md').count();
    console.log(`Final customer count: ${finalCards}`);
    
    // Check if the new customer name appears on the page using a more specific selector
    const customerNameElement = page.locator('h3').filter({ hasText: uniqueName });
    const customerVisible = await customerNameElement.isVisible();
    console.log(`Customer "${uniqueName}" visible: ${customerVisible}`);
    
    // Also check if it exists in the DOM at all
    const customerExists = await customerNameElement.count() > 0;
    console.log(`Customer "${uniqueName}" exists in DOM: ${customerExists}`);
    
    // Get all customer names for debugging
    const allCustomerNames = await page.locator('h3').allTextContents();
    console.log('All customer names on page:', allCustomerNames.slice(0, 10)); // Show first 10
    
    // Print all console logs
    console.log('Console logs during creation:');
    consoleLogs.forEach(log => console.log(log));
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-customer-creation.png', fullPage: true });
    
    // Assertions
    expect(finalCards).toBeGreaterThan(initialCards);
    expect(customerVisible).toBe(true);
  });
});