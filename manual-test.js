import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173/');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Looking for login form...');
    
    // Check if we're already on login page or need to navigate
    const emailInput = await page.$('input[type="email"]');
    if (!emailInput) {
      console.log('No email input found, checking page content...');
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('Current URL:', page.url());
    }
    
    // Try to find and fill login form
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'test@example.com');
    
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.type('input[type="password"]', 'TestPassword123!');
    
    console.log('Clicking sign in button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('After login - Current URL:', page.url());
    
    // Navigate to customers page
    console.log('Navigating to customers page...');
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Navigate directly to customers page
    await page.goto('http://localhost:5173/customers', { waitUntil: 'networkidle0' });
    
    // Wait and check loading state
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Checking customers page state...');
    const loadingElement = await page.$('.animate-spin');
    if (loadingElement) {
      console.log('ISSUE: Loading spinner still visible on customers page');
      
      // Wait longer to see if it resolves
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const stillLoading = await page.$('.animate-spin');
      if (stillLoading) {
        console.log('CONFIRMED: Infinite loading issue on customers page');
      } else {
        console.log('Loading resolved after waiting');
      }
    } else {
      console.log('No loading spinner found - page loaded successfully');
    }
    
    // Check for customer data
    const customerCards = await page.$$('.bg-white.rounded-lg.shadow');
    console.log(`Found ${customerCards.length} customer cards`);
    
    // Keep browser open for manual inspection
    console.log('Browser will stay open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();