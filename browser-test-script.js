// CRM Comprehensive Test Script - Execute in Browser Console
// Copy and paste this entire script into the browser console at http://localhost:5173

console.log('🚀 Starting CRM Comprehensive Testing...');

const testResults = {};
const testCredentials = { email: 'test@example.com', password: 'TestPass1123!' };

function logResult(section, message, status = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${section.toUpperCase()}: ${message}`);
  
  if (!testResults[section]) testResults[section] = { status: 'pending', messages: [] };
  testResults[section].messages.push(message);
  if (status === 'fail') testResults[section].status = 'failed';
  else if (status === 'pass' && testResults[section].status !== 'failed') testResults[section].status = 'passed';
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findElement(selectors, description) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

// Test 1: Login Process
async function testLogin() {
  console.log('\n📋 Testing Login Process...');
  
  try {
    // Check current page
    const currentPath = window.location.pathname;
    logResult('login', `Current page: ${currentPath}`);
    
    // If already logged in, test logout first
    if (currentPath !== '/login' && currentPath !== '/') {
      const logoutBtn = findElement(['button:contains("Logout")', 'button:contains("Sign Out")', '[data-testid="logout"]'], 'Logout button');
      if (logoutBtn) {
        logoutBtn.click();
        await wait(2000);
        logResult('login', 'Logged out successfully');
      }
    }
    
    // Navigate to login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
      await wait(3000);
    }
    
    // Find login form elements
    const emailInput = findElement(['input[type="email"]', 'input[name="email"]', '#email'], 'Email input');
    const passwordInput = findElement(['input[type="password"]', 'input[name="password"]', '#password'], 'Password input');
    const loginButton = findElement(['button[type="submit"]', 'button:contains("Sign In")', 'button:contains("Login")'], 'Login button');
    
    if (!emailInput) {
      logResult('login', 'Email input field not found', 'fail');
      return false;
    }
    if (!passwordInput) {
      logResult('login', 'Password input field not found', 'fail');
      return false;
    }
    if (!loginButton) {
      logResult('login', 'Login button not found', 'fail');
      return false;
    }
    
    logResult('login', 'All login form elements found', 'pass');
    
    // Fill credentials
    emailInput.value = testCredentials.email;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    passwordInput.value = testCredentials.password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    logResult('login', 'Credentials entered');
    
    // Submit login
    loginButton.click();
    await wait(4000);
    
    // Check if login successful
    const newPath = window.location.pathname;
    if (newPath === '/dashboard' || newPath === '/' || document.querySelector('.dashboard, [data-testid="dashboard"]')) {
      logResult('login', 'Login successful - redirected to dashboard', 'pass');
      return true;
    } else {
      logResult('login', `Login may have failed - current path: ${newPath}`, 'fail');
      return false;
    }
    
  } catch (error) {
    logResult('login', `Login test error: ${error.message}`, 'fail');
    return false;
  }
}

// Test 2: Dashboard
async function testDashboard() {
  console.log('\n📊 Testing Dashboard...');
  
  try {
    // Navigate to dashboard
    if (window.location.pathname !== '/dashboard' && window.location.pathname !== '/') {
      window.location.href = '/dashboard';
      await wait(2000);
    }
    
    // Check page load
    const pageTitle = document.title;
    logResult('dashboard', `Page title: ${pageTitle}`);
    
    // Check for dashboard elements
    const mainContent = findElement(['main', '.dashboard', '.content', '[data-testid="dashboard"]'], 'Main content area');
    if (mainContent) {
      logResult('dashboard', 'Main dashboard content found', 'pass');
    } else {
      logResult('dashboard', 'Main dashboard content not found', 'fail');
    }
    
    // Check for navigation
    const navigation = findElement(['nav', '.navigation', '.sidebar', '.nav-menu'], 'Navigation menu');
    if (navigation) {
      logResult('dashboard', 'Navigation menu found', 'pass');
      
      // Count navigation items
      const navItems = navigation.querySelectorAll('a, button, .nav-item');
      logResult('dashboard', `Found ${navItems.length} navigation items`);
    } else {
      logResult('dashboard', 'Navigation menu not found', 'fail');
    }
    
    // Check for dashboard cards/metrics
    const cards = document.querySelectorAll('.card, .metric, .stat, .widget, [class*="card"]');
    if (cards.length > 0) {
      logResult('dashboard', `Found ${cards.length} dashboard cards/metrics`, 'pass');
    } else {
      logResult('dashboard', 'No dashboard cards/metrics found');
    }
    
    // Check for charts/visualizations
    const charts = document.querySelectorAll('canvas, svg, .chart, .graph, [class*="chart"]');
    if (charts.length > 0) {
      logResult('dashboard', `Found ${charts.length} charts/visualizations`, 'pass');
    } else {
      logResult('dashboard', 'No charts/visualizations found');
    }
    
  } catch (error) {
    logResult('dashboard', `Dashboard test error: ${error.message}`, 'fail');
  }
}

// Test 3: Section Testing
async function testSection(sectionName, path) {
  console.log(`\n📋 Testing ${sectionName.toUpperCase()} Section...`);
  
  try {
    // Navigate to section
    const navLink = findElement([`a[href="${path}"]`, `a:contains("${sectionName}")`], `${sectionName} navigation link`);
    if (navLink) {
      navLink.click();
      await wait(2000);
      logResult(sectionName, 'Navigated via menu link', 'pass');
    } else {
      window.location.href = path;
      await wait(2000);
      logResult(sectionName, 'Navigated via direct URL');
    }
    
    // Check page load
    const currentPath = window.location.pathname;
    if (currentPath === path) {
      logResult(sectionName, 'Page loaded successfully', 'pass');
    } else {
      logResult(sectionName, `Page load issue - expected ${path}, got ${currentPath}`, 'fail');
    }
    
    // Check for main content
    const mainContent = findElement(['main', '.content', '.page-content', `[data-testid="${sectionName}"]`], 'Main content');
    if (mainContent) {
      logResult(sectionName, 'Main content area found', 'pass');
    } else {
      logResult(sectionName, 'Main content area not found', 'fail');
    }
    
    // Check for data display (table, list, grid)
    const dataDisplay = findElement(['table', '.table', '.data-grid', '.list', '.grid', '[class*="table"]'], 'Data display');
    if (dataDisplay) {
      const rows = dataDisplay.querySelectorAll('tr, .row, .item, [class*="row"]');
      logResult(sectionName, `Data display found with ${rows.length} items`, 'pass');
    } else {
      logResult(sectionName, 'No data display found');
    }
    
    // Check for action buttons
    const addButton = findElement(['button:contains("Add")', 'button:contains("Create")', 'button:contains("New")', '[data-action="add"]'], 'Add/Create button');
    if (addButton) {
      logResult(sectionName, 'Add/Create button found', 'pass');
    }
    
    // Check for search functionality
    const searchInput = findElement(['input[type="search"]', 'input[placeholder*="search"]', 'input[placeholder*="Search"]'], 'Search input');
    if (searchInput) {
      logResult(sectionName, 'Search functionality found', 'pass');
    }
    
    // Check for filters
    const filters = document.querySelectorAll('select, .filter, .dropdown, [class*="filter"]');
    if (filters.length > 0) {
      logResult(sectionName, `Found ${filters.length} filter elements`, 'pass');
    }
    
  } catch (error) {
    logResult(sectionName, `Section test error: ${error.message}`, 'fail');
  }
}

// Main test execution
async function runAllTests() {
  console.log('🎯 Starting Comprehensive CRM Testing Suite');
  console.log('⏰ Test started at:', new Date().toLocaleString());
  
  // Test login
  const loginSuccess = await testLogin();
  
  if (loginSuccess) {
    // Test dashboard
    await testDashboard();
    
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
      await wait(1000);
    }
  } else {
    console.log('❌ Login failed - skipping other tests');
  }
  
  // Generate summary report
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  let totalSections = 0;
  let passedSections = 0;
  let failedSections = 0;
  
  for (const [section, result] of Object.entries(testResults)) {
    totalSections++;
    const status = result.status;
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏳';
    
    console.log(`${emoji} ${section.toUpperCase()}: ${status}`);
    
    if (status === 'passed') passedSections++;
    else if (status === 'failed') failedSections++;
    
    // Show key messages
    const importantMessages = result.messages.slice(-3); // Last 3 messages
    importantMessages.forEach(msg => console.log(`   • ${msg}`));
  }
  
  console.log('\n📈 FINAL STATISTICS');
  console.log('=' .repeat(30));
  console.log(`Total Sections Tested: ${totalSections}`);
  console.log(`✅ Passed: ${passedSections}`);
  console.log(`❌ Failed: ${failedSections}`);
  console.log(`⏳ Pending: ${totalSections - passedSections - failedSections}`);
  console.log(`📊 Success Rate: ${totalSections > 0 ? ((passedSections / totalSections) * 100).toFixed(1) : 0}%`);
  console.log('⏰ Test completed at:', new Date().toLocaleString());
  
  return testResults;
}

// Execute the tests
runAllTests().then(results => {
  console.log('\n🎉 Testing completed! Results stored in testResults variable.');
  window.crmTestResults = results;
}).catch(error => {
  console.error('❌ Testing failed:', error);
});