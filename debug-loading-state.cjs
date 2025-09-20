const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  
  try {
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Login
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for login
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Navigating to customers page...');
    await page.goto('http://localhost:5173/customers', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Add debug script to check states
    await page.evaluate(() => {
      // Add debug logging to window
      window.debugAuth = () => {
        const authContext = window.React?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current;
        console.log('=== DEBUG AUTH STATE ===');
        
        // Try to access auth state from localStorage
        const authData = localStorage.getItem('supabase.auth.token');
        console.log('Auth token in localStorage:', !!authData);
        
        // Check if there are any React components with loading state
        const spinners = document.querySelectorAll('.animate-spin');
        console.log('Loading spinners found:', spinners.length);
        
        // Check for any error messages
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
        console.log('Error elements found:', errorElements.length);
        
        return {
          hasAuthToken: !!authData,
          spinnersCount: spinners.length,
          errorsCount: errorElements.length
        };
      };
      
      // Run debug immediately
      window.debugAuth();
    });
    
    // Wait and check state multiple times
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const debugInfo = await page.evaluate(() => window.debugAuth());
      console.log(`Check ${i + 1}:`, debugInfo);
      
      const hasSpinner = await page.$('.animate-spin') !== null;
      if (!hasSpinner) {
        console.log('SUCCESS: Loading spinner disappeared!');
        break;
      }
    }
    
    console.log('Keeping browser open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();