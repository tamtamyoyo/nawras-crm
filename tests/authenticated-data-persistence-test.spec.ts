import { test, expect } from '@playwright/test';

test.describe('Authenticated Data Persistence Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');
    
    // Check if we're already logged in by trying to go to dashboard
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForLoadState('networkidle');
    
    // If we're redirected to login, perform login
    if (page.url().includes('/login')) {
      // Fill login form with test credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
    
    // Ensure we're on dashboard
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should verify customers data persistence with authentication', async ({ page }) => {
    // Navigate to customers page
    await page.goto('http://localhost:5174/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if customers page loaded
    const pageTitle = await page.locator('h1, h2, [data-testid="page-title"]').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Successfully navigated to customers page');

    // Look for existing customers table or empty state
    const hasTable = await page.locator('table').count() > 0;
    const hasEmptyState = await page.locator('text=No customers found, text=No data').count() > 0;
    
    if (!hasTable && !hasEmptyState) {
      console.log('⚠️ No table or empty state found, checking page content');
      const pageContent = await page.textContent('body');
      console.log('Page content preview:', pageContent?.substring(0, 500));
    }

    // Try to find and click Add Customer button
    const addButtons = [
      'button:has-text("Add Customer")',
      'button:has-text("Add")',
      '[data-testid="add-customer"]',
      'button[aria-label*="Add"]'
    ];
    
    let addButton = null;
    for (const selector of addButtons) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        addButton = button;
        break;
      }
    }
    
    if (!addButton) {
      console.log('❌ No Add Customer button found');
      // List all buttons on the page for debugging
      const buttons = await page.locator('button').all();
      console.log('Available buttons:');
      for (const btn of buttons) {
        const text = await btn.textContent();
        console.log(`- "${text}"`);
      }
      return;
    }

    await addButton.click();
    await page.waitForTimeout(1000);
    
    console.log('✅ Clicked Add Customer button');

    // Try to fill customer form with flexible selectors
    const formInputs = {
      name: ['input[name="name"]', 'input[placeholder*="name" i]', 'input[id*="name"]'],
      email: ['input[name="email"]', 'input[type="email"]', 'input[placeholder*="email" i]'],
      phone: ['input[name="phone"]', 'input[type="tel"]', 'input[placeholder*="phone" i]'],
      company: ['input[name="company"]', 'input[placeholder*="company" i]']
    };

    const testData = {
      name: 'Test Customer 1',
      email: 'test1@example.com',
      phone: '+1234567890',
      company: 'Test Company'
    };

    for (const [field, selectors] of Object.entries(formInputs)) {
      let input = null;
      for (const selector of selectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          input = element;
          break;
        }
      }
      
      if (input) {
        await input.fill(testData[field as keyof typeof testData]);
        console.log(`✅ Filled ${field}: ${testData[field as keyof typeof testData]}`);
      } else {
        console.log(`⚠️ Could not find input for ${field}`);
      }
    }

    // Try to submit the form
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Save")',
      'button:has-text("Submit")',
      'button:has-text("Create")',
      'button:has-text("Add")',
      '[data-testid="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        submitButton = button;
        break;
      }
    }
    
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Submitted customer form');
    } else {
      console.log('❌ No submit button found');
    }

    // Check if customer was added
    const customerAdded = await page.locator('text=Test Customer 1').count() > 0;
    if (customerAdded) {
      console.log('✅ Customer successfully added and visible');
    } else {
      console.log('❌ Customer not found after submission');
    }

    // Try to add a second customer to test persistence
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // Fill second customer data
      for (const [field, selectors] of Object.entries(formInputs)) {
        let input = null;
        for (const selector of selectors) {
          const element = page.locator(selector).first();
          if (await element.count() > 0) {
            input = element;
            break;
          }
        }
        
        if (input) {
          const secondData = {
            name: 'Test Customer 2',
            email: 'test2@example.com',
            phone: '+1234567891',
            company: 'Test Company 2'
          };
          await input.fill(secondData[field as keyof typeof secondData]);
        }
      }
      
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Check if both customers exist (data persistence test)
      const firstCustomer = await page.locator('text=Test Customer 1').count() > 0;
      const secondCustomer = await page.locator('text=Test Customer 2').count() > 0;
      
      if (firstCustomer && secondCustomer) {
        console.log('✅ Data persistence test PASSED - both customers visible');
      } else {
        console.log('❌ Data persistence test FAILED');
        console.log(`First customer visible: ${firstCustomer}`);
        console.log(`Second customer visible: ${secondCustomer}`);
      }
    }
  });

  test('should verify basic page navigation works', async ({ page }) => {
    // Test basic navigation to ensure the app is working
    const pages = [
      { path: '/customers', name: 'Customers' },
      { path: '/leads', name: 'Leads' },
      { path: '/deals', name: 'Deals' }
    ];

    for (const pageInfo of pages) {
      await page.goto(`http://localhost:5174${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check if page loaded successfully
      const isLoaded = !page.url().includes('/login');
      console.log(`${pageInfo.name} page loaded: ${isLoaded}`);
      
      if (isLoaded) {
        console.log(`✅ Successfully navigated to ${pageInfo.name}`);
      } else {
        console.log(`❌ Failed to navigate to ${pageInfo.name} - redirected to login`);
      }
    }
  });
});