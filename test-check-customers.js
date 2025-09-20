import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to customers
    await page.click('[data-testid="desktop-nav-customers"]');
    await page.waitForURL('**/customers');
    await page.waitForTimeout(2000);
    
    // Check customers
    const customerCards = await page.$$('[data-testid="customer-card"]');
    console.log(`Found ${customerCards.length} customers`);
    
    // Navigate to deals and check customer dropdown
    await page.click('[data-testid="desktop-nav-deals"]');
    await page.waitForURL('**/deals');
    await page.waitForTimeout(2000);
    
    // Open add deal modal
    await page.click('[data-testid="add-deal-button"]');
    await page.waitForSelector('[data-testid="deal-customer-select"]', { visible: true });
    
    // Check customer options
    const options = await page.$$eval('[data-testid="deal-customer-select"] option', options => 
      options.map(option => ({ value: option.value, text: option.textContent }))
    );
    
    console.log('Customer options in dropdown:', options);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();