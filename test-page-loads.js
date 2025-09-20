import { chromium } from 'playwright';

async function testPageLoads() {
  console.log('🔍 Testing all pages for runtime errors...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Collect console errors
  const consoleErrors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`${msg.location().url}: ${msg.text()}`);
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
    
    // Test all main pages
    const pages = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Customers', url: '/customers' },
      { name: 'Leads', url: '/leads' },
      { name: 'Deals', url: '/deals' },
      { name: 'Proposals', url: '/proposals' },
      { name: 'Invoices', url: '/invoices' },
      { name: 'Settings', url: '/settings' }
    ];
    
    for (const testPage of pages) {
      console.log(`📄 Testing ${testPage.name} page...`);
      
      const errorsBefore = consoleErrors.length;
      const networkErrorsBefore = networkErrors.length;
      
      await page.goto(`http://localhost:5173${testPage.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for any async operations
      
      const newConsoleErrors = consoleErrors.slice(errorsBefore);
      const newNetworkErrors = networkErrors.slice(networkErrorsBefore);
      
      if (newConsoleErrors.length === 0 && newNetworkErrors.length === 0) {
        console.log(`✅ ${testPage.name} page loaded without errors`);
      } else {
        console.log(`⚠️ ${testPage.name} page has issues:`);
        newConsoleErrors.forEach(error => console.log(`  Console Error: ${error}`));
        newNetworkErrors.forEach(error => console.log(`  Network Error: ${error}`));
      }
    }
    
    // Summary
    console.log('\n📊 Page Load Test Summary:');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log(`Total Network Errors: ${networkErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors Found:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (consoleErrors.length === 0 && networkErrors.length === 0) {
      console.log('\n🎉 All pages loaded successfully without errors!');
    }
    
  } catch (error) {
    console.error('❌ Error during page load testing:', error.message);
  } finally {
    await browser.close();
  }
}

testPageLoads().catch(console.error);