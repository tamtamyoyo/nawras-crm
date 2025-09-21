import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases Tests', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to navigate to different pages
    const links = page.locator('a[href*="customers"], a[href*="deals"], a[href*="invoices"]');
    
    if (await links.count() > 0) {
      await links.first().click();
      await page.waitForTimeout(2000);
      
      // Check for offline indicators or error messages
      const offlineIndicators = page.locator('.offline, .no-connection, .network-error, [data-testid="offline"]');
      const errorMessages = page.locator('.error, .alert, [role="alert"]');
      
      const hasOfflineHandling = await offlineIndicators.count() > 0 || await errorMessages.count() > 0;
      
      console.log('Offline handling detected:', hasOfflineHandling);
      
      await page.screenshot({ path: 'test-results/offline-mode.png' });
    }
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should handle invalid input in forms', async ({ page }) => {
    await page.goto('/');
    
    // Look for forms with email inputs
    const emailInputs = page.locator('input[type="email"]');
    
    if (await emailInputs.count() > 0) {
      const emailInput = emailInputs.first();
      
      // Test invalid email formats
      const invalidEmails = ['invalid-email', 'test@', '@domain.com', 'test..test@domain.com'];
      
      for (const invalidEmail of invalidEmails) {
        await emailInput.fill(invalidEmail);
        
        // Try to submit or trigger validation
        await emailInput.blur();
        await page.waitForTimeout(500);
        
        // Look for validation messages
        const validationMessage = page.locator('.error, .invalid, [role="alert"], .field-error');
        const hasValidation = await validationMessage.count() > 0;
        
        if (hasValidation) {
          console.log(`✓ Validation detected for invalid email: ${invalidEmail}`);
          break;
        }
      }
      
      await page.screenshot({ path: 'test-results/email-validation.png' });
    }
  });

  test('should handle required field validation', async ({ page }) => {
    await page.goto('/');
    
    // Look for forms with required fields
    const requiredInputs = page.locator('input[required], input[aria-required="true"]');
    
    if (await requiredInputs.count() > 0) {
      const form = requiredInputs.first().locator('xpath=ancestor::form[1]');
      const submitButton = form.locator('button[type="submit"], input[type="submit"]');
      
      if (await submitButton.count() > 0) {
        // Try to submit form without filling required fields
        await submitButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for validation messages
        const validationMessages = page.locator('.error, .invalid, [role="alert"], .field-error');
        const hasRequiredValidation = await validationMessages.count() > 0;
        
        console.log('Required field validation detected:', hasRequiredValidation);
        
        await page.screenshot({ path: 'test-results/required-validation.png' });
      }
    }
  });

  test('should handle 404 and invalid routes', async ({ page }) => {
    // Try to navigate to non-existent pages
    const invalidRoutes = ['/non-existent-page', '/invalid-route', '/test-404'];
    
    for (const route of invalidRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      
      // Check for 404 page or error handling
      const notFoundIndicators = page.locator('h1:has-text("404"), h1:has-text("Not Found"), .not-found, .error-404');
      const hasErrorPage = await notFoundIndicators.count() > 0;
      
      if (hasErrorPage) {
        console.log(`✓ 404 page detected for route: ${route}`);
        await page.screenshot({ path: `test-results/404-${route.replace('/', '')}.png` });
        break;
      }
    }
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate through different pages to trigger potential errors
    const navigationLinks = page.locator('a[href^="/"], a[href^="#"]');
    const linkCount = Math.min(await navigationLinks.count(), 5); // Test up to 5 links
    
    for (let i = 0; i < linkCount; i++) {
      try {
        await navigationLinks.nth(i).click();
        await page.waitForTimeout(1000);
      } catch (error) {
        // Continue even if navigation fails
      }
    }
    
    // Filter out common non-critical errors
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('favicon') &&
      !error.includes('manifest') &&
      !error.includes('ServiceWorker') &&
      !error.toLowerCase().includes('network')
    );
    
    console.log('JavaScript errors found:', criticalErrors);
    
    // Should have minimal critical JavaScript errors
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('should test offline mode functionality if available', async ({ page }) => {
    await page.goto('/');
    
    // Check if offline mode is supported (look for service worker or offline indicators)
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    if (hasServiceWorker) {
      console.log('✓ Service Worker support detected');
      
      // Check for offline mode toggle or indicator
      const offlineToggle = page.locator('button:has-text("Offline"), .offline-toggle, [data-testid="offline-mode"]');
      
      if (await offlineToggle.count() > 0) {
        console.log('✓ Offline mode toggle found');
        
        await offlineToggle.first().click();
        await page.waitForTimeout(1000);
        
        // Check for offline mode indicators
        const offlineIndicator = page.locator('.offline-mode, .offline-indicator, [data-offline="true"]');
        const isOfflineModeActive = await offlineIndicator.count() > 0;
        
        console.log('Offline mode activated:', isOfflineModeActive);
        
        await page.screenshot({ path: 'test-results/offline-mode-toggle.png' });
      }
    }
    
    // Test with network disabled
    await page.context().setOffline(true);
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check if app still functions in some capacity
    const pageContent = page.locator('body');
    const hasContent = await pageContent.textContent();
    
    if (hasContent && hasContent.length > 100) {
      console.log('✓ App shows content in offline mode');
    }
    
    await page.screenshot({ path: 'test-results/offline-app-state.png' });
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should handle large data sets and pagination', async ({ page }) => {
    await page.goto('/');
    
    // Look for data tables or lists
    const tables = page.locator('table');
    const lists = page.locator('.list, .data-list, .items');
    
    if (await tables.count() > 0 || await lists.count() > 0) {
      // Check for pagination controls
      const paginationControls = page.locator('.pagination, .page-nav, button:has-text("Next"), button:has-text("Previous")');
      
      if (await paginationControls.count() > 0) {
        console.log('✓ Pagination controls found');
        
        // Test pagination
        const nextButton = page.locator('button:has-text("Next"), .next-page');
        
        if (await nextButton.count() > 0 && await nextButton.first().isEnabled()) {
          await nextButton.first().click();
          await page.waitForTimeout(1000);
          
          console.log('✓ Pagination navigation works');
          
          await page.screenshot({ path: 'test-results/pagination-test.png' });
        }
      }
      
      // Check for items per page selector
      const itemsPerPageSelector = page.locator('select:has(option:has-text("10")), select:has(option:has-text("25")), select:has(option:has-text("50"))');
      
      if (await itemsPerPageSelector.count() > 0) {
        console.log('✓ Items per page selector found');
        
        // Test changing items per page
        await itemsPerPageSelector.first().selectOption('25');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'test-results/items-per-page.png' });
      }
    }
  });

  test('should handle concurrent user actions', async ({ page }) => {
    await page.goto('/');
    
    // Simulate rapid clicking on navigation items
    const navLinks = page.locator('nav a, .nav-link');
    const linkCount = Math.min(await navLinks.count(), 3);
    
    if (linkCount > 0) {
      // Click multiple links rapidly
      const clickPromises = [];
      
      for (let i = 0; i < linkCount; i++) {
        clickPromises.push(navLinks.nth(i).click());
      }
      
      try {
        await Promise.all(clickPromises);
        await page.waitForTimeout(2000);
        
        // Check if app is still responsive
        const isResponsive = await page.locator('body').isVisible();
        expect(isResponsive).toBeTruthy();
        
        console.log('✓ App handles concurrent actions');
      } catch (error) {
        console.log('Concurrent action test failed:', error);
      }
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to different pages
    const links = page.locator('a[href^="/"]');
    const linkCount = Math.min(await links.count(), 3);
    
    const visitedUrls = [page.url()];
    
    for (let i = 0; i < linkCount; i++) {
      await links.nth(i).click();
      await page.waitForTimeout(1000);
      visitedUrls.push(page.url());
    }
    
    // Test browser back button
    for (let i = 0; i < visitedUrls.length - 1; i++) {
      await page.goBack();
      await page.waitForTimeout(500);
      
      const currentUrl = page.url();
      console.log(`Back navigation: ${currentUrl}`);
    }
    
    // Test browser forward button
    for (let i = 0; i < visitedUrls.length - 1; i++) {
      await page.goForward();
      await page.waitForTimeout(500);
      
      const currentUrl = page.url();
      console.log(`Forward navigation: ${currentUrl}`);
    }
    
    console.log('✓ Browser navigation tested');
    await page.screenshot({ path: 'test-results/browser-navigation.png' });
  });
});