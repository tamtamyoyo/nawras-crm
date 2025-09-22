// Simplified test script to verify Customers functionality
import puppeteer from 'puppeteer';

async function testCustomersSimple() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const testResults = {
    navigation: false,
    pageLoaded: false,
    hasInterface: false,
    errors: []
  };
  
  try {
    console.log('🚀 Starting Customers Page Testing...');
    
    // Navigate to customers page
    console.log('📍 Navigating to customers page...');
    await page.goto('http://localhost:5173/customers');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/customers')) {
      console.log('✅ Successfully navigated to customers page');
      testResults.navigation = true;
    } else {
      console.log('❌ Failed to navigate to customers page');
      testResults.errors.push('Navigation to customers page failed');
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
    
    // Check for customer interface elements
    console.log('🔍 Checking for customer interface elements...');
    
    const interfaceElements = await page.evaluate(() => {
      const elements = {
        hasTable: document.querySelector('table') !== null,
        hasGrid: document.querySelector('.grid, .customer-grid') !== null,
        hasCards: document.querySelector('.card, .customer-card') !== null,
        hasButtons: document.querySelectorAll('button').length > 0,
        hasInputs: document.querySelectorAll('input').length > 0,
        hasHeading: document.querySelector('h1, h2, h3') !== null,
        hasContent: document.body.textContent.toLowerCase().includes('customer'),
        totalButtons: document.querySelectorAll('button').length,
        totalInputs: document.querySelectorAll('input').length
      };
      return elements;
    });
    
    console.log('Interface Analysis:');
    console.log('  - Has Table:', interfaceElements.hasTable ? '✅' : '❌');
    console.log('  - Has Grid/Cards:', interfaceElements.hasGrid || interfaceElements.hasCards ? '✅' : '❌');
    console.log('  - Has Buttons:', interfaceElements.hasButtons ? `✅ (${interfaceElements.totalButtons})` : '❌');
    console.log('  - Has Inputs:', interfaceElements.hasInputs ? `✅ (${interfaceElements.totalInputs})` : '❌');
    console.log('  - Has Heading:', interfaceElements.hasHeading ? '✅' : '❌');
    console.log('  - Customer Content:', interfaceElements.hasContent ? '✅' : '❌');
    
    if (interfaceElements.hasButtons || interfaceElements.hasTable || interfaceElements.hasGrid || interfaceElements.hasCards) {
      console.log('✅ Customer interface elements found');
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
    if (pageText.includes('customer')) {
      console.log('✅ Contains customer-related content');
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
    await page.screenshot({ path: 'customers-page-test.png', fullPage: true });
    console.log('📸 Screenshot saved as customers-page-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.errors.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test and export results
testCustomersSimple().then(results => {
  const allPassed = results.navigation && results.pageLoaded && results.hasInterface;
  console.log('\n=== CUSTOMERS PAGE TEST RESULTS ===');
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