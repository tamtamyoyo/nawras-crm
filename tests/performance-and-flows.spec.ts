import { test, expect } from '@playwright/test';

test.describe('Performance and User Flows Tests', () => {
  test('should measure page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Performance should be under 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Measure First Contentful Paint and other metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    console.log('Performance Metrics:', performanceMetrics);
    
    // DOM Content Loaded should be under 2 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
  });

  test('should measure API response times', async ({ page }) => {
    const apiResponses: { url: string; duration: number; status: number }[] = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('api.') || url.includes('.json')) {
        const request = response.request();
        const timing = response.timing();
        apiResponses.push({
          url,
          duration: timing.responseEnd - timing.requestStart,
          status: response.status()
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different pages to trigger API calls
    const pages = ['customers', 'deals', 'leads', 'invoices'];
    
    for (const pageName of pages) {
      const link = page.locator(`a[href*="${pageName}"], a:has-text("${pageName}" i)`);
      if (await link.count() > 0) {
        await link.first().click();
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('API Response Times:', apiResponses);
    
    // Check that API responses are reasonable (under 3 seconds)
    const slowAPIs = apiResponses.filter(api => api.duration > 3000);
    expect(slowAPIs.length).toBeLessThan(apiResponses.length * 0.2); // Less than 20% should be slow
  });

  test('should test navigation flow between pages', async ({ page }) => {
    await page.goto('/');
    
    const navigationFlow = [
      { name: 'Dashboard', selector: 'a:has-text("Dashboard"), [href*="dashboard"], [href="/"]' },
      { name: 'Customers', selector: 'a:has-text("Customers"), [href*="customers"]' },
      { name: 'Deals', selector: 'a:has-text("Deals"), [href*="deals"]' },
      { name: 'Leads', selector: 'a:has-text("Leads"), [href*="leads"]' },
      { name: 'Invoices', selector: 'a:has-text("Invoices"), [href*="invoices"]' },
      { name: 'Proposals', selector: 'a:has-text("Proposals"), [href*="proposals"]' },
      { name: 'Analytics', selector: 'a:has-text("Analytics"), [href*="analytics"]' },
      { name: 'Settings', selector: 'a:has-text("Settings"), [href*="settings"]' }
    ];
    
    const successfulNavigations: string[] = [];
    const failedNavigations: string[] = [];
    
    for (const nav of navigationFlow) {
      const link = page.locator(nav.selector);
      
      if (await link.count() > 0) {
        try {
          const currentUrl = page.url();
          await link.first().click();
          await page.waitForTimeout(1500);
          
          const newUrl = page.url();
          if (newUrl !== currentUrl) {
            successfulNavigations.push(nav.name);
            console.log(`✓ Successfully navigated to ${nav.name}`);
          } else {
            failedNavigations.push(nav.name);
          }
        } catch (error) {
          failedNavigations.push(nav.name);
          console.log(`✗ Failed to navigate to ${nav.name}: ${error}`);
        }
      }
    }
    
    console.log('Successful navigations:', successfulNavigations);
    console.log('Failed navigations:', failedNavigations);
    
    // At least 50% of navigation should work
    expect(successfulNavigations.length).toBeGreaterThan(navigationFlow.length * 0.5);
    
    await page.screenshot({ path: 'test-results/navigation-flow.png' });
  });

  test('should test form submissions and validations', async ({ page }) => {
    await page.goto('/');
    
    // Look for forms on the page
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      console.log(`Found ${formCount} form(s)`);
      
      // Test the first form
      const firstForm = forms.first();
      const inputs = firstForm.locator('input:not([type="hidden"]):not([type="submit"])');
      const submitButton = firstForm.locator('button[type="submit"], input[type="submit"], button:has-text("Submit")');
      
      const inputCount = await inputs.count();
      
      if (inputCount > 0 && await submitButton.count() > 0) {
        // Try submitting empty form to test validation
        await submitButton.first().click();
        await page.waitForTimeout(1000);
        
        // Look for validation messages
        const validationMessages = page.locator('.error, .invalid, [role="alert"], .field-error');
        const hasValidation = await validationMessages.count() > 0;
        
        console.log('Form validation detected:', hasValidation);
        
        await page.screenshot({ path: 'test-results/form-validation.png' });
      }
    }
  });

  test('should test data persistence across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Check for any input fields
    const textInputs = page.locator('input[type="text"], input[type="email"], textarea');
    
    if (await textInputs.count() > 0) {
      const testValue = 'test-persistence-value';
      await textInputs.first().fill(testValue);
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if value persisted (this might not work for all forms)
      const persistedValue = await textInputs.first().inputValue();
      
      if (persistedValue === testValue) {
        console.log('✓ Data persistence detected');
      } else {
        console.log('✗ No data persistence (expected for most forms)');
      }
    }
  });

  test('should test responsive design on different screen sizes', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Check if content is visible and not overflowing
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      
      if (bodyBox) {
        const hasHorizontalScroll = bodyBox.width > viewport.width;
        console.log(`${viewport.name} (${viewport.width}x${viewport.height}): Horizontal scroll = ${hasHorizontalScroll}`);
        
        // Take screenshot for each viewport
        await page.screenshot({ path: `test-results/responsive-${viewport.name.toLowerCase()}.png` });
      }
    }
  });

  test('should test search and filtering capabilities', async ({ page }) => {
    await page.goto('/');
    
    // Look for search inputs
    const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i], .search-input');
    
    if (await searchInputs.count() > 0) {
      console.log('✓ Search functionality found');
      
      const searchInput = searchInputs.first();
      await searchInput.fill('test search query');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
      // Check if search results or filtered content appears
      const searchResults = page.locator('.search-results, .filtered-results, .no-results');
      const hasSearchResults = await searchResults.count() > 0;
      
      console.log('Search results detected:', hasSearchResults);
      
      await page.screenshot({ path: 'test-results/search-results.png' });
    }
    
    // Look for filter dropdowns or buttons
    const filterElements = page.locator('select[name*="filter"], .filter-dropdown, button:has-text("Filter")');
    
    if (await filterElements.count() > 0) {
      console.log('✓ Filter functionality found');
      
      const firstFilter = filterElements.first();
      
      if (await firstFilter.locator('option').count() > 1) {
        // It's a select dropdown
        await firstFilter.selectOption({ index: 1 });
      } else {
        // It's a button or other element
        await firstFilter.click();
      }
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/filter-functionality.png' });
    }
  });

  test('should measure memory usage and performance', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory);
      
      // Navigate through several pages to test memory usage
      const pages = ['customers', 'deals', 'leads', 'invoices'];
      
      for (const pageName of pages) {
        const link = page.locator(`a[href*="${pageName}"], a:has-text("${pageName}" i)`);
        if (await link.count() > 0) {
          await link.first().click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (finalMemory) {
        console.log('Final memory usage:', finalMemory);
        
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        console.log('Memory increase:', memoryIncrease, 'bytes');
        
        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    }
  });
});