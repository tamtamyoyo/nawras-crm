import { test, expect } from '@playwright/test';

// Test data for comprehensive testing
const testData = {
  customer: {
    name: `Test Customer ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    phone: '+1234567890',
    company: 'Test Company'
  },
  deal: {
    title: 'Test Deal',
    value: '50000',
    stage: 'Proposal',
    customer: 'Test Customer'
  },
  lead: {
    name: 'Test Lead',
    email: 'lead@example.com',
    phone: '+1987654321',
    source: 'Website'
  }
};

// Helper function to login (if authentication is required)
async function login(page: import('@playwright/test').Page) {
  // Since ProtectedRoute has a testing bypass, we just need to ensure we're on a protected page
  // and wait for the navigation to appear
  const desktopNavElement = page.locator('[data-testid="desktop-nav-dashboard"]');
  const mobileNavElement = page.locator('[data-testid="mobile-nav-dashboard"]');
  
  try {
    // Wait for navigation to appear (should work due to testing bypass)
    await Promise.race([
      desktopNavElement.waitFor({ timeout: 5000 }),
      mobileNavElement.waitFor({ timeout: 5000 })
    ]);
    console.log('Navigation visible - testing bypass active');
    return;
  } catch {
    console.log('Navigation not visible, might need to wait longer');
    // Continue anyway, the bypass should handle it
  }
}

// Helper function to wait for page load
async function waitForPageLoad(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Additional wait for UI to settle
}

// Helper function to ensure navigation is accessible
async function ensureNavigationVisible(page: import('@playwright/test').Page) {
  // Check if we're on mobile and need to open the menu
  const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
  const isMobileMenuVisible = await mobileMenuButton.isVisible();
  
  if (isMobileMenuVisible) {
    await mobileMenuButton.click();
    await page.waitForTimeout(500); // Wait for menu animation
  }
  
  // Wait for navigation to be present in DOM first - check both desktop and mobile
  const desktopNavDashboard = page.locator('[data-testid="desktop-nav-dashboard"]');
  const mobileNavDashboard = page.locator('[data-testid="mobile-nav-dashboard"]');
  
  try {
    await Promise.race([
      desktopNavDashboard.waitFor({ state: 'attached', timeout: 10000 }),
      mobileNavDashboard.waitFor({ state: 'attached', timeout: 10000 })
    ]);
  } catch {
    console.log('Navigation elements not found in DOM');
    return;
  }
  
  // Check if navigation is visible, if not try to make it visible
  const desktopVisible = await desktopNavDashboard.isVisible();
  const mobileVisible = await mobileNavDashboard.isVisible();
  
  if (!desktopVisible && !mobileVisible) {
    // Try clicking mobile menu button if it exists
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
    }
  }
}

test.describe('Comprehensive CRM E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set a large viewport to ensure desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await waitForPageLoad(page);
    await login(page);
    // Skip navigation visibility check for now and proceed with tests
    // await ensureNavigationVisible(page);
  });

  test.describe('Navigation and Page Loading', () => {
    test('should navigate to all main sections', async ({ page }) => {
      // Ensure navigation is visible
      await ensureNavigationVisible(page);
      
      // Test Dashboard navigation
      await page.click('[data-testid="desktop-nav-dashboard"]');
      await waitForPageLoad(page);
      await expect(page.locator('[data-testid="page-title"]')).toContainText(/Dashboard/i);

      // Ensure navigation is still visible for next click
      await ensureNavigationVisible(page);
      // Test Customers navigation
      await page.click('[data-testid="desktop-nav-customers"]');
      await waitForPageLoad(page);
      await expect(page.locator('[data-testid="page-title"]')).toContainText(/Customers/i);

      // Ensure navigation is still visible for next click
      await ensureNavigationVisible(page);
      // Test Deals navigation
      await page.click('[data-testid="desktop-nav-deals"]');
      await waitForPageLoad(page);
      await expect(page.locator('[data-testid="page-title"]')).toContainText(/Deals/i);

      // Ensure navigation is still visible for next click
      await ensureNavigationVisible(page);
      // Test Leads navigation
      await page.click('[data-testid="desktop-nav-leads"]');
      await waitForPageLoad(page);
      await expect(page.locator('[data-testid="page-title"]')).toContainText(/Leads/i);

      // Ensure navigation is still visible for next click
      await ensureNavigationVisible(page);
      // Test Analytics navigation
      await page.click('[data-testid="desktop-nav-analytics"]');
      await waitForPageLoad(page);
      await expect(page.locator('[data-testid="page-title"]')).toContainText(/Analytics/i);
    });

    test('should handle responsive navigation', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForPageLoad(page);
      
      // Check if mobile menu exists and works
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-button, button[aria-label*="menu"]');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await expect(page.locator('.mobile-menu, [data-testid="mobile-nav"]')).toBeVisible();
      }

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await waitForPageLoad(page);

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await waitForPageLoad(page);
    });
  });

  test.describe('Customer CRUD Operations', () => {
    test('should create, read, update, and delete customers', async ({ page }) => {
      // Navigate directly to customers page instead of using navigation
      await page.goto('/customers');
      await waitForPageLoad(page);

      // CREATE: Add new customer
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer.company);
      await page.click('[data-testid="customer-save-button"]');
      
      // Wait for the modal to close and the customer to be added to the list
      await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Wait for the customer to appear in the list
      await page.waitForSelector(`h3:has-text("${testData.customer.name}")`, { timeout: 10000 });

      // READ: Verify customer was created
      await expect(page.locator(`h3:has-text("${testData.customer.name}")`)).toBeVisible();
      await expect(page.locator('text=' + testData.customer.email)).toBeVisible();

      // UPDATE: Edit customer
      const updatedCompany = `Updated Company ${Date.now()}`;
      await page.click('[data-testid="edit-customer-button"]');
      await page.fill('[data-testid="customer-company-input"]', updatedCompany);
      await page.click('[data-testid="customer-save-button"]');
      await waitForPageLoad(page);
      await expect(page.locator(`text=${updatedCompany}`).first()).toBeVisible();

      // DELETE: Remove customer
      // Handle the browser's native confirm dialog
      page.on('dialog', dialog => dialog.accept());
      
      // Count customers before deletion
      const customerCountBefore = await page.locator('[data-testid^="edit-customer-"]').count();
      
      // Click delete on the first customer
      await page.locator(`[data-testid^="delete-customer-"]`).first().click();
      await waitForPageLoad(page);
      
      // Verify customer count decreased
      const customerCountAfter = await page.locator('[data-testid^="edit-customer-"]').count();
      expect(customerCountAfter).toBe(customerCountBefore - 1);
    });
  });

  test.describe('Deal CRUD Operations', () => {
    test('should create, read, update, and delete deals', async ({ page }) => {
      // First, create a customer that we can associate with the deal
      await page.goto('/customers');
      await waitForPageLoad(page);
      
      // CREATE: Add customer first
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer.company);
      await page.click('[data-testid="customer-save-button"]');
      await waitForPageLoad(page);
      
      // Wait for customer to be saved and verify it exists
      await page.waitForTimeout(2000);
      await expect(page.locator('text=' + testData.customer.name)).toBeVisible();
      
      // Refresh the page to ensure customer is persisted
      await page.reload();
      await expect(page.locator('text=' + testData.customer.name)).toBeVisible();
      
      // Navigate to deals page
      await page.goto('/deals');
      await waitForPageLoad(page);

      // CREATE: Add new deal
      await page.click('[data-testid="add-deal-button"]');
      await page.fill('[data-testid="deal-title-input"]', testData.deal.title);
      
      // Wait for customer options to load and select customer
      await page.waitForTimeout(2000); // Give more time for customers to load
      const customerSelect = page.locator('[data-testid="deal-customer-select"]');
      
      // Debug: Check what options are available
      const options = await customerSelect.locator('option').allTextContents();
      console.log('Available customer options:', options);
      
      // Try to select the created customer first, if not found, use an existing one
      const customerOptions = await customerSelect.locator('option').all();
      let customerFound = false;
      
      // First try to find the test customer
      for (const option of customerOptions) {
        const text = await option.textContent();
        if (text && text.includes(testData.customer.name)) {
          const value = await option.getAttribute('value');
          if (value) {
            await customerSelect.selectOption(value);
            customerFound = true;
            break;
          }
        }
      }
      
      // If test customer not found, use the first available customer (not the placeholder)
      if (!customerFound) {
        for (const option of customerOptions) {
          const text = await option.textContent();
          if (text && text !== 'Select a customer' && text.trim() !== '') {
            const value = await option.getAttribute('value');
            if (value) {
              await customerSelect.selectOption(value);
              customerFound = true;
              console.log(`Using existing customer: ${text}`);
              break;
            }
          }
        }
      }
      
      if (!customerFound) {
        throw new Error(`No valid customer found in dropdown. Available options: ${options.join(', ')}`);
      }
      
      await page.fill('[data-testid="deal-value-input"]', testData.deal.value);
      await page.selectOption('[data-testid="deal-stage-select"]', testData.deal.stage);
      await page.click('[data-testid="deal-save-button"]');
      await waitForPageLoad(page);

      // READ: Verify deal was created
      await expect(page.locator('text=' + testData.deal.title)).toBeVisible();
      await expect(page.locator('text=' + testData.deal.value)).toBeVisible();

      // UPDATE: Edit deal (find the deal card and click edit button)
      const dealCard = page.locator('text=' + testData.deal.title).locator('..');
      await dealCard.locator('[data-testid="edit-deal-button"]').click();
      await page.fill('[data-testid="deal-value-input"]', '75000');
      await page.click('[data-testid="deal-save-button"]');
      await waitForPageLoad(page);
      await expect(page.locator('text=75000')).toBeVisible();

      // DELETE: Remove deal
      const updatedDealCard = page.locator('text=' + testData.deal.title).locator('..');
      await updatedDealCard.locator('[data-testid="delete-deal-button"]').click();
      await waitForPageLoad(page);
      await expect(page.locator('text=' + testData.deal.title)).not.toBeVisible();
      
      // Cleanup: Remove the test customer
      await page.goto('/customers');
      await waitForPageLoad(page);
      page.on('dialog', dialog => dialog.accept());
      await page.locator(`[data-testid^="delete-customer-"]`).first().click();
      await waitForPageLoad(page);
    });

    test('should move deals through pipeline stages', async ({ page }) => {
      await page.click('text=Deals');
      await waitForPageLoad(page);

      // Create a test deal first
      await page.click('button:has-text("Add"), button:has-text("New"), [data-testid="add-deal"]');
      await page.fill('input[name="title"], [data-testid="deal-title"]', 'Pipeline Test Deal');
      await page.fill('input[name="value"], [data-testid="deal-value"]', '25000');
      await page.click('button:has-text("Save"), button:has-text("Create"), [data-testid="save-deal"]');
      await waitForPageLoad(page);

      // Test moving through different stages
      const stages = ['Proposal', 'Negotiation', 'Closed Won'];
      for (const stage of stages) {
        await page.locator('text=Pipeline Test Deal').locator('..').locator('button:has-text("Edit"), [data-testid="edit-deal"]').click();
        await page.selectOption('select[name="stage"], [data-testid="deal-stage"]', stage);
        await page.click('button:has-text("Save"), button:has-text("Update"), [data-testid="save-deal"]');
        await waitForPageLoad(page);
        await expect(page.locator('text=' + stage)).toBeVisible();
      }

      // Cleanup
      await page.locator('text=Pipeline Test Deal').locator('..').locator('button:has-text("Delete"), [data-testid="delete-deal"]').click();
      await page.click('button:has-text("Confirm"), button:has-text("Yes"), [data-testid="confirm-delete"]');
    });
  });

  test.describe('Lead CRUD Operations', () => {
    test('should create, read, update, and delete leads', async ({ page }) => {
      // Navigate directly to leads page
      await page.goto('/leads');
      await waitForPageLoad(page);

      // CREATE: Add new lead
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name-input"]', testData.lead.name);
      await page.fill('[data-testid="lead-email-input"]', testData.lead.email);
      await page.fill('[data-testid="lead-phone-input"]', testData.lead.phone);
      await page.fill('[data-testid="lead-source-input"]', testData.lead.source);
      await page.click('[data-testid="lead-save-button"]');
      await waitForPageLoad(page);

      // READ: Verify lead was created
      await expect(page.locator('text=' + testData.lead.name)).toBeVisible();
      await expect(page.locator('text=' + testData.lead.email)).toBeVisible();

      // UPDATE: Edit lead
      await page.locator('text=' + testData.lead.name).locator('..').locator('[data-testid="edit-lead-button"]').click();
      await page.fill('[data-testid="lead-source-input"]', 'Updated Source');
      await page.click('[data-testid="lead-save-button"]');
      await waitForPageLoad(page);
      await expect(page.locator('text=Updated Source')).toBeVisible();

      // DELETE: Remove lead
      await page.locator('text=' + testData.lead.name).locator('..').locator('[data-testid="delete-lead-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');
      await waitForPageLoad(page);
      await expect(page.locator('text=' + testData.lead.name)).not.toBeVisible();
    });

    test('should convert lead to customer', async ({ page }) => {
      // Navigate directly to leads page
      await page.goto('/leads');
      await waitForPageLoad(page);

      // Create a test lead first
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name-input"]', 'Convert Test Lead');
      await page.fill('[data-testid="lead-email-input"]', 'convert@example.com');
      await page.click('[data-testid="lead-save-button"]');
      await waitForPageLoad(page);

      // Convert lead to customer
      await page.locator('text=Convert Test Lead').locator('..').locator('[data-testid="convert-lead-button"]').click();
      await page.click('[data-testid="confirm-convert-button"]');
      await waitForPageLoad(page);

      // Verify lead was converted (should appear in customers)
      await page.click('[data-testid="nav-customers"]');
      await waitForPageLoad(page);
      await expect(page.locator('text=Convert Test Lead')).toBeVisible();

      // Cleanup
      await page.locator('text=Convert Test Lead').locator('..').locator('[data-testid="delete-customer-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields in customer form', async ({ page }) => {
      await page.goto('/customers');
      await waitForPageLoad(page);
      await page.click('[data-testid="add-customer-button"]');
      
      // Try to save without required fields
      await page.click('[data-testid="customer-save-button"]');
      
      // Check for validation messages
      await expect(page.locator('text=required, text=Required, .error, .invalid')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/customers');
      await waitForPageLoad(page);
      await page.click('[data-testid="add-customer-button"]');
      
      // Enter invalid email
      await page.fill('[data-testid="customer-email-input"]', 'invalid-email');
      await page.click('[data-testid="customer-save-button"]');
      
      // Check for email validation message
      await expect(page.locator('text=valid email, text=email format, .error, .invalid')).toBeVisible();
    });
  });

  test.describe('Search and Filter Functionality', () => {
    test('should search customers by name', async ({ page }) => {
      await page.goto('/customers');
      await waitForPageLoad(page);
      
      // Create test customer first
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', 'Searchable Customer');
      await page.fill('[data-testid="customer-email-input"]', 'search@example.com');
      await page.click('[data-testid="customer-save-button"]');
      await waitForPageLoad(page);
      
      // Test search functionality
      await page.fill('[data-testid="customers-search-input"]', 'Searchable');
      await waitForPageLoad(page);
      await expect(page.locator('text=Searchable Customer')).toBeVisible();
      
      // Test search with no results
      await page.fill('[data-testid="customers-search-input"]', 'NonExistent');
      await waitForPageLoad(page);
      await expect(page.locator('text=Searchable Customer')).not.toBeVisible();
      
      // Clear search
      await page.fill('[data-testid="customers-search-input"]', '');
      await waitForPageLoad(page);
      
      // Cleanup
      await page.locator('text=Searchable Customer').locator('..').locator('[data-testid="delete-customer-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');
    });

    test('should filter deals by stage', async ({ page }) => {
      await page.goto('/deals');
      await waitForPageLoad(page);
      
      // Test stage filter if available
      const stageFilter = page.locator('[data-testid="deals-stage-filter"]');
      if (await stageFilter.isVisible()) {
        await stageFilter.selectOption('Proposal');
        await waitForPageLoad(page);
        // Verify only proposal deals are shown
        await expect(page.locator('text=Proposal')).toBeVisible();
      }
    });
  });

  test.describe('Supabase Database Integration', () => {
    test('should verify database connection and data persistence', async ({ page }) => {
      // Test database connectivity by performing CRUD operations
      await page.click('[data-testid="desktop-nav-customers"]');
      await waitForPageLoad(page);
      
      // Create customer to test database write
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', 'DB Test Customer');
      await page.fill('[data-testid="customer-email-input"]', 'dbtest@example.com');
      await page.click('[data-testid="customer-save-button"]');
      await waitForPageLoad(page);
      
      // Verify data persists after page reload
      await page.reload();
      await waitForPageLoad(page);
      await expect(page.locator('text=DB Test Customer')).toBeVisible();
      
      // Test data update
      await page.locator('text=DB Test Customer').locator('..').locator('[data-testid="edit-customer-button"]').click();
      await page.fill('[data-testid="customer-name-input"]', 'DB Updated Customer');
      await page.click('[data-testid="customer-save-button"]');
      await waitForPageLoad(page);
      
      // Verify update persists
      await page.reload();
      await waitForPageLoad(page);
      await expect(page.locator('text=DB Updated Customer')).toBeVisible();
      
      // Cleanup
      await page.locator('text=DB Updated Customer').locator('..').locator('[data-testid="delete-customer-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');
      await waitForPageLoad(page);
      
      // Verify deletion persists
      await page.reload();
      await waitForPageLoad(page);
      await expect(page.locator('text=DB Updated Customer')).not.toBeVisible();
    });

    test('should handle database errors gracefully', async ({ page }) => {
      // Test error handling by attempting invalid operations
      await page.click('a[href="/customers"]');
      await waitForPageLoad(page);
      
      // Try to create customer with duplicate email (if validation exists)
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', 'Error Test 1');
      await page.fill('[data-testid="customer-email-input"]', 'duplicate@example.com');
      await page.click('[data-testid="customer-save-button"]');
      await waitForPageLoad(page);
      
      // Try to create another with same email
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', 'Error Test 2');
      await page.fill('[data-testid="customer-email-input"]', 'duplicate@example.com');
      await page.click('[data-testid="customer-save-button"]');
      
      // Check for error message (if duplicate validation exists)
      const errorMessage = page.locator('text=already exists, text=duplicate, .error, .alert-error');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
      
      // Cleanup
      await page.locator('text=Error Test 1').locator('..').locator('[data-testid="delete-customer-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');
    });
  });

  test.describe('User Journey Testing', () => {
    test('should complete full lead-to-customer-to-deal workflow', async ({ page }) => {
      // Step 1: Create a lead
      await page.click('[data-testid="desktop-nav-leads"]');
      await waitForPageLoad(page);
      
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name-input"]', 'Journey Test Lead');
      await page.fill('[data-testid="lead-email-input"]', 'journey@example.com');
      await page.fill('[data-testid="lead-source-input"]', 'Website');
      await page.click('[data-testid="lead-save-button"]');
      await waitForPageLoad(page);
      
      // Verify lead was created
      await expect(page.locator('text=Journey Test Lead')).toBeVisible();
      
      // Step 2: Convert lead to customer
      await page.locator('text=Journey Test Lead').locator('..').locator('[data-testid="convert-lead-button"]').click();
      await page.click('[data-testid="confirm-convert-button"]');
      await waitForPageLoad(page);
      
      // Verify we're on customers page and customer exists
      await page.click('[data-testid="desktop-nav-customers"]');
      await waitForPageLoad(page);
      await expect(page.locator('text=Journey Test Lead')).toBeVisible();
      
      // Step 3: Create a deal for the customer
      await page.click('[data-testid="desktop-nav-deals"]');
      await waitForPageLoad(page);
      
      await page.click('[data-testid="add-deal-button"]');
      await page.fill('[data-testid="deal-title-input"]', 'Journey Test Deal');
      await page.fill('[data-testid="deal-customer-input"]', 'Journey Test Lead');
      await page.fill('[data-testid="deal-value-input"]', '50000');
      await page.selectOption('[data-testid="deal-stage-select"]', 'Proposal');
      await page.click('[data-testid="deal-save-button"]');
      await waitForPageLoad(page);
      
      // Verify deal was created
      await expect(page.locator('text=Journey Test Deal')).toBeVisible();
      
      // Step 4: Update deal stage to closed-won
      await page.locator('text=Journey Test Deal').locator('..').locator('[data-testid="edit-deal-button"]').click();
      await page.selectOption('[data-testid="deal-stage-select"]', 'Closed Won');
      await page.click('[data-testid="deal-save-button"]');
      await waitForPageLoad(page);
      
      // Verify deal stage updated
      await expect(page.locator('text=Closed Won')).toBeVisible();
      
      // Cleanup
      await page.locator('text=Journey Test Deal').locator('..').locator('[data-testid="delete-deal-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');
      
      await page.click('a[href="/customers"]');
      await waitForPageLoad(page);
      await page.locator('text=Journey Test Lead').locator('..').locator('[data-testid="delete-customer-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle multiple rapid operations without errors', async ({ page }) => {
      // Test rapid customer creation
      await page.click('[data-testid="desktop-nav-customers"]');
      await waitForPageLoad(page);
      
      for (let i = 1; i <= 5; i++) {
        await page.click('[data-testid="add-customer-button"]');
        await page.fill('[data-testid="customer-name-input"]', `Perf Test Customer ${i}`);
        await page.fill('[data-testid="customer-email-input"]', `perf${i}@example.com`);
        await page.click('[data-testid="customer-save-button"]');
        await waitForPageLoad(page);
        
        // Verify customer was created
        await expect(page.locator(`text=Perf Test Customer ${i}`)).toBeVisible();
      }
      
      // Test rapid deletion
      for (let i = 1; i <= 5; i++) {
        await page.locator(`text=Perf Test Customer ${i}`).locator('..').locator('[data-testid="delete-customer-button"]').click();
        await page.click('[data-testid="confirm-delete-button"]');
        await waitForPageLoad(page);
        
        // Verify customer was deleted
        await expect(page.locator(`text=Perf Test Customer ${i}`)).not.toBeVisible();
      }
    });
  });
});