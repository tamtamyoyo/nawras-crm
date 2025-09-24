import { test, expect } from '@playwright/test';

test.describe('Comprehensive Race Condition Fix Verification', () => {
  test('Verify all pages load without infinite loops', async ({ page }) => {
    // Test Customers page
    console.log('Testing Customers page...');
    await page.goto('http://localhost:5173/customers');
    await page.waitForTimeout(2000);
    
    // Check customers page loads properly
    const customersAddButton = await page.locator('[data-testid="add-customer-button"]').isVisible().catch(() => false);
    expect(customersAddButton).toBeTruthy();
    console.log('✅ Customers page loaded successfully');
    
    // Test Leads page
    console.log('Testing Leads page...');
    await page.goto('http://localhost:5173/leads');
    await page.waitForTimeout(2000);
    
    // Check leads page loads properly
    const leadsAddButton = await page.locator('[data-testid="add-lead-button"]').isVisible().catch(() => false);
    const leadsEmptyState = await page.locator('[data-testid="add-lead-empty-state"]').isVisible().catch(() => false);
    expect(leadsAddButton || leadsEmptyState).toBeTruthy();
    console.log('✅ Leads page loaded successfully');
    
    // Test Deals page
    console.log('Testing Deals page...');
    await page.goto('http://localhost:5173/deals');
    await page.waitForTimeout(2000);
    
    // Check deals page loads properly
    const dealsAddButton = await page.locator('[data-testid="add-deal-button"]').isVisible().catch(() => false);
    const dealsEmptyState = await page.locator('[data-testid="add-deal-empty-state"]').isVisible().catch(() => false);
    expect(dealsAddButton || dealsEmptyState).toBeTruthy();
    console.log('✅ Deals page loaded successfully');
    
    // Navigate back to customers to test navigation stability
    console.log('Testing navigation stability...');
    await page.goto('http://localhost:5173/customers');
    await page.waitForTimeout(1000);
    
    const finalCustomersCheck = await page.locator('[data-testid="add-customer-button"]').isVisible().catch(() => false);
    expect(finalCustomersCheck).toBeTruthy();
    console.log('✅ Navigation stability confirmed');
    
    console.log('🎉 All race condition fixes verified successfully!');
  });
  
  test('Verify no infinite API calls by checking network activity', async ({ page }) => {
    let requestCount = 0;
    
    // Monitor network requests
    page.on('request', (request) => {
      if (request.url().includes('supabase') || request.url().includes('customers') || request.url().includes('leads') || request.url().includes('deals')) {
        requestCount++;
        console.log(`API Request ${requestCount}: ${request.method()} ${request.url()}`);
      }
    });
    
    // Navigate to customers page
    await page.goto('http://localhost:5173/customers');
    await page.waitForTimeout(5000); // Wait 5 seconds to observe any infinite loops
    
    // Should not have excessive API calls (more than 10 would indicate a problem)
    console.log(`Total API requests: ${requestCount}`);
    expect(requestCount).toBeLessThan(10);
    
    console.log('✅ No infinite API calls detected');
  });
});