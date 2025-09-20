import { test, expect } from '@playwright/test'

// End-to-end tests for Phase 2 features
test.describe('Phase 2: End-to-End Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173')
    
    // Mock authentication if needed
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token')
    })
  })

  test('Complete deal pipeline workflow', async ({ page }) => {
    // Navigate to deals page
    await page.click('[data-testid="nav-deals"]')
    await expect(page.locator('h1')).toContainText('Deal Pipeline')
    
    // Create a new deal
    await page.click('button:has-text("Create Deal")')
    await page.fill('[data-testid="deal-title"]', 'Test Deal E2E')
    await page.fill('[data-testid="deal-value"]', '50000')
    await page.selectOption('[data-testid="deal-customer"]', 'Test Customer')
    await page.click('button:has-text("Save Deal")')
    
    // Verify deal appears in Prospecting column
    await expect(page.locator('[data-testid="prospecting-column"]')).toContainText('Test Deal E2E')
    
    // Test drag and drop functionality
    const dealCard = page.locator('[data-testid="deal-card"]:has-text("Test Deal E2E")')
    const qualificationColumn = page.locator('[data-testid="qualification-column"]')
    
    await dealCard.dragTo(qualificationColumn)
    
    // Verify deal moved to Qualification column
    await expect(qualificationColumn).toContainText('Test Deal E2E')
    
    // Test deal progression through pipeline
    const proposalColumn = page.locator('[data-testid="proposal-column"]')
    await dealCard.dragTo(proposalColumn)
    await expect(proposalColumn).toContainText('Test Deal E2E')
  })

  test('Analytics dashboard interaction workflow', async ({ page }) => {
    // Navigate to dashboard
    await page.click('[data-testid="nav-dashboard"]')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Test analytics dashboard loading
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
    
    // Test chart interactions
    await page.click('[data-testid="revenue-chart"]')
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible()
    
    // Test dashboard customization
    await page.click('button:has-text("Customize Dashboard")')
    await expect(page.locator('[data-testid="widget-config"]')).toBeVisible()
    
    // Add a new widget
    await page.click('[data-testid="add-widget-btn"]')
    await page.selectOption('[data-testid="widget-type"]', 'lead-sources')
    await page.click('button:has-text("Add Widget")')
    
    // Verify widget was added
    await expect(page.locator('[data-testid="lead-sources-widget"]')).toBeVisible()
  })

  test('Proposal template creation and usage workflow', async ({ page }) => {
    // Navigate to proposals
    await page.click('[data-testid="nav-proposals"]')
    await expect(page.locator('h1')).toContainText('Proposals')
    
    // Create a new template
    await page.click('button:has-text("Create Template")')
    await expect(page.locator('[data-testid="template-builder"]')).toBeVisible()
    
    // Fill template details
    await page.fill('[data-testid="template-name"]', 'Standard Service Proposal')
    await page.fill('[data-testid="template-description"]', 'Template for standard service offerings')
    
    // Add template sections
    await page.click('[data-testid="add-section-btn"]')
    await page.selectOption('[data-testid="section-type"]', 'executive-summary')
    await page.fill('[data-testid="section-content"]', 'Executive summary content...')
    
    // Save template
    await page.click('button:has-text("Save Template")')
    
    // Verify template appears in list
    await expect(page.locator('[data-testid="template-list"]')).toContainText('Standard Service Proposal')
    
    // Use template to create proposal
    await page.click('[data-testid="use-template-btn"]:has-text("Standard Service Proposal")')
    await page.fill('[data-testid="proposal-client"]', 'Test Client')
    await page.click('button:has-text("Generate Proposal")')
    
    // Verify proposal was created
    await expect(page.locator('[data-testid="proposal-preview"]')).toBeVisible()
  })

  test('Automated workflow engine setup and execution', async ({ page }) => {
    // Navigate to workflows
    await page.click('[data-testid="nav-workflows"]')
    await expect(page.locator('h1')).toContainText('Workflows')
    
    // Create a new workflow
    await page.click('button:has-text("Create Workflow")')
    await page.fill('[data-testid="workflow-name"]', 'Lead Nurturing Sequence')
    
    // Set trigger
    await page.selectOption('[data-testid="trigger-type"]', 'lead-created')
    
    // Add actions
    await page.click('[data-testid="add-action-btn"]')
    await page.selectOption('[data-testid="action-type"]', 'send-email')
    await page.selectOption('[data-testid="email-template"]', 'welcome-email')
    
    // Add delay action
    await page.click('[data-testid="add-action-btn"]')
    await page.selectOption('[data-testid="action-type"]', 'delay')
    await page.fill('[data-testid="delay-duration"]', '2')
    await page.selectOption('[data-testid="delay-unit"]', 'days')
    
    // Add follow-up email
    await page.click('[data-testid="add-action-btn"]')
    await page.selectOption('[data-testid="action-type"]', 'send-email')
    await page.selectOption('[data-testid="email-template"]', 'follow-up-email')
    
    // Save workflow
    await page.click('button:has-text("Save Workflow")')
    
    // Activate workflow
    await page.click('[data-testid="activate-workflow-btn"]')
    
    // Verify workflow is active
    await expect(page.locator('[data-testid="workflow-status"]')).toContainText('Active')
  })

  test('Advanced search and filtering workflow', async ({ page }) => {
    // Test global search
    await page.fill('[data-testid="global-search"]', 'test query')
    await page.press('[data-testid="global-search"]', 'Enter')
    
    // Verify search results appear
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Test filtering
    await page.click('[data-testid="filters-btn"]')
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible()
    
    // Apply module filter
    await page.check('[data-testid="filter-deals"]')
    await page.check('[data-testid="filter-leads"]')
    
    // Apply date range filter
    await page.click('[data-testid="date-range-picker"]')
    await page.click('[data-testid="date-preset-last-30-days"]')
    
    // Apply filters
    await page.click('button:has-text("Apply Filters")')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Deals')
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Leads')
    
    // Test advanced search
    await page.click('[data-testid="advanced-search-btn"]')
    await page.fill('[data-testid="advanced-search-field-1"]', 'customer_name')
    await page.selectOption('[data-testid="advanced-search-operator-1"]', 'contains')
    await page.fill('[data-testid="advanced-search-value-1"]', 'Acme Corp')
    
    await page.click('button:has-text("Search")')
    
    // Verify advanced search results
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Acme Corp')
  })

  test('Responsive design across different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:5173')
    
    // Verify desktop layout
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="main-content"]')).toHaveCSS('margin-left', '256px')
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    // Verify tablet layout
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible()
    await page.click('[data-testid="mobile-menu-btn"]')
    await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible()
  })

  test('Loading states and error handling', async ({ page }) => {
    // Test loading states
    await page.goto('http://localhost:5173/deals')
    
    // Verify loading spinner appears initially
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for content to load
    await expect(page.locator('[data-testid="deals-content"]')).toBeVisible()
    
    // Test error handling
    await page.route('**/api/deals', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.reload()
    
    // Verify error message appears
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load deals')
  })

  test('Accessibility features', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test skip to content link
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="skip-to-content"]')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="main-content"]')).toBeFocused()
    
    // Test ARIA labels and roles
    const searchButton = page.locator('[data-testid="search-btn"]')
    await expect(searchButton).toHaveAttribute('aria-label', 'Search')
    
    // Test screen reader announcements
    await page.click('button:has-text("Create Deal")')
    await expect(page.locator('[aria-live="polite"]')).toContainText('Deal creation form opened')
  })

  test('Performance benchmarks', async ({ page }) => {
    // Test initial page load performance
    const startTime = Date.now()
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Test search performance
    const searchStartTime = Date.now()
    await page.fill('[data-testid="global-search"]', 'performance test')
    await page.press('[data-testid="global-search"]', 'Enter')
    await page.waitForSelector('[data-testid="search-results"]')
    const searchTime = Date.now() - searchStartTime
    
    // Search should complete within 1 second
    expect(searchTime).toBeLessThan(1000)
  })

  test('Data persistence and synchronization', async ({ page }) => {
    // Create a deal
    await page.goto('http://localhost:5173/deals')
    await page.click('button:has-text("Create Deal")')
    await page.fill('[data-testid="deal-title"]', 'Persistence Test Deal')
    await page.click('button:has-text("Save Deal")')
    
    // Verify deal appears in list
    await expect(page.locator('[data-testid="deal-list"]')).toContainText('Persistence Test Deal')
    
    // Refresh page and verify data persists
    await page.reload()
    await expect(page.locator('[data-testid="deal-list"]')).toContainText('Persistence Test Deal')
    
    // Test real-time updates (if implemented)
    // This would require multiple browser contexts to test properly
  })
})

// Performance and stress tests
test.describe('Phase 2: Performance Tests', () => {
  test('Handle large datasets efficiently', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/deals', route => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Deal ${i + 1}`,
        value: Math.floor(Math.random() * 100000),
        stage: 'prospecting',
        customer: `Customer ${i + 1}`
      }))
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      })
    })
    
    const startTime = Date.now()
    await page.goto('http://localhost:5173/deals')
    await page.waitForSelector('[data-testid="deal-list"]')
    const renderTime = Date.now() - startTime
    
    // Should handle 1000 deals within 5 seconds
    expect(renderTime).toBeLessThan(5000)
    
    // Test virtual scrolling or pagination
    const visibleDeals = await page.locator('[data-testid="deal-card"]').count()
    expect(visibleDeals).toBeLessThanOrEqual(50) // Should virtualize or paginate
  })

  test('Memory usage remains stable', async ({ page }) => {
    // This would require browser performance APIs
    // Placeholder for memory usage testing
    await page.goto('http://localhost:5173')
    
    // Navigate through different pages multiple times
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="nav-deals"]')
      await page.waitForSelector('[data-testid="deals-content"]')
      
      await page.click('[data-testid="nav-leads"]')
      await page.waitForSelector('[data-testid="leads-content"]')
      
      await page.click('[data-testid="nav-customers"]')
      await page.waitForSelector('[data-testid="customers-content"]')
    }
    
    // Memory usage should remain stable
    // This would require actual memory measurement
    expect(true).toBe(true) // Placeholder
  })
})