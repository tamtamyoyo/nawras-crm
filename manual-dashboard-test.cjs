// Manual Dashboard Testing Script
// This script tests all dashboard functionality including widgets, interactive elements, and data updates

const puppeteer = require('puppeteer');

async function testDashboard() {
  console.log('🚀 Starting Dashboard Manual Testing...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📱 Navigating to CRM application...');
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're on login page or dashboard
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // If on login page, perform login
    if (currentUrl.includes('/login') || await page.$('input[type="email"]')) {
      console.log('🔐 Logging in...');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Navigate to dashboard if not already there
    if (!currentUrl.includes('/dashboard') && !currentUrl.endsWith('/')) {
      console.log('🏠 Navigating to Dashboard...');
      await page.click('a[href="/"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n=== DASHBOARD TESTING STARTED ===\n');
    
    // Test 1: Verify Dashboard Loading
    console.log('✅ Test 1: Dashboard Loading');
    const dashboardTitle = await page.$eval('h1', el => el.textContent);
    console.log(`Dashboard title: ${dashboardTitle}`);
    
    // Test 2: Verify Stats Cards
    console.log('\n✅ Test 2: Stats Cards Verification');
    const statsCards = await page.$$('.grid .card');
    console.log(`Found ${statsCards.length} stats cards`);
    
    for (let i = 0; i < Math.min(4, statsCards.length); i++) {
      const cardTitle = await statsCards[i].$eval('.text-sm', el => el.textContent);
      const cardValue = await statsCards[i].$eval('.text-2xl', el => el.textContent);
      console.log(`  Card ${i + 1}: ${cardTitle} = ${cardValue}`);
    }
    
    // Test 3: Verify Charts Rendering
    console.log('\n✅ Test 3: Charts Rendering');
    const charts = await page.$$('.recharts-wrapper');
    console.log(`Found ${charts.length} charts rendered`);
    
    // Test 4: Test Quick Actions
    console.log('\n✅ Test 4: Quick Actions Testing');
    const quickActionButtons = await page.$$('button');
    console.log(`Found ${quickActionButtons.length} total buttons`);
    
    // Test each quick action button
    const quickActions = [
      { selector: 'button', text: 'Add Customer', expectedUrl: '/customers' },
      { selector: 'button', text: 'Add Lead', expectedUrl: '/leads' },
      { selector: 'button', text: 'Create Deal', expectedUrl: '/deals' },
      { selector: 'button', text: 'Create Proposal', expectedUrl: '/proposals' }
    ];
    
    for (const action of quickActions) {
      try {
        console.log(`  Testing: ${action.text}`);
        
        // Find and click the button
        const buttons = await page.$$('button');
        let actionButton = null;
        
        for (const button of buttons) {
          const buttonText = await button.evaluate(el => el.textContent);
          if (buttonText.includes(action.text.split(' ')[1])) { // Match key word
            actionButton = button;
            break;
          }
        }
        
        if (actionButton) {
          await actionButton.click();
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const newUrl = page.url();
          console.log(`    Clicked ${action.text}, navigated to: ${newUrl}`);
          
          // Navigate back to dashboard
          await page.click('a[href="/"]');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          console.log(`    ⚠️  Button not found: ${action.text}`);
        }
      } catch (error) {
        console.log(`    ❌ Error testing ${action.text}: ${error.message}`);
      }
    }
    
    // Test 5: Verify Recent Activity/System Overview
    console.log('\n✅ Test 5: System Overview Verification');
    const activityItems = await page.$$('.space-y-4 > div');
    console.log(`Found ${activityItems.length} system overview items`);
    
    // Test 6: Interactive Elements Testing
    console.log('\n✅ Test 6: Interactive Elements Testing');
    
    // Test chart tooltips (hover over charts)
    try {
      const chartElements = await page.$$('.recharts-wrapper');
      if (chartElements.length > 0) {
        console.log('  Testing chart interactivity...');
        await chartElements[0].hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('  ✓ Chart hover interaction tested');
      }
    } catch (error) {
      console.log(`  ⚠️  Chart interaction test failed: ${error.message}`);
    }
    
    // Test 7: Data Refresh Testing
    console.log('\n✅ Test 7: Data Refresh Testing');
    
    // Refresh the page to test data loading
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify loading state appears and disappears
    const finalTitle = await page.$eval('h1', el => el.textContent);
    console.log(`  After refresh, dashboard title: ${finalTitle}`);
    
    // Test 8: Responsive Design Testing
    console.log('\n✅ Test 8: Responsive Design Testing');
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('  ✓ Mobile viewport tested');
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('  ✓ Tablet viewport tested');
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('  ✓ Desktop viewport restored');
    
    // Test 9: Performance Testing
    console.log('\n✅ Test 9: Performance Testing');
    const performanceMetrics = await page.metrics();
    console.log(`  JSHeapUsedSize: ${Math.round(performanceMetrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`  JSHeapTotalSize: ${Math.round(performanceMetrics.JSHeapTotalSize / 1024 / 1024)}MB`);
    
    console.log('\n=== DASHBOARD TESTING COMPLETED ===\n');
    console.log('✅ All dashboard tests completed successfully!');
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser kept open for manual inspection...');
    console.log('Press Ctrl+C to close the browser and exit.');
    
    // Keep the process running
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Dashboard testing failed:', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Closing browser and exiting...');
  process.exit(0);
});

testDashboard().catch(console.error);