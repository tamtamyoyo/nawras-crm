import { test, expect } from '@playwright/test';

test.describe('Manual Data Persistence Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');
    // Wait for the page to fully load
    await page.waitForTimeout(3000);
  });

  test('should verify customers data persistence', async ({ page }) => {
    // Navigate to customers page using URL
    await page.goto('http://localhost:5174/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if customers page loaded
    await expect(page.locator('h1, h2').filter({ hasText: 'Customers' })).toBeVisible({ timeout: 10000 });

    // Count initial customers
    const customerTable = page.locator('table tbody');
    const initialCustomerRows = await customerTable.locator('tr').count();
    console.log(`Initial customer count: ${initialCustomerRows}`);

    // Add a new customer
    const addButton = page.locator('button').filter({ hasText: /Add Customer|Add/ }).first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // Fill customer form - try different selectors
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="Name"]').first();
    await nameInput.fill('Test Customer 1');
    
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
    await emailInput.fill('test1@example.com');
    
    const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]').first();
    await phoneInput.fill('+1234567890');
    
    const companyInput = page.locator('input[name="company"], input[placeholder*="company" i]').first();
    await companyInput.fill('Test Company');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /Save|Submit|Add|Create/ }).first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify customer was added
    const afterFirstAdd = await customerTable.locator('tr').count();
    console.log(`After first add: ${afterFirstAdd}`);
    
    // Check if the customer appears in the table
    await expect(page.locator('text=Test Customer 1')).toBeVisible({ timeout: 5000 });

    // Add another customer to test data persistence
    await addButton.click();
    await page.waitForTimeout(1000);

    await nameInput.fill('Test Customer 2');
    await emailInput.fill('test2@example.com');
    await phoneInput.fill('+1234567891');
    await companyInput.fill('Test Company 2');
    
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify both customers exist (no data erasure)
    await expect(page.locator('text=Test Customer 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Test Customer 2')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Customer data persistence test passed');
  });

  test('should verify leads data persistence', async ({ page }) => {
    // Navigate to leads page using URL
    await page.goto('http://localhost:5174/leads');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if leads page loaded
    await expect(page.locator('h1, h2').filter({ hasText: 'Leads' })).toBeVisible({ timeout: 10000 });

    // Count initial leads
    const leadTable = page.locator('table tbody');
    const initialLeadRows = await leadTable.locator('tr').count();
    console.log(`Initial lead count: ${initialLeadRows}`);

    // Add a new lead
    const addButton = page.locator('button').filter({ hasText: /Add Lead|Add/ }).first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // Fill lead form
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill('Test Lead 1');
    
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
    await emailInput.fill('lead1@example.com');
    
    const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]').first();
    await phoneInput.fill('+1234567892');
    
    const companyInput = page.locator('input[name="company"], input[placeholder*="company" i]').first();
    await companyInput.fill('Lead Company 1');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /Save|Submit|Add|Create/ }).first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify lead was added
    await expect(page.locator('text=Test Lead 1')).toBeVisible({ timeout: 5000 });

    // Add another lead to test data persistence
    await addButton.click();
    await page.waitForTimeout(1000);

    await nameInput.fill('Test Lead 2');
    await emailInput.fill('lead2@example.com');
    await phoneInput.fill('+1234567893');
    await companyInput.fill('Lead Company 2');
    
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify both leads exist (no data erasure)
    await expect(page.locator('text=Test Lead 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Test Lead 2')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Lead data persistence test passed');
  });

  test('should verify deals data persistence', async ({ page }) => {
    // Navigate to deals page using URL
    await page.goto('http://localhost:5174/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if deals page loaded
    await expect(page.locator('h1, h2').filter({ hasText: 'Deals' })).toBeVisible({ timeout: 10000 });

    // Count initial deals
    const dealTable = page.locator('table tbody');
    const initialDealRows = await dealTable.locator('tr').count();
    console.log(`Initial deal count: ${initialDealRows}`);

    // Add a new deal
    const addButton = page.locator('button').filter({ hasText: /Add Deal|Add/ }).first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // Fill deal form
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill('Test Deal 1');
    
    const valueInput = page.locator('input[name="value"], input[placeholder*="value" i], input[type="number"]').first();
    await valueInput.fill('1000');
    
    const probabilityInput = page.locator('input[name="probability"], input[placeholder*="probability" i]').first();
    if (await probabilityInput.count() > 0) {
      await probabilityInput.fill('50');
    }
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /Save|Submit|Add|Create/ }).first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify deal was added
    await expect(page.locator('text=Test Deal 1')).toBeVisible({ timeout: 5000 });

    // Add another deal to test data persistence
    await addButton.click();
    await page.waitForTimeout(1000);

    await titleInput.fill('Test Deal 2');
    await valueInput.fill('2000');
    
    if (await probabilityInput.count() > 0) {
      await probabilityInput.fill('75');
    }
    
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify both deals exist (no data erasure)
    await expect(page.locator('text=Test Deal 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Test Deal 2')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Deal data persistence test passed');
  });
});