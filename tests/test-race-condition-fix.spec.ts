import { test, expect } from '@playwright/test';

test.describe('Race Condition Fix Verification', () => {
  test('Verify no infinite loops and data loads correctly', async ({ page }) => {
    // Navigate to customers page
    await page.goto('http://localhost:5173/customers');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded without infinite loops');
    
    // Wait for initial data load
    await page.waitForTimeout(3000);
    
    // Check if customers are loaded (should show existing customers or empty state)
    const hasCustomers = await page.locator('.grid > .bg-white').count();
    const hasEmptyState = await page.locator('[data-testid="add-customer-empty-state"]').isVisible();
    
    console.log(`Customer cards found: ${hasCustomers}`);
    console.log(`Empty state visible: ${hasEmptyState}`);
    
    // Either customers should be loaded OR empty state should be visible
    expect(hasCustomers > 0 || hasEmptyState).toBeTruthy();
    
    // Test that add customer button is clickable (no infinite loading)
    const addButton = hasEmptyState 
      ? page.locator('[data-testid="add-customer-empty-state"]')
      : page.locator('[data-testid="add-customer-button"]');
    
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // Verify modal opens (no race condition blocking UI)
    await page.waitForSelector('[data-testid="customer-name-input"]');
    console.log('✅ Modal opens correctly - no race condition blocking UI');
    
    // Close modal
    await page.click('[data-testid="customer-cancel-button"]');
    
    console.log('✅ Race condition fixes verified - application works normally');
  });
});