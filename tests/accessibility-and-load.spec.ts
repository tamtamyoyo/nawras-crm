import { test, expect } from '@playwright/test';

test.describe('Accessibility and Initial Load Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Check if page loads within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Check if page title is present
    await expect(page).toHaveTitle(/CRM|Simple CRM/);
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'test-results/homepage-load.png' });
  });

  test('should have no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow some time for any delayed console errors
    await page.waitForTimeout(2000);
    
    // Filter out known acceptable errors (if any)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile navigation is present or desktop nav is hidden
    const mobileElements = await page.locator('[data-testid="mobile-nav"], .mobile-menu, .hamburger').count();
    const desktopNav = await page.locator('nav').first();
    
    // Either mobile nav exists or desktop nav adapts
    const isResponsive = mobileElements > 0 || await desktopNav.isVisible();
    expect(isResponsive).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/mobile-responsive.png' });
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential meta tags
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('should load CSS and JavaScript resources', async ({ page }) => {
    const resourceErrors: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 400 && (response.url().includes('.css') || response.url().includes('.js'))) {
        resourceErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(resourceErrors).toHaveLength(0);
  });
});