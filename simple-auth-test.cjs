const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Fill login form
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    console.log('Clicking sign in button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('SUCCESS: Login successful, redirected to dashboard');
      
      // Test customers page
      console.log('Navigating to customers page...');
      await page.goto('http://localhost:5173/customers', { waitUntil: 'networkidle0', timeout: 10000 });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const hasSpinner = await page.$('.animate-spin') !== null;
      const customerCards = await page.$$('.bg-white.rounded-lg.shadow');
      
      console.log('Customers page state:');
      console.log('- Loading spinner visible:', hasSpinner);
      console.log('- Customer cards found:', customerCards.length);
      
      if (!hasSpinner) {
        console.log('SUCCESS: Customers page loaded without infinite loading!');
      } else {
        console.log('ISSUE: Customers page still showing loading spinner');
      }
    } else {
      console.log('ISSUE: Login failed or not redirected properly');
    }
    
    console.log('Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();