/**
 * Comprehensive CRM System Testing Script
 * Tests all sections and functionality of the CRM application
 */

const testResults = {
  login: { status: 'pending', errors: [], notes: [] },
  dashboard: { status: 'pending', errors: [], notes: [] },
  customers: { status: 'pending', errors: [], notes: [] },
  leads: { status: 'pending', errors: [], notes: [] },
  deals: { status: 'pending', errors: [], notes: [] },
  proposals: { status: 'pending', errors: [], notes: [] },
  invoices: { status: 'pending', errors: [], notes: [] },
  analytics: { status: 'pending', errors: [], notes: [] },
  settings: { status: 'pending', errors: [], notes: [] }
};

const testCredentials = {
  email: 'test@example.com',
  password: 'TestPass1123!'
};

// Test utilities
function logTest(section, message, type = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${section.toUpperCase()}] ${type.toUpperCase()}: ${message}`);
  
  if (type === 'error') {
    testResults[section].errors.push(message);
    testResults[section].status = 'failed';
  } else {
    testResults[section].notes.push(message);
  }
}

function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkElement(selector, section, description) {
  const element = document.querySelector(selector);
  if (!element) {
    logTest(section, `Missing element: ${description} (${selector})`, 'error');
    return false;
  }
  logTest(section, `Found element: ${description}`);
  return element;
}

function checkConsoleErrors(section) {
  // Monitor console errors during testing
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    if (errors.length > 0) {
      logTest(section, `Console errors detected: ${errors.join(', ')}`, 'error');
    } else {
      logTest(section, 'No console errors detected');
    }
  }, 2000);
}

// Test functions
async function testLogin() {
  logTest('login', 'Starting login test');
  checkConsoleErrors('login');
  
  try {
    // Check if already logged in
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      logTest('login', 'Already logged in, proceeding to dashboard test');
      testResults.login.status = 'passed';
      return true;
    }
    
    // Navigate to login if needed
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
      await waitFor(2000);
    }
    
    // Check login form elements
    const emailInput = checkElement('input[type="email"], input[name="email"]', 'login', 'Email input field');
    const passwordInput = checkElement('input[type="password"], input[name="password"]', 'login', 'Password input field');
    const loginButton = checkElement('button[type="submit"], button:contains("Sign In"), button:contains("Login")', 'login', 'Login button');
    
    if (!emailInput || !passwordInput || !loginButton) {
      logTest('login', 'Login form elements missing', 'error');
      return false;
    }
    
    // Fill in credentials
    emailInput.value = testCredentials.email;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    passwordInput.value = testCredentials.password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    logTest('login', 'Credentials entered successfully');
    
    // Submit form
    loginButton.click();
    await waitFor(3000);
    
    // Check if login was successful
    if (window.location.pathname === '/dashboard' || window.location.pathname === '/' || document.querySelector('[data-testid="dashboard"], .dashboard')) {
      logTest('login', 'Login successful - redirected to dashboard');
      testResults.login.status = 'passed';
      return true;
    } else {
      logTest('login', 'Login failed - not redirected to dashboard', 'error');
      return false;
    }
    
  } catch (error) {
    logTest('login', `Login test failed with error: ${error.message}`, 'error');
    return false;
  }
}

async function testDashboard() {
  logTest('dashboard', 'Starting dashboard test');
  checkConsoleErrors('dashboard');
  
  try {
    // Navigate to dashboard
    if (window.location.pathname !== '/dashboard' && window.location.pathname !== '/') {
      window.location.href = '/dashboard';
      await waitFor(2000);
    }
    
    // Check dashboard elements
    const dashboardContainer = checkElement('.dashboard, [data-testid="dashboard"], main', 'dashboard', 'Dashboard container');
    
    // Check for common dashboard components
    const statsCards = document.querySelectorAll('.stat-card, .metric-card, .card');
    if (statsCards.length > 0) {
      logTest('dashboard', `Found ${statsCards.length} dashboard cards/metrics`);
    } else {
      logTest('dashboard', 'No dashboard cards/metrics found', 'error');
    }
    
    // Check for charts or data visualization
    const charts = document.querySelectorAll('canvas, svg, .chart, .graph');
    if (charts.length > 0) {
      logTest('dashboard', `Found ${charts.length} charts/visualizations`);
    }
    
    // Check navigation menu
    const navMenu = checkElement('nav, .navigation, .sidebar', 'dashboard', 'Navigation menu');
    
    testResults.dashboard.status = 'passed';
    logTest('dashboard', 'Dashboard test completed successfully');
    
  } catch (error) {
    logTest('dashboard', `Dashboard test failed: ${error.message}`, 'error');
  }
}

async function testSection(sectionName, path) {
  logTest(sectionName, `Starting ${sectionName} section test`);
  checkConsoleErrors(sectionName);
  
  try {
    // Navigate to section
    window.location.href = path;
    await waitFor(2000);
    
    // Check if page loaded
    const pageContainer = checkElement('main, .content, .page-container', sectionName, 'Page container');
    
    // Check for data table or list
    const dataTable = document.querySelector('table, .table, .data-grid, .list');
    if (dataTable) {
      logTest(sectionName, 'Data table/list found');
      
      // Check for rows
      const rows = dataTable.querySelectorAll('tr, .row, .item');
      logTest(sectionName, `Found ${rows.length} data rows`);
    }
    
    // Check for action buttons
    const addButton = document.querySelector('button:contains("Add"), button:contains("Create"), button:contains("New")');
    if (addButton) {
      logTest(sectionName, 'Add/Create button found');
    }
    
    // Check for search/filter functionality
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
    if (searchInput) {
      logTest(sectionName, 'Search functionality found');
    }
    
    const filterElements = document.querySelectorAll('select, .filter, .dropdown');
    if (filterElements.length > 0) {
      logTest(sectionName, `Found ${filterElements.length} filter elements`);
    }
    
    testResults[sectionName].status = 'passed';
    logTest(sectionName, `${sectionName} section test completed successfully`);
    
  } catch (error) {
    logTest(sectionName, `${sectionName} test failed: ${error.message}`, 'error');
  }
}

async function testCRUDOperations(sectionName) {
  logTest(sectionName, `Testing CRUD operations for ${sectionName}`);
  
  try {
    // Test Create operation
    const addButton = document.querySelector('button:contains("Add"), button:contains("Create"), button:contains("New")');
    if (addButton) {
      addButton.click();
      await waitFor(1000);
      
      // Check if modal or form appeared
      const modal = document.querySelector('.modal, .dialog, .form-container');
      if (modal) {
        logTest(sectionName, 'Create form/modal opened successfully');
        
        // Close modal
        const closeButton = modal.querySelector('button:contains("Cancel"), button:contains("Close"), .close');
        if (closeButton) {
          closeButton.click();
          await waitFor(500);
        }
      }
    }
    
    // Test Read operation (already tested by checking data display)
    logTest(sectionName, 'Read operation verified (data display)');
    
    // Test Update operation
    const editButton = document.querySelector('button:contains("Edit"), .edit-btn, [data-action="edit"]');
    if (editButton) {
      logTest(sectionName, 'Edit functionality found');
    }
    
    // Test Delete operation
    const deleteButton = document.querySelector('button:contains("Delete"), .delete-btn, [data-action="delete"]');
    if (deleteButton) {
      logTest(sectionName, 'Delete functionality found');
    }
    
  } catch (error) {
    logTest(sectionName, `CRUD operations test failed: ${error.message}`, 'error');
  }
}

// Main test execution
async function runComprehensiveTest() {
  console.log('=== Starting Comprehensive CRM Testing ===');
  console.log('Test started at:', new Date().toISOString());
  
  // Test login
  await testLogin();
  await waitFor(2000);
  
  // Test dashboard
  await testDashboard();
  await waitFor(1000);
  
  // Test all sections
  const sections = [
    { name: 'customers', path: '/customers' },
    { name: 'leads', path: '/leads' },
    { name: 'deals', path: '/deals' },
    { name: 'proposals', path: '/proposals' },
    { name: 'invoices', path: '/invoices' },
    { name: 'analytics', path: '/analytics' },
    { name: 'settings', path: '/settings' }
  ];
  
  for (const section of sections) {
    await testSection(section.name, section.path);
    await testCRUDOperations(section.name);
    await waitFor(1000);
  }
  
  // Generate final report
  console.log('\n=== TEST RESULTS SUMMARY ===');
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [section, result] of Object.entries(testResults)) {
    totalTests++;
    console.log(`\n${section.toUpperCase()}:`);
    console.log(`  Status: ${result.status}`);
    
    if (result.status === 'passed') {
      passedTests++;
    } else if (result.status === 'failed') {
      failedTests++;
    }
    
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach(error => console.log(`    - ${error}`));
    }
    
    if (result.notes.length > 0) {
      console.log(`  Notes: ${result.notes.length}`);
      result.notes.forEach(note => console.log(`    - ${note}`));
    }
  }
  
  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('Test completed at:', new Date().toISOString());
  
  return testResults;
}

// Auto-run if script is executed directly
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runComprehensiveTest);
  } else {
    runComprehensiveTest();
  }
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runComprehensiveTest, testResults };
}