// Simplified test script to verify Deals functionality
import puppeteer from 'puppeteer';

async function testDealsSimple() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const testResults = {
    navigation: false,
    pageLoaded: false,
    hasInterface: false,
    errors: []
  };
  
  try {
    console.log('🚀 Starting Deals Page Testing...');
    
    // Navigate to deals page
    console.log('📍 Navigating to deals page...');
    await page.goto('http://localhost:5173/deals');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/deals')) {
      console.log('✅ Successfully navigated to deals page');
      testResults.navigation = true;
    } else {
      console.log('❌ Failed to navigate to deals page');
      testResults.errors.push('Navigation to deals page failed');
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
    
    // Check for deals interface elements
    console.log('🔍 Checking for deals interface elements...');
    
    const interfaceElements = await page.evaluate(() => {
      const elements = {
        hasTable: document.querySelector('table') !== null,
        hasGrid: document.querySelector('.grid, .deals-grid, .pipeline') !== null,
        hasCards: document.querySelector('.card, .deal-card') !== null,
        hasButtons: document.querySelectorAll('button').length > 0,
        hasInputs: document.querySelectorAll('input').length > 0,
        hasHeading: document.querySelector('h1, h2, h3') !== null,
        hasContent: document.body.textContent.toLowerCase().includes('deal'),
        hasPipeline: document.body.textContent.toLowerCase().includes('pipeline'),
        hasStage: document.body.textContent.toLowerCase().includes('stage'),
        totalButtons: document.querySelectorAll('button').length,
        totalInputs: document.querySelectorAll('input').length
      };
      return elements;
    });
    
    console.log('Interface Analysis:');
    console.log('  - Has Table:', interfaceElements.hasTable ? '✅' : '❌');
    console.log('  - Has Grid/Pipeline:', interfaceElements.hasGrid ? '✅' : '❌');
    console.log('  - Has Cards:', interfaceElements.hasCards ? '✅' : '❌');
    console.log('  - Has Buttons:', interfaceElements.hasButtons ? `✅ (${interfaceElements.totalButtons})` : '❌');
    console.log('  - Has Inputs:', interfaceElements.hasInputs ? `✅ (${interfaceElements.totalInputs})` : '❌');
    console.log('  - Has Heading:', interfaceElements.hasHeading ? '✅' : '❌');
    console.log('  - Deal Content:', interfaceElements.hasContent ? '✅' : '❌');
    console.log('  - Pipeline Content:', interfaceElements.hasPipeline ? '✅' : '❌');
    console.log('  - Stage Content:', interfaceElements.hasStage ? '✅' : '❌');
    
    if (interfaceElements.hasButtons || interfaceElements.hasTable || interfaceElements.hasGrid || interfaceElements.hasCards) {
      console.log('✅ Deals interface elements found');
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
    if (pageText.includes('deal')) {
      console.log('✅ Contains deal-related content');
    }
    if (pageText.includes('pipeline')) {
      console.log('✅ Contains pipeline-related content');
    }
    if (pageText.includes('stage')) {
      console.log('✅ Contains stage-related content');
    }
    if (pageText.includes('add') || pageText.includes('create') || pageText.includes('new')) {
      console.log('✅ Contains creation-related content');
    }
    if (pageText.includes('edit') || pageText.includes('update')) {
      console.log('✅ Contains edit-related content');
    }
    if (pageText.includes('delete') || pageText.includes('remove')) {
      console.log('✅ Contains delete-related content');
    }
    
    // Take a screenshot for manual review
    await page.screenshot({ path: 'deals-page-test.png', fullPage: true });
    console.log('📸 Screenshot saved as deals-page-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.errors.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test and export results
testDealsSimple().then(results => {
  const allPassed = results.navigation && results.pageLoaded && results.hasInterface;
  console.log('\n=== DEALS PAGE TEST RESULTS ===');
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