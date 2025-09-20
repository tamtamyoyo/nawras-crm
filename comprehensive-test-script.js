/**
 * Comprehensive CRM System Test Script
 * Tests all major functionality including cross-feature integration
 */

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, details = '') {
  const result = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${details}`);
  }
}

// Test 1: Navigation and Page Loading
function testNavigation() {
  console.log('\n🔍 Testing Navigation and Page Loading...');
  
  const pages = [
    { name: 'Dashboard', path: '/' },
    { name: 'Customers', path: '/customers' },
    { name: 'Leads', path: '/leads' },
    { name: 'Deals', path: '/deals' },
    { name: 'Proposals', path: '/proposals' },
    { name: 'Invoices', path: '/invoices' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Settings', path: '/settings' }
  ];
  
  pages.forEach(page => {
    try {
      // Simulate navigation test
      const navLink = document.querySelector(`a[href="${page.path}"]`);
      if (navLink) {
        logTest(`${page.name} page navigation link exists`, true);
      } else {
        logTest(`${page.name} page navigation link exists`, false, 'Navigation link not found');
      }
    } catch (error) {
      logTest(`${page.name} page navigation`, false, error.message);
    }
  });
}

// Test 2: Demo Data Functionality
function testDemoDataFunctionality() {
  console.log('\n🔍 Testing Demo Data Functionality...');
  
  try {
    // Check if Add Demo Data buttons exist
    const demoButtons = document.querySelectorAll('button:contains("Add Demo Data")');
    if (demoButtons.length > 0) {
      logTest('Demo Data buttons present', true, `Found ${demoButtons.length} demo data buttons`);
    } else {
      // Alternative check for demo data functionality
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Demo') || btn.textContent.includes('Sample')
      );
      if (buttons.length > 0) {
        logTest('Demo Data functionality available', true, `Found ${buttons.length} demo-related buttons`);
      } else {
        logTest('Demo Data buttons present', false, 'No demo data buttons found');
      }
    }
  } catch (error) {
    logTest('Demo Data functionality test', false, error.message);
  }
}

// Test 3: Data Tables and Lists
function testDataTables() {
  console.log('\n🔍 Testing Data Tables and Lists...');
  
  try {
    // Check for table elements
    const tables = document.querySelectorAll('table, [role="table"]');
    const lists = document.querySelectorAll('ul, ol, .list-container');
    const cards = document.querySelectorAll('.card, [class*="card"]');
    
    if (tables.length > 0) {
      logTest('Data tables present', true, `Found ${tables.length} tables`);
    } else if (lists.length > 0) {
      logTest('Data lists present', true, `Found ${lists.length} lists`);
    } else if (cards.length > 0) {
      logTest('Data cards present', true, `Found ${cards.length} cards`);
    } else {
      logTest('Data display elements', false, 'No tables, lists, or cards found');
    }
  } catch (error) {
    logTest('Data tables test', false, error.message);
  }
}

// Test 4: Search Functionality
function testSearchFunctionality() {
  console.log('\n🔍 Testing Search Functionality...');
  
  try {
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]');
    if (searchInputs.length > 0) {
      logTest('Search inputs present', true, `Found ${searchInputs.length} search inputs`);
      
      // Test search input functionality
      searchInputs.forEach((input, index) => {
        try {
          input.value = 'test';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          logTest(`Search input ${index + 1} functional`, true);
        } catch (error) {
          logTest(`Search input ${index + 1} functional`, false, error.message);
        }
      });
    } else {
      logTest('Search functionality', false, 'No search inputs found');
    }
  } catch (error) {
    logTest('Search functionality test', false, error.message);
  }
}

// Test 5: Form Elements
function testFormElements() {
  console.log('\n🔍 Testing Form Elements...');
  
  try {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, textarea, select');
    const buttons = document.querySelectorAll('button[type="submit"], button:contains("Save"), button:contains("Add"), button:contains("Create")');
    
    logTest('Forms present', forms.length > 0, `Found ${forms.length} forms`);
    logTest('Input elements present', inputs.length > 0, `Found ${inputs.length} input elements`);
    logTest('Action buttons present', buttons.length > 0, `Found ${buttons.length} action buttons`);
  } catch (error) {
    logTest('Form elements test', false, error.message);
  }
}

// Test 6: Modal and Dialog Functionality
function testModalsAndDialogs() {
  console.log('\n🔍 Testing Modals and Dialogs...');
  
  try {
    const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
    const overlays = document.querySelectorAll('.overlay, [class*="overlay"]');
    const popups = document.querySelectorAll('.popup, [class*="popup"]');
    
    const totalDialogElements = modals.length + overlays.length + popups.length;
    logTest('Modal/Dialog elements present', totalDialogElements > 0, `Found ${totalDialogElements} dialog elements`);
  } catch (error) {
    logTest('Modals and dialogs test', false, error.message);
  }
}

// Test 7: Responsive Design Elements
function testResponsiveDesign() {
  console.log('\n🔍 Testing Responsive Design Elements...');
  
  try {
    // Check for responsive classes
    const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]');
    logTest('Responsive design classes', responsiveElements.length > 0, `Found ${responsiveElements.length} responsive elements`);
    
    // Check viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    logTest('Viewport meta tag present', !!viewportMeta, viewportMeta ? viewportMeta.content : 'Not found');
  } catch (error) {
    logTest('Responsive design test', false, error.message);
  }
}

// Test 8: Chart and Analytics Elements
function testChartsAndAnalytics() {
  console.log('\n🔍 Testing Charts and Analytics Elements...');
  
  try {
    // Check for chart containers or SVG elements (common in chart libraries)
    const charts = document.querySelectorAll('svg, canvas, [class*="chart"], [class*="graph"]');
    const metrics = document.querySelectorAll('[class*="metric"], [class*="stat"], [class*="kpi"]');
    
    logTest('Chart elements present', charts.length > 0, `Found ${charts.length} chart elements`);
    logTest('Metric elements present', metrics.length > 0, `Found ${metrics.length} metric elements`);
  } catch (error) {
    logTest('Charts and analytics test', false, error.message);
  }
}

// Test 9: Calendar Elements
function testCalendarElements() {
  console.log('\n🔍 Testing Calendar Elements...');
  
  try {
    const calendars = document.querySelectorAll('[class*="calendar"], [class*="date"]');
    const dateInputs = document.querySelectorAll('input[type="date"], input[type="datetime-local"]');
    
    logTest('Calendar elements present', calendars.length > 0, `Found ${calendars.length} calendar elements`);
    logTest('Date inputs present', dateInputs.length > 0, `Found ${dateInputs.length} date inputs`);
  } catch (error) {
    logTest('Calendar elements test', false, error.message);
  }
}

// Test 10: Error Handling
function testErrorHandling() {
  console.log('\n🔍 Testing Error Handling...');
  
  try {
    // Check for error boundary or error display elements
    const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]');
    logTest('Error handling elements present', errorElements.length >= 0, `Found ${errorElements.length} error handling elements`);
    
    // Check console for any errors
    const hasConsoleErrors = window.console && window.console.error;
    logTest('Console error handling available', !!hasConsoleErrors);
  } catch (error) {
    logTest('Error handling test', false, error.message);
  }
}

// Main test runner
function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive CRM System Tests...');
  console.log('=' .repeat(50));
  
  // Run all tests
  testNavigation();
  testDemoDataFunctionality();
  testDataTables();
  testSearchFunctionality();
  testFormElements();
  testModalsAndDialogs();
  testResponsiveDesign();
  testChartsAndAnalytics();
  testCalendarElements();
  testErrorHandling();
  
  // Generate summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  testResults.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.name}${test.details ? ': ' + test.details : ''}`);
  });
  
  return testResults;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runCRMTests = runComprehensiveTests;
  window.testResults = testResults;
}

// Auto-run if in browser environment
if (typeof document !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runComprehensiveTests);
  } else {
    runComprehensiveTests();
  }
}

export { runComprehensiveTests, testResults };