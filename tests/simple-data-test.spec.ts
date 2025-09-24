import { test, expect } from '@playwright/test';

test.describe('Simple Data Persistence Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to customers page
    await page.goto('http://localhost:5174/customers');
    await page.waitForTimeout(3000);
  });

  test('should test customer data persistence', async ({ page }) => {
    console.log('🔍 Starting customer data persistence test');
    
    // Check current page URL
    console.log('Current URL:', page.url());
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/customers-page.png', fullPage: true });
    
    // Check if we're on the right page
    const pageContent = await page.textContent('body');
    console.log('Page content preview:', pageContent?.substring(0, 300));
    
    // Look for any customer-related elements
    const customerElements = await page.locator('*').filter({ hasText: /customer/i }).count();
    console.log(`Found ${customerElements} elements containing 'customer'`);
    
    // Look for table or list elements
    const tables = await page.locator('table').count();
    const lists = await page.locator('ul, ol').count();
    console.log(`Found ${tables} tables and ${lists} lists`);
    
    // Look for buttons
    const buttons = await page.locator('button').all();
    console.log('Available buttons:');
    for (const btn of buttons) {
      const text = await btn.textContent();
      const isVisible = await btn.isVisible();
      console.log(`- "${text}" (visible: ${isVisible})`);
    }
    
    // Try to find Add button with various selectors
    const addSelectors = [
      'button:has-text("Add")',
      'button:has-text("New")',
      'button:has-text("Create")',
      '[data-testid*="add"]',
      'button[aria-label*="Add"]',
      '.btn:has-text("Add")',
      'a:has-text("Add")'
    ];
    
    let addButton = null;
    for (const selector of addSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        addButton = button;
        console.log(`✅ Found Add button with selector: ${selector}`);
        break;
      }
    }
    
    if (!addButton) {
      console.log('❌ No Add button found, checking if we need to login');
      
      // Check if we're redirected to login
      if (page.url().includes('/login')) {
        console.log('🔐 Redirected to login, attempting to login');
        
        // Try to login
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Navigate back to customers
        await page.goto('http://localhost:5174/customers');
        await page.waitForTimeout(2000);
        
        // Try to find Add button again
        for (const selector of addSelectors) {
          const button = page.locator(selector).first();
          if (await button.count() > 0 && await button.isVisible()) {
            addButton = button;
            console.log(`✅ Found Add button after login: ${selector}`);
            break;
          }
        }
      }
    }
    
    if (addButton) {
      console.log('🎯 Attempting to click Add button');
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // Look for form inputs
      const inputs = await page.locator('input').all();
      console.log(`Found ${inputs.length} input fields`);
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        const isVisible = await input.isVisible();
        console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}, visible=${isVisible}`);
      }
      
      // Try to fill a simple form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Customer');
        console.log('✅ Filled name field');
      }
      
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
        console.log('✅ Filled email field');
      }
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Submitted form');
        
        // Check if customer was added
        const customerAdded = await page.locator('text=Test Customer').count() > 0;
        console.log(`Customer added: ${customerAdded}`);
        
        if (customerAdded) {
          console.log('🎉 SUCCESS: Customer was successfully added!');
        } else {
          console.log('❌ FAILED: Customer was not found after submission');
        }
      } else {
        console.log('❌ No submit button found');
      }
    } else {
      console.log('❌ Could not find Add button even after login attempt');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/customers-final.png', fullPage: true });
    
    console.log('✅ Test completed');
  });
});