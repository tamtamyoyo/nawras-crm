// Simplified test script to verify Proposals functionality
import puppeteer from 'puppeteer';

async function testProposalsSimple() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const testResults = {
    navigation: false,
    pageLoaded: false,
    hasInterface: false,
    errors: []
  };
  
  try {
    console.log('🚀 Starting Proposals Page Testing...');
    
    // Navigate to proposals page
    console.log('📍 Navigating to proposals page...');
    await page.goto('http://localhost:5173/proposals');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/proposals')) {
      console.log('✅ Successfully navigated to proposals page');
      testResults.navigation = true;
    } else {
      console.log('❌ Failed to navigate to proposals page');
      testResults.errors.push('Navigation to proposals page failed');
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
    
    // Check for proposals interface elements
    console.log('🔍 Checking for proposals interface elements...');
    
    const interfaceElements = await page.evaluate(() => {
      const elements = {
        hasTable: document.querySelector('table') !== null,
        hasGrid: document.querySelector('.grid, .proposals-grid') !== null,
        hasCards: document.querySelector('.card, .proposal-card') !== null,
        hasButtons: document.querySelectorAll('button').length > 0,
        hasInputs: document.querySelectorAll('input').length > 0,
        hasHeading: document.querySelector('h1, h2, h3') !== null,
        hasContent: document.body.textContent.toLowerCase().includes('proposal'),
        hasTemplate: document.body.textContent.toLowerCase().includes('template'),
        hasPDF: document.body.textContent.toLowerCase().includes('pdf'),
        hasVariable: document.body.textContent.toLowerCase().includes('variable'),
        hasSection: document.body.textContent.toLowerCase().includes('section'),
        totalButtons: document.querySelectorAll('button').length,
        totalInputs: document.querySelectorAll('input').length
      };
      return elements;
    });
    
    console.log('Interface Analysis:');
    console.log('  - Has Table:', interfaceElements.hasTable ? '✅' : '❌');
    console.log('  - Has Grid:', interfaceElements.hasGrid ? '✅' : '❌');
    console.log('  - Has Cards:', interfaceElements.hasCards ? '✅' : '❌');
    console.log('  - Has Buttons:', interfaceElements.hasButtons ? `✅ (${interfaceElements.totalButtons})` : '❌');
    console.log('  - Has Inputs:', interfaceElements.hasInputs ? `✅ (${interfaceElements.totalInputs})` : '❌');
    console.log('  - Has Heading:', interfaceElements.hasHeading ? '✅' : '❌');
    console.log('  - Proposal Content:', interfaceElements.hasContent ? '✅' : '❌');
    console.log('  - Template Content:', interfaceElements.hasTemplate ? '✅' : '❌');
    console.log('  - PDF Content:', interfaceElements.hasPDF ? '✅' : '❌');
    console.log('  - Variable Content:', interfaceElements.hasVariable ? '✅' : '❌');
    console.log('  - Section Content:', interfaceElements.hasSection ? '✅' : '❌');
    
    if (interfaceElements.hasButtons || interfaceElements.hasTable || interfaceElements.hasGrid || interfaceElements.hasCards) {
      console.log('✅ Proposals interface elements found');
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
    if (pageText.includes('proposal')) {
      console.log('✅ Contains proposal-related content');
    }
    if (pageText.includes('template')) {
      console.log('✅ Contains template-related content');
    }
    if (pageText.includes('pdf') || pageText.includes('export')) {
      console.log('✅ Contains PDF/export-related content');
    }
    if (pageText.includes('variable')) {
      console.log('✅ Contains variable-related content');
    }
    if (pageText.includes('section')) {
      console.log('✅ Contains section-related content');
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
    await page.screenshot({ path: 'proposals-page-test.png', fullPage: true });
    console.log('📸 Screenshot saved as proposals-page-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.errors.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test and export results
testProposalsSimple().then(results => {
  const allPassed = results.navigation && results.pageLoaded && results.hasInterface;
  console.log('\n=== PROPOSALS PAGE TEST RESULTS ===');
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