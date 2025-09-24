import { test, expect } from '@playwright/test';

test.describe('Direct Navigation Test', () => {
  test('Navigate directly to customers page and verify data loading', async ({ page }) => {
    // Navigate directly to customers page
    await page.goto('http://localhost:5173/customers');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if we can see either customers or empty state
    const hasCustomers = await page.locator('[data-testid="customer-card"]').count();
    const hasEmptyState = await page.locator('[data-testid="add-customer-empty-state"]').isVisible().catch(() => false);
    const hasAddButton = await page.locator('[data-testid="add-customer-button"]').isVisible().catch(() => false);
    
    console.log(`Customer cards found: ${hasCustomers}`);
    console.log(`Empty state visible: ${hasEmptyState}`);
    console.log(`Add button visible: ${hasAddButton}`);
    
    // At least one of these should be true
    expect(hasCustomers > 0 || hasEmptyState || hasAddButton).toBeTruthy();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/direct-navigation-debug.png' });
  });
});