// Test script to verify login functionality
import puppeteer from 'puppeteer';

async function testLogin() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173/');
    
    // Wait for the page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('Filling login form...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error message
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're redirected to dashboard
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard');
      
      // Test navigation to customers page
      console.log('Testing navigation to customers page...');
      await page.goto('http://localhost:5173/customers');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if customers page loads without infinite loading
      const customersPageLoaded = await page.evaluate(() => {
        const loadingElements = document.querySelectorAll('[data-testid="loading"], .animate-spin');
        return loadingElements.length === 0;
      });
      
      if (customersPageLoaded) {
        console.log('✅ Customers page loaded successfully');
      } else {
        console.log('❌ Customers page still showing loading state');
      }
      
    } else {
      // Check for error messages
      const errorElement = await page.$('.alert-destructive, [role="alert"]');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log('❌ Login failed with error:', errorText);
      } else {
        console.log('❌ Login failed - no redirect to dashboard');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin();