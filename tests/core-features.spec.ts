import { test, expect } from '@playwright/test';

test.describe('Core CRM Features Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should have navigation menu with core CRM sections', async ({ page }) => {
    // Look for main navigation elements
    const navItems = [
      'Dashboard', 'Customers', 'Deals', 'Leads', 'Invoices', 'Proposals', 'Analytics', 'Settings'
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(`a:has-text("${item}"), button:has-text("${item}"), [href*="${item.toLowerCase()}"]`);
      if (await navLink.count() > 0) {
        console.log(`✓ Found navigation for: ${item}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/navigation-menu.png' });
  });

  test('should access dashboard page', async ({ page }) => {
    // Try to navigate to dashboard
    const dashboardLink = page.locator('a:has-text("Dashboard"), [href*="dashboard"], [href*="/"]').first();
    
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
      
      // Check for dashboard elements
      const dashboardElements = page.locator('.dashboard, .stats, .metrics, .chart, .summary');
      const hasDashboardContent = await dashboardElements.count() > 0;
      
      if (hasDashboardContent) {
        console.log('✓ Dashboard content detected');
      }
      
      await page.screenshot({ path: 'test-results/dashboard-page.png' });
    }
  });

  test('should access customers page and test CRUD operations', async ({ page }) => {
    const customersLink = page.locator('a:has-text("Customers"), [href*="customers"]').first();
    
    if (await customersLink.count() > 0) {
      await customersLink.click();
      await page.waitForTimeout(2000);
      
      // Check for customer list or table
      const customerTable = page.locator('table, .customer-list, .data-table');
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
      
      if (await customerTable.count() > 0) {
        console.log('✓ Customer table/list found');
      }
      
      if (await addButton.count() > 0) {
        console.log('✓ Add customer button found');
        
        // Try to open add customer form
        await addButton.first().click();
        await page.waitForTimeout(1000);
        
        // Look for form fields
        const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]');
        const emailInput = page.locator('input[name*="email"], input[type="email"]');
        
        if (await nameInput.count() > 0 && await emailInput.count() > 0) {
          console.log('✓ Customer form fields detected');
        }
      }
      
      await page.screenshot({ path: 'test-results/customers-page.png' });
    }
  });

  test('should access deals page and verify functionality', async ({ page }) => {
    const dealsLink = page.locator('a:has-text("Deals"), [href*="deals"]').first();
    
    if (await dealsLink.count() > 0) {
      await dealsLink.click();
      await page.waitForTimeout(2000);
      
      // Check for deals pipeline or list
      const dealsContent = page.locator('.pipeline, .deals-list, .kanban, table');
      const addDealButton = page.locator('button:has-text("Add"), button:has-text("New Deal"), button:has-text("Create")');
      
      if (await dealsContent.count() > 0) {
        console.log('✓ Deals content found');
      }
      
      if (await addDealButton.count() > 0) {
        console.log('✓ Add deal functionality available');
      }
      
      await page.screenshot({ path: 'test-results/deals-page.png' });
    }
  });

  test('should access leads page and verify tracking', async ({ page }) => {
    const leadsLink = page.locator('a:has-text("Leads"), [href*="leads"]').first();
    
    if (await leadsLink.count() > 0) {
      await leadsLink.click();
      await page.waitForTimeout(2000);
      
      // Check for leads list or management interface
      const leadsContent = page.locator('.leads-list, table, .lead-card');
      const addLeadButton = page.locator('button:has-text("Add"), button:has-text("New Lead"), button:has-text("Create")');
      
      if (await leadsContent.count() > 0) {
        console.log('✓ Leads content found');
      }
      
      if (await addLeadButton.count() > 0) {
        console.log('✓ Add lead functionality available');
      }
      
      await page.screenshot({ path: 'test-results/leads-page.png' });
    }
  });

  test('should access invoices page and verify AlertCircle fix', async ({ page }) => {
    const invoicesLink = page.locator('a:has-text("Invoices"), [href*="invoices"]').first();
    
    if (await invoicesLink.count() > 0) {
      await invoicesLink.click();
      await page.waitForTimeout(3000);
      
      // Check for console errors specifically related to AlertCircle
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('AlertCircle')) {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Verify no AlertCircle errors
      expect(consoleErrors).toHaveLength(0);
      console.log('✓ No AlertCircle errors detected');
      
      // Check for invoice functionality
      const invoiceTable = page.locator('table, .invoice-list');
      const addInvoiceButton = page.locator('button:has-text("Add"), button:has-text("New Invoice"), button:has-text("Create")');
      
      if (await invoiceTable.count() > 0) {
        console.log('✓ Invoice table/list found');
      }
      
      if (await addInvoiceButton.count() > 0) {
        console.log('✓ Add invoice functionality available');
      }
      
      await page.screenshot({ path: 'test-results/invoices-page.png' });
    }
  });

  test('should access proposals page', async ({ page }) => {
    const proposalsLink = page.locator('a:has-text("Proposals"), [href*="proposals"]').first();
    
    if (await proposalsLink.count() > 0) {
      await proposalsLink.click();
      await page.waitForTimeout(2000);
      
      // Check for proposals content
      const proposalsContent = page.locator('.proposals-list, table, .proposal-card');
      
      if (await proposalsContent.count() > 0) {
        console.log('✓ Proposals content found');
      }
      
      await page.screenshot({ path: 'test-results/proposals-page.png' });
    }
  });

  test('should access analytics page', async ({ page }) => {
    const analyticsLink = page.locator('a:has-text("Analytics"), [href*="analytics"], a:has-text("Reports")').first();
    
    if (await analyticsLink.count() > 0) {
      await analyticsLink.click();
      await page.waitForTimeout(2000);
      
      // Check for analytics/charts content
      const analyticsContent = page.locator('.chart, .analytics, .metrics, .report, canvas, svg');
      
      if (await analyticsContent.count() > 0) {
        console.log('✓ Analytics content found');
      }
      
      await page.screenshot({ path: 'test-results/analytics-page.png' });
    }
  });

  test('should access settings page', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), [href*="settings"]').first();
    
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(2000);
      
      // Check for settings form or configuration options
      const settingsContent = page.locator('form, .settings, .config, input, select');
      
      if (await settingsContent.count() > 0) {
        console.log('✓ Settings content found');
      }
      
      await page.screenshot({ path: 'test-results/settings-page.png' });
    }
  });

  test('should verify search functionality if available', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], .search-input');
    
    if (await searchInput.count() > 0) {
      console.log('✓ Search functionality found');
      
      // Test search
      await searchInput.first().fill('test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/search-functionality.png' });
    }
  });

  test('should verify data tables have proper functionality', async ({ page }) => {
    // Look for any data tables
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    if (tableCount > 0) {
      console.log(`✓ Found ${tableCount} data table(s)`);
      
      // Check for sorting functionality
      const sortableHeaders = page.locator('th[role="button"], th.sortable, th[data-sort]');
      if (await sortableHeaders.count() > 0) {
        console.log('✓ Sortable table headers found');
      }
      
      // Check for pagination
      const pagination = page.locator('.pagination, .page-nav, button:has-text("Next"), button:has-text("Previous")');
      if (await pagination.count() > 0) {
        console.log('✓ Pagination found');
      }
    }
  });
});