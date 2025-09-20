import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
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
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    console.log('Screenshot saved as after-login.png');
    
    // Log the page content
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('Page contains navigation:', bodyHTML.includes('Customers'));
    console.log('Page contains sidebar:', bodyHTML.includes('nav'));
    
    // Try to find any link with "Customers" text
    const customersLinks = await page.$$eval('a', links => 
      links.filter(link => link.textContent.includes('Customers')).map(link => ({
        href: link.href,
        text: link.textContent,
        visible: link.offsetParent !== null
      }))
    );
    console.log('Found Customers links:', customersLinks);
    
    // Wait for user to inspect
    console.log('Keeping browser open for 30 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();