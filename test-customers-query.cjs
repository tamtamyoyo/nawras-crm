const puppeteer = require('puppeteer');

async function testCustomersInBrowser() {
  console.log('Testing customers loading in browser...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warn') {
      console.log(`Browser ${type}:`, msg.text());
    }
  });
  
  // Listen to network requests
  page.on('response', response => {
    const url = response.url();
    if (url.includes('supabase') || url.includes('customers')) {
      console.log(`Network: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    await page.goto('http://localhost:5173/');
    
    // Login
    console.log('Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
     await new Promise(resolve => setTimeout(resolve, 3000));
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed or no redirect');
      return;
    }
    
    // Navigate to customers
     console.log('Navigating to customers page...');
     await page.goto('http://localhost:5173/customers');
     await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check loading state and data
    const pageState = await page.evaluate(() => {
      const loadingSpinner = document.querySelector('.animate-spin');
      const customerCards = document.querySelectorAll('.grid > .hover\\:shadow-md, [data-testid="customer-card"]');
      const loadingText = document.querySelector('p')?.textContent;
      const errorElements = document.querySelectorAll('[class*="error"], .text-red');
      
      return {
        hasLoadingSpinner: !!loadingSpinner,
        customerCardsCount: customerCards.length,
        loadingText: loadingText,
        errorCount: errorElements.length,
        pageContent: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('Page state:', pageState);
    
    // Test the Supabase connection directly in browser
    const supabaseTest = await page.evaluate(async () => {
      try {
        // Access the global supabase client if available
        if (window.supabase) {
          const { data, error } = await window.supabase
            .from('customers')
            .select('*')
            .limit(1);
          
          return { success: true, error: error, dataCount: data?.length || 0 };
        } else {
          return { success: false, error: 'Supabase client not available' };
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
    });
    
    console.log('Supabase test result:', supabaseTest);
    
    // Keep browser open for inspection
     console.log('Keeping browser open for 20 seconds for manual inspection...');
     await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Browser test error:', error);
  } finally {
    await browser.close();
  }
}

testCustomersInBrowser().catch(console.error);