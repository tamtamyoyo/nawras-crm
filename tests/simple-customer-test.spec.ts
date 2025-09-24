import { test, expect } from '@playwright/test';

test.describe('Simple Customer Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/customers');
    await page.waitForLoadState('networkidle');
  });

  test('Create a single customer', async ({ page }) => {
    // Already on customers page from beforeEach
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Get initial count
    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial customer count: ${initialRows}`);
    
    // Click Add Customer button
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForTimeout(1000);
    
    // Fill form
    const testCustomer = {
      name: 'Test Customer ' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      phone: '+1234567890',
      company: 'Test Company'
    };
    
    await page.fill('[data-testid="customer-name-input"]', testCustomer.name);
    await page.fill('[data-testid="customer-email-input"]', testCustomer.email);
    await page.fill('[data-testid="customer-phone-input"]', testCustomer.phone);
    await page.fill('[data-testid="customer-company-input"]', testCustomer.company);
    
    // Submit form
    await page.click('[data-testid="customer-save-button"]');
    
    // Wait for submission
    await page.waitForTimeout(3000);
    
    // Check if modal is closed (form should not be visible)
    const modalVisible = await page.locator('[data-testid="customer-name-input"]').isVisible().catch(() => false);
    console.log(`Modal still visible after submit: ${modalVisible}`);
    
    // Reload page to ensure fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if customer exists
    const customerExists = await page.getByText(testCustomer.name).isVisible();
    console.log(`Customer found: ${customerExists}`);
    
    if (!customerExists) {
      // Debug: show current customers
      const currentRows = await page.locator('tbody tr').count();
      console.log(`Current customer count: ${currentRows}`);
      
      for (let i = 0; i < Math.min(currentRows, 3); i++) {
        const name = await page.locator(`tbody tr:nth-child(${i + 1}) td:first-child`).textContent();
        console.log(`Customer ${i + 1}: ${name}`);
      }
    }
    
    expect(customerExists).toBe(true);
  });
});