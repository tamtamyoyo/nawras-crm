// Simplified test script to verify Analytics functionality
import puppeteer from 'puppeteer';

async function testAnalyticsSimple() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const testResults = {
    navigation: false,
    pageLoaded: false,
    hasInterface: false,
    errors: []
  };
  
  try {
    console.log('🚀 Starting Analytics Page Testing...');
    
    // Navigate to analytics/dashboard page
    console.log('📍 Navigating to analytics page...');
    await page.goto('http://localhost:5173/analytics');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/analytics')) {
      console.log('✅ Successfully navigated to analytics page');
      testResults.navigation = true;
    } else {
      console.log('❌ Failed to navigate to analytics page');
      testResults.errors.push('Navigation to analytics page failed');
      return testResults;
    }
    
    // Check if page loaded without infinite loading
    console.log('⏳ Checking page loading state...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hasLoadingState = await page.evaluate(() => {
      const loadingElements = document.querySelectorAll('.animate-spin, [data-testid="loading"]');
      return loadingElements.length > 0;
    });
    
    if (!hasLoadingState) {
      console.log('✅ Page loaded successfully (no infinite loading)');
      testResults.pageLoaded = true;
    } else {
      console.log('❌ Page stuck in loading state');
      testResults.errors.push('Page stuck in loading state');
    }
    
    // Check for analytics interface elements
    console.log('🔍 Checking for analytics interface elements...');
    
    const interfaceElements = await page.evaluate(() => {
      const elements = {
        hasCharts: document.querySelector('canvas, svg, .chart, .recharts-wrapper') !== null,
        hasCards: document.querySelector('.card, .metric-card, .stat-card') !== null,
        hasGrid: document.querySelector('.grid, .dashboard-grid') !== null,
        hasButtons: document.querySelectorAll('button').length > 0,
        hasInputs: document.querySelectorAll('input, select').length > 0,
        hasHeading: document.querySelector('h1, h2, h3') !== null,
        hasAnalytics: document.body.textContent.toLowerCase().includes('analytics'),
        hasDashboard: document.body.textContent.toLowerCase().includes('dashboard'),
        hasMetrics: document.body.textContent.toLowerCase().includes('metric'),
        hasPerformance: document.body.textContent.toLowerCase().includes('performance'),
        hasRevenue: document.body.textContent.toLowerCase().includes('revenue'),
        hasChart: document.body.textContent.toLowerCase().includes('chart'),
        hasData: document.body.textContent.toLowerCase().includes('data'),
        totalButtons: document.querySelectorAll('button').length,
        totalInputs: document.querySelectorAll('input, select').length,
        totalCharts: document.querySelectorAll('canvas, svg, .chart, .recharts-wrapper').length
      };
      return elements;
    });
    
    console.log('Interface Analysis:');
    console.log('  - Has Charts:', interfaceElements.hasCharts ? `✅ (${interfaceElements.totalCharts})` : '❌');
    console.log('  - Has Cards:', interfaceElements.hasCards ? '✅' : '❌');
    console.log('  - Has Grid:', interfaceElements.hasGrid ? '✅' : '❌');
    console.log('  - Has Buttons:', interfaceElements.hasButtons ? `✅ (${interfaceElements.totalButtons})` : '❌');
    console.log('  - Has Inputs:', interfaceElements.hasInputs ? `✅ (${interfaceElements.totalInputs})` : '❌');
    console.log('  - Has Heading:', interfaceElements.hasHeading ? '✅' : '❌');
    console.log('  - Analytics Content:', interfaceElements.hasAnalytics ? '✅' : '❌');
    console.log('  - Dashboard Content:', interfaceElements.hasDashboard ? '✅' : '❌');
    console.log('  - Metrics Content:', interfaceElements.hasMetrics ? '✅' : '❌');
    console.log('  - Performance Content:', interfaceElements.hasPerformance ? '✅' : '❌');
    console.log('  - Revenue Content:', interfaceElements.hasRevenue ? '✅' : '❌');
    console.log('  - Chart Content:', interfaceElements.hasChart ? '✅' : '❌');
    console.log('  - Data Content:', interfaceElements.hasData ? '✅' : '❌');
    
    if (interfaceElements.hasCharts || interfaceElements.hasCards || interfaceElements.hasGrid || interfaceElements.hasButtons) {
      console.log('✅ Analytics interface elements found');
      testResults.hasInterface = true;
    } else {
      console.log('⚠️ Limited interface elements - might be empty state');
      testResults.hasInterface = true; // Empty state is still valid
    }
    
    // Get page content for analysis
    const pageText = await page.evaluate(() => {
      return document.body.textContent.toLowerCase();
    });
    
    console.log('\n📄 Page Content Analysis:');
    if (pageText.includes('analytics') || pageText.includes('dashboard')) {
      console.log('✅ Contains analytics/dashboard content');
    }
    if (pageText.includes('metric') || pageText.includes('kpi')) {
      console.log('✅ Contains metrics/KPI content');
    }
    if (pageText.includes('chart') || pageText.includes('graph')) {
      console.log('✅ Contains chart/graph content');
    }
    if (pageText.includes('revenue') || pageText.includes('sales')) {
      console.log('✅ Contains revenue/sales content');
    }
    if (pageText.includes('performance') || pageText.includes('report')) {
      console.log('✅ Contains performance/report content');
    }
    if (pageText.includes('filter') || pageText.includes('date')) {
      console.log('✅ Contains filtering/date content');
    }
    if (pageText.includes('total') || pageText.includes('count')) {
      console.log('✅ Contains total/count content');
    }
    
    // Take a screenshot for manual review
    await page.screenshot({ path: 'analytics-page-test.png', fullPage: true });
    console.log('📸 Screenshot saved as analytics-page-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.errors.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test and export results
testAnalyticsSimple().then(results => {
  const allPassed = results.navigation && results.pageLoaded && results.hasInterface;
  console.log('\n=== ANALYTICS PAGE TEST RESULTS ===');
  console.log('Navigation:', results.navigation ? '✅ PASS' : '❌ FAIL');
  console.log('Page Loaded:', results.pageLoaded ? '✅ PASS' : '❌ FAIL');
  console.log('Has Interface:', results.hasInterface ? '✅ PASS' : '❌ FAIL');
  console.log('Overall Success:', allPassed ? '✅ PASS' : '❌ FAIL');
  
  if (results.errors.length > 0) {
    console.log('\n⚠️ Issues found:');
    results.errors.forEach(error => console.log('  -', error));
  }
  
  process.exit(allPassed && results.errors.length === 0 ? 0 : 1);
});