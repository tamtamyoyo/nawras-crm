import { test, expect } from '@playwright/test';

test.describe('Supabase Connection Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Verify Supabase connection and offline mode detection', async ({ page }) => {
    console.log('🔍 Testing Supabase connection');
    
    // Navigate to customers page
    await page.click('[data-testid="desktop-nav-customers"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check console logs for offline mode detection
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('offline') || text.includes('Supabase') || text.includes('Loading') || text.includes('🔧')) {
        consoleLogs.push(text);
      }
    });
    
    // Reload the page to trigger fresh data loading
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📝 Console logs:', consoleLogs);
    
    // Check if we can see customer cards (indicating successful data load)
    const customerCards = await page.locator('.hover\\:shadow-md').count();
    console.log('📊 Customer cards found:', customerCards);
    
    // Try to create a customer to test the save functionality
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]');
    
    const testCustomer = {
      name: `Test Customer ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      phone: '555-0123',
      company: 'Test Company'
    };
    
    await page.fill('[data-testid="customer-name-input"]', testCustomer.name);
    await page.fill('[data-testid="customer-email-input"]', testCustomer.email);
    await page.fill('[data-testid="customer-phone-input"]', testCustomer.phone);
    await page.fill('[data-testid="customer-company-input"]', testCustomer.company);
    
    // Clear console logs and listen for save operation
    consoleLogs.length = 0;
    
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(5000); // Wait longer for save operation
    
    console.log('💾 Save operation logs:', consoleLogs);
    
    // Check if customer appears in the list
    const customerVisible = await page.locator('.hover\\:shadow-md').filter({ hasText: testCustomer.name }).isVisible();
    console.log('👀 Customer visible after save:', customerVisible);
    
    // Count customers again
    const newCustomerCount = await page.locator('.hover\\:shadow-md').count();
    console.log('📊 Customer cards after save:', newCustomerCount);
    
    // Take screenshot
    await page.screenshot({ path: 'supabase-connection-test.png', fullPage: true });
    
    // Verify the customer was actually saved
    expect(customerVisible).toBe(true);
    expect(newCustomerCount).toBeGreaterThan(customerCards);
  });
});