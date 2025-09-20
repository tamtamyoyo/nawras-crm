const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Opening application...');
    await page.goto('http://localhost:5173');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔐 Logging in...');
    // Fill login form
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 Navigating to customers page...');
    // Navigate to customers page
    await page.goto('http://localhost:5173/customers');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check page state multiple times
    for (let i = 0; i < 5; i++) {
      console.log(`\n⏱️  Check ${i + 1}/5:`);
      
      const pageState = await page.evaluate(() => {
        const loadingSpinner = document.querySelector('.animate-spin');
        const customerCards = document.querySelectorAll('.grid.gap-6 > div');
        const loadingTexts = Array.from(document.querySelectorAll('p')).filter(p => p.textContent.includes('Loading'));
        const errorMessages = document.querySelectorAll('[role="alert"], .text-red-500, .text-red-600');
        
        return {
          hasLoadingSpinner: !!loadingSpinner,
          customerCardsCount: customerCards.length,
          hasLoadingText: loadingTexts.length > 0,
          errorCount: errorMessages.length,
          pageTitle: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 500)
        };
      });
      
      console.log('Page state:', pageState);
      
      // Check if loading is complete
      if (!pageState.hasLoadingSpinner && !pageState.hasLoadingText) {
        console.log('✅ Loading completed!');
        break;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Check Supabase client availability
    const supabaseTest = await page.evaluate(() => {
      try {
        // Check if supabase is available in window
        if (window.supabase) {
          return { available: true, source: 'window' };
        }
        
        // Try to access via module
        return { available: false, source: 'none' };
      } catch (error) {
        return { available: false, error: error.message };
      }
    });
    
    console.log('\n🔍 Supabase client test:', supabaseTest);
    
    console.log('\n✅ Test completed. Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close the browser.');
    
    // Keep browser open
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();