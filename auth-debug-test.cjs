const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console logs
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });

  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('customers')) {
      console.log('REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('supabase') || response.url().includes('customers')) {
      console.log('RESPONSE:', response.status(), response.url());
    }
  });

  try {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]');

    // Login
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForNavigation();
    console.log('Current URL after login:', page.url());

    // Wait a bit for auth to settle
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check auth state in browser
    const authState = await page.evaluate(() => {
      return {
        hasUser: window.localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token') !== null,
        userAgent: navigator.userAgent
      };
    });
    console.log('Auth state:', authState);

    // Navigate to customers page
    await page.goto('http://localhost:5173/customers');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if loading spinner is visible and check network activity
    const pageState = await page.evaluate(() => {
      const spinner = document.querySelector('.animate-spin');
      const customerCards = document.querySelectorAll('[data-testid="customer-card"], .customer-card, [class*="customer"]');
      return {
        hasSpinner: spinner !== null,
        spinnerVisible: spinner ? spinner.offsetParent !== null : false,
        customerCardsCount: customerCards.length,
        pageContent: document.body.innerText.substring(0, 500)
      };
    });

    console.log('Page state:', pageState);

    // Wait longer to see if anything changes
    console.log('Waiting 10 seconds to observe network activity...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const finalState = await page.evaluate(() => {
      const spinner = document.querySelector('.animate-spin');
      return {
        hasSpinner: spinner !== null,
        spinnerVisible: spinner ? spinner.offsetParent !== null : false
      };
    });

    console.log('Final state:', finalState);

  } catch (error) {
    console.error('Test failed:', error);
  }

  // Keep browser open for inspection
  console.log('Keeping browser open for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  await browser.close();
})();