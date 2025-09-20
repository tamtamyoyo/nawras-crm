import { test, expect } from '@playwright/test';

test.describe('Navigation Debug Tests', () => {
  test('should check navigation elements presence', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for app to load
    
    // Check if we're redirected to login or dashboard
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-navigation.png', fullPage: true });
    
    // Check for navigation elements
    const desktopNavDashboard = page.locator('[data-testid="desktop-nav-dashboard"]');
    const mobileNavDashboard = page.locator('[data-testid="mobile-nav-dashboard"]');
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    
    console.log('Desktop nav dashboard present:', await desktopNavDashboard.count());
    console.log('Mobile nav dashboard present:', await mobileNavDashboard.count());
    console.log('Mobile menu button present:', await mobileMenuButton.count());
    
    // Check if desktop navigation is visible
    if (await desktopNavDashboard.count() > 0) {
      console.log('Desktop nav dashboard visible:', await desktopNavDashboard.isVisible());
      console.log('Desktop nav dashboard text:', await desktopNavDashboard.textContent());
    }
    
    // Check all navigation links
    const allNavLinks = page.locator('[data-testid^="desktop-nav-"]');
    const navCount = await allNavLinks.count();
    console.log('Total desktop nav links found:', navCount);
    
    for (let i = 0; i < navCount; i++) {
      const link = allNavLinks.nth(i);
      const testId = await link.getAttribute('data-testid');
      const text = await link.textContent();
      const visible = await link.isVisible();
      console.log(`Nav link ${i}: testid=${testId}, text=${text}, visible=${visible}`);
    }
    
    // Check if we need to handle authentication
    const loginForm = page.locator('form');
    if (await loginForm.count() > 0) {
      console.log('Login form detected - authentication required');
    }
    
    // Check for any error messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red-500');
    const errorCount = await errorMessages.count();
    if (errorCount > 0) {
      console.log('Error messages found:', errorCount);
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        const errorText = await error.textContent();
        console.log(`Error ${i}: ${errorText}`);
      }
    }
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for main content
    const main = page.locator('main');
    console.log('Main content present:', await main.count());
    
    // This test should always pass - it's just for debugging
    expect(true).toBe(true);
  });
});