import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen to console messages
    page.on('console', msg => {
      console.log(`BROWSER LOG [${msg.type()}]:`, msg.text());
    });
    
    // Listen to page errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    // Listen to failed requests
    page.on('requestfailed', request => {
      console.log('FAILED REQUEST:', request.url(), request.failure().errorText);
    });
    
    // Navigate to the application
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Fill login form
    console.log('Looking for login form...');
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    // Click sign in
    console.log('Clicking sign in button...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('After login - Current URL:', page.url());
    
    // Navigate to customers page
    console.log('Navigating to customers page...');
    await page.goto('http://localhost:5173/customers', { waitUntil: 'networkidle0' });
    
    // Wait and observe console logs
    console.log('Waiting 10 seconds to observe console logs...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Test completed. Check console logs above for errors.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();