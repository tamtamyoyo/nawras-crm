const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting Comprehensive CRM Application Testing...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Test configuration
  const baseUrl = 'http://localhost:5173';
  const testCredentials = {
    email: 'test@example.com',
    password: 'TestPassword123!'
  };
  
  // Pages to test
  const pagesToTest = [
    { name: 'Dashboard', path: '/dashboard', hasContent: true },
    { name: 'Customers', path: '/customers', hasContent: true },
    { name: 'Deals', path: '/deals', hasContent: true },
    { name: 'Analytics', path: '/analytics', hasContent: true },
    { name: 'Calendar', path: '/calendar', hasContent: true },
    { name: 'Invoices', path: '/invoices', hasContent: true },
    { name: 'Leads', path: '/leads', hasContent: true },
    { name: 'Proposals', path: '/proposals', hasContent: true },
    { name: 'Settings', path: '/settings', hasContent: true }
  ];
  
  const testResults = {
    pages: {},
    menuConsistency: {},
    issues: [],
    recommendations: []
  };
  
  try {
    // Navigate to application
    console.log('📱 Navigating to application...');
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔐 Login required - performing authentication...');
      
      // Fill login form
      await page.type('input[type="email"]', testCredentials.email);
      await page.type('input[type="password"]', testCredentials.password);
      
      // Click sign in button
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ Authentication completed');
    }
    
    // Test each page systematically
    for (const pageInfo of pagesToTest) {
      console.log(`\n🧪 Testing ${pageInfo.name} page...`);
      
      try {
        // Navigate to page
        await page.goto(`${baseUrl}${pageInfo.path}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test page loading
        const pageTitle = await page.title();
        const pageUrl = page.url();
        
        console.log(`   📍 URL: ${pageUrl}`);
        console.log(`   📄 Title: ${pageTitle}`);
        
        // Check for loading spinners (should not be stuck)
        const loadingSpinners = await page.$$('.animate-spin');
        const hasStuckLoading = loadingSpinners.length > 0;
        
        // Check for error elements
        const errorElements = await page.$$('[class*="error"], .text-red-500, .text-destructive');
        const hasErrors = errorElements.length > 0;
        
        // Check for main content (more flexible selectors)
        const mainContent = await page.$('main, .main-content, [role="main"], .p-6, .space-y-6, h1, .grid');
        const hasMainContent = !!mainContent;
        
        // Test navigation menu consistency
        const sidebar = await page.$('nav, .sidebar, [role="navigation"]');
        const hasSidebar = !!sidebar;
        
        let menuItems = [];
        if (hasSidebar) {
          const menuLinks = await page.$$('nav a, .sidebar a, [role="navigation"] a');
          for (const link of menuLinks) {
            const text = await page.evaluate(el => el.textContent?.trim(), link);
            const href = await page.evaluate(el => el.getAttribute('href'), link);
            const isActive = await page.evaluate(el => 
              el.classList.contains('active') || 
              el.classList.contains('bg-primary') ||
              el.classList.contains('text-primary') ||
              el.getAttribute('aria-current') === 'page'
            , link);
            
            if (text && href) {
              menuItems.push({ text, href, isActive });
            }
          }
        }
        
        // Test page-specific functionality
        let pageSpecificTests = {};
        
        if (pageInfo.name === 'Customers') {
          // Test customer-specific functionality
          const addButton = await page.$('button[class*="add"], button[aria-label*="Add"], .add-customer-btn');
          const searchInput = await page.$('input[placeholder*="search"], input[type="search"]');
          const customerCards = await page.$$('.customer-card, [data-testid="customer"], .grid > div');
          
          pageSpecificTests = {
            hasAddButton: !!addButton,
            hasSearchInput: !!searchInput,
            customerCount: customerCards.length
          };
        } else if (pageInfo.name === 'Dashboard') {
          // Test dashboard-specific functionality
          const widgets = await page.$$('.widget, .card, .dashboard-item');
          const charts = await page.$$('canvas, svg[class*="chart"], .recharts-wrapper');
          
          pageSpecificTests = {
            widgetCount: widgets.length,
            chartCount: charts.length
          };
        }
        
        // Store test results
        testResults.pages[pageInfo.name] = {
          url: pageUrl,
          title: pageTitle,
          loaded: !hasStuckLoading,
          hasErrors,
          hasMainContent,
          hasSidebar,
          menuItems,
          pageSpecificTests,
          status: (!hasStuckLoading && !hasErrors && hasMainContent) ? 'PASS' : 'FAIL'
        };
        
        console.log(`   ✅ Status: ${testResults.pages[pageInfo.name].status}`);
        
        if (hasStuckLoading) {
          console.log('   ⚠️  Warning: Loading spinner detected');
          testResults.issues.push(`${pageInfo.name} page has stuck loading spinner`);
        }
        
        if (hasErrors) {
          console.log('   ❌ Error: Error elements found on page');
          testResults.issues.push(`${pageInfo.name} page has error elements`);
        }
        
        if (!hasMainContent) {
          console.log('   ❌ Error: No main content found');
          testResults.issues.push(`${pageInfo.name} page missing main content`);
        }
        
        console.log(`   📊 Menu items: ${menuItems.length}`);
        // Check for active menu item
        const activeMenuItem = await page.evaluate(() => {
          const activeItem = document.querySelector('nav a.bg-blue-100, nav a[class*="bg-blue-100"], nav a[aria-current="page"]')
          return activeItem ? activeItem.textContent.trim() : 'None'
        })
        
        console.log(`   🎯 Active menu item: ${menuItems.find(item => item.isActive)?.text || activeMenuItem}`);
        
      } catch (error) {
        console.log(`   ❌ Error testing ${pageInfo.name}: ${error.message}`);
        testResults.pages[pageInfo.name] = {
          status: 'ERROR',
          error: error.message
        };
        testResults.issues.push(`${pageInfo.name} page failed to load: ${error.message}`);
      }
    }
    
    // Analyze menu consistency
    console.log('\n🎨 Analyzing menu consistency...');
    const allMenuItems = Object.values(testResults.pages)
      .filter(page => page.menuItems)
      .map(page => page.menuItems);
    
    if (allMenuItems.length > 0) {
      const firstPageMenu = allMenuItems[0];
      let isConsistent = true;
      
      for (let i = 1; i < allMenuItems.length; i++) {
        const currentMenu = allMenuItems[i];
        if (currentMenu.length !== firstPageMenu.length) {
          isConsistent = false;
          break;
        }
        
        for (let j = 0; j < firstPageMenu.length; j++) {
          if (firstPageMenu[j].text !== currentMenu[j].text || 
              firstPageMenu[j].href !== currentMenu[j].href) {
            isConsistent = false;
            break;
          }
        }
      }
      
      testResults.menuConsistency = {
        isConsistent,
        menuItemCount: firstPageMenu.length,
        testedPages: allMenuItems.length
      };
      
      if (!isConsistent) {
        testResults.issues.push('Menu items are not consistent across pages');
      }
    }
    
    // Generate recommendations
    const passedPages = Object.values(testResults.pages).filter(page => page.status === 'PASS').length;
    const totalPages = Object.keys(testResults.pages).length;
    
    if (passedPages < totalPages) {
      testResults.recommendations.push('Fix failing pages to improve overall application stability');
    }
    
    if (testResults.issues.length > 0) {
      testResults.recommendations.push('Address identified issues to improve user experience');
    }
    
    if (!testResults.menuConsistency.isConsistent) {
      testResults.recommendations.push('Ensure menu consistency across all pages');
    }
    
    // Print comprehensive results
    console.log('\n📋 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(50));
    
    console.log(`\n📊 Overall Status: ${passedPages}/${totalPages} pages passed`);
    
    console.log('\n📄 Page Results:');
    Object.entries(testResults.pages).forEach(([pageName, result]) => {
      console.log(`   ${result.status === 'PASS' ? '✅' : '❌'} ${pageName}: ${result.status}`);
    });
    
    console.log(`\n🎨 Menu Consistency: ${testResults.menuConsistency.isConsistent ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`);
    
    if (testResults.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      testResults.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    if (testResults.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      testResults.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser kept open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Comprehensive testing completed!');
  }
})();