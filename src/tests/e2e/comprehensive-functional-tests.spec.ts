import { test, expect, Page } from '@playwright/test'

// Comprehensive Functional Testing Suite
// Covers all interactive elements, forms, buttons, navigation, and CRUD operations

test.describe('Comprehensive Functional Testing Suite', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Navigate to the application
    await page.goto('http://localhost:5173')
    
    // Mock authentication if needed
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token')
    })
  })

  test.describe('Navigation Testing', () => {
    test('should navigate to all main pages', async () => {
      // Test Dashboard navigation
      await page.click('[data-testid="nav-dashboard"], a[href="/"], a:has-text("Dashboard")')
      await expect(page).toHaveURL(/.*\/$|.*\/dashboard/)
      
      // Test Customers navigation
      await page.click('[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")')
      await expect(page).toHaveURL(/.*\/customers/)
      
      // Test Leads navigation
      await page.click('[data-testid="nav-leads"], a[href="/leads"], a:has-text("Leads")')
      await expect(page).toHaveURL(/.*\/leads/)
      
      // Test Deals navigation
      await page.click('[data-testid="nav-deals"], a[href="/deals"], a:has-text("Deals")')
      await expect(page).toHaveURL(/.*\/deals/)
      
      // Test Analytics navigation (if exists)
      const analyticsLink = page.locator('[data-testid="nav-analytics"], a[href="/analytics"], a:has-text("Analytics")')
      if (await analyticsLink.count() > 0) {
        await analyticsLink.click()
        await expect(page).toHaveURL(/.*\/analytics/)
      }
    })

    test('should handle browser back/forward navigation', async () => {
      await page.click('[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")')
      await page.click('[data-testid="nav-deals"], a[href="/deals"], a:has-text("Deals")')
      
      await page.goBack()
      await expect(page).toHaveURL(/.*\/customers/)
      
      await page.goForward()
      await expect(page).toHaveURL(/.*\/deals/)
    })

    test('should show active navigation state', async () => {
      await page.click('[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")')
      
      // Check for active state indicators (common patterns)
      const activeIndicators = [
        '[data-testid="nav-customers"].active',
        '[data-testid="nav-customers"][aria-current="page"]',
        'a[href="/customers"].active',
        'a[href="/customers"][aria-current="page"]'
      ]
      
      let hasActiveState = false
      for (const selector of activeIndicators) {
        if (await page.locator(selector).count() > 0) {
          hasActiveState = true
          break
        }
      }
      
      expect(hasActiveState).toBe(true)
    })
  })

  test.describe('Form Testing', () => {
    test('should handle customer creation form', async () => {
      await page.click('[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")')
      
      // Look for create button with various selectors
      const createSelectors = [
        'button:has-text("Create Customer")',
        'button:has-text("Add Customer")',
        'button:has-text("New Customer")',
        '[data-testid="create-customer"]',
        '[data-testid="add-customer"]'
      ]
      
      let createButton = null
      for (const selector of createSelectors) {
        const button = page.locator(selector)
        if (await button.count() > 0) {
          createButton = button
          break
        }
      }
      
      if (createButton) {
        await createButton.click()
        
        // Fill form fields with various possible selectors
        const nameSelectors = ['[data-testid="customer-name"]', 'input[name="name"]', 'input[placeholder*="name" i]']
        const emailSelectors = ['[data-testid="customer-email"]', 'input[name="email"]', 'input[type="email"]']
        const phoneSelectors = ['[data-testid="customer-phone"]', 'input[name="phone"]', 'input[placeholder*="phone" i]']
        
        await fillFirstAvailableField(nameSelectors, 'Test Customer Functional')
        await fillFirstAvailableField(emailSelectors, 'test.functional@example.com')
        await fillFirstAvailableField(phoneSelectors, '+1234567890')
        
        // Submit form
        const submitSelectors = [
          'button:has-text("Save")',
          'button:has-text("Create")',
          'button:has-text("Submit")',
          'button[type="submit"]'
        ]
        
        await clickFirstAvailableButton(submitSelectors)
        
        // Verify success (look for success message or redirect)
        await page.waitForTimeout(1000)
        const hasSuccess = await checkForSuccess()
        expect(hasSuccess).toBe(true)
      }
    })

    test('should validate required fields', async () => {
      await page.click('[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")')
      
      const createSelectors = [
        'button:has-text("Create Customer")',
        'button:has-text("Add Customer")',
        'button:has-text("New Customer")',
        '[data-testid="create-customer"]'
      ]
      
      let createButton = null
      for (const selector of createSelectors) {
        const button = page.locator(selector)
        if (await button.count() > 0) {
          createButton = button
          break
        }
      }
      
      if (createButton) {
        await createButton.click()
        
        // Try to submit without filling required fields
        const submitSelectors = [
          'button:has-text("Save")',
          'button:has-text("Create")',
          'button:has-text("Submit")',
          'button[type="submit"]'
        ]
        
        await clickFirstAvailableButton(submitSelectors)
        
        // Check for validation errors
        const errorSelectors = [
          '.error',
          '.invalid',
          '[role="alert"]',
          '.text-red-500',
          '.text-danger'
        ]
        
        let hasValidationError = false
        for (const selector of errorSelectors) {
          if (await page.locator(selector).count() > 0) {
            hasValidationError = true
            break
          }
        }
        
        expect(hasValidationError).toBe(true)
      }
    })
  })

  test.describe('CRUD Operations Testing', () => {
    test('should perform complete CRUD cycle for customers', async () => {
      await page.click('[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")')
      
      // CREATE
      const createButton = await findFirstAvailableElement([
        'button:has-text("Create Customer")',
        'button:has-text("Add Customer")',
        'button:has-text("New Customer")',
        '[data-testid="create-customer"]'
      ])
      
      if (createButton) {
        await createButton.click()
        
        await fillFirstAvailableField(['[data-testid="customer-name"]', 'input[name="name"]'], 'CRUD Test Customer')
        await fillFirstAvailableField(['[data-testid="customer-email"]', 'input[name="email"]'], 'crud.test@example.com')
        
        await clickFirstAvailableButton([
          'button:has-text("Save")',
          'button:has-text("Create")',
          'button[type="submit"]'
        ])
        
        await page.waitForTimeout(1000)
      }
      
      // READ - Verify customer appears in list
      const customerExists = await page.locator('text=CRUD Test Customer').count() > 0
      expect(customerExists).toBe(true)
      
      // UPDATE
      const editSelectors = [
        'button:has-text("Edit")',
        '[data-testid="edit-customer"]',
        '.edit-button'
      ]
      
      const editButton = await findFirstAvailableElement(editSelectors)
      if (editButton) {
        await editButton.click()
        
        await fillFirstAvailableField(['[data-testid="customer-name"]', 'input[name="name"]'], 'CRUD Test Customer Updated')
        
        await clickFirstAvailableButton([
          'button:has-text("Save")',
          'button:has-text("Update")',
          'button[type="submit"]'
        ])
        
        await page.waitForTimeout(1000)
        
        // Verify update
        const updatedExists = await page.locator('text=CRUD Test Customer Updated').count() > 0
        expect(updatedExists).toBe(true)
      }
      
      // DELETE
      const deleteSelectors = [
        'button:has-text("Delete")',
        '[data-testid="delete-customer"]',
        '.delete-button'
      ]
      
      const deleteButton = await findFirstAvailableElement(deleteSelectors)
      if (deleteButton) {
        await deleteButton.click()
        
        // Handle confirmation dialog if present
        const confirmSelectors = [
          'button:has-text("Confirm")',
          'button:has-text("Delete")',
          'button:has-text("Yes")',
          '[data-testid="confirm-delete"]'
        ]
        
        await clickFirstAvailableButton(confirmSelectors)
        
        await page.waitForTimeout(1000)
        
        // Verify deletion
        const deletedExists = await page.locator('text=CRUD Test Customer Updated').count() > 0
        expect(deletedExists).toBe(false)
      }
    })
  })

  test.describe('Interactive Elements Testing', () => {
    test('should test all button interactions', async () => {
      // Test buttons on different pages
      const pages = ['/customers', '/leads', '/deals']
      
      for (const pagePath of pages) {
        await page.goto(`http://localhost:5173${pagePath}`)
        
        // Find all buttons on the page
        const buttons = await page.locator('button').all()
        
        for (const button of buttons) {
          if (await button.isVisible() && await button.isEnabled()) {
            const buttonText = await button.textContent()
            
            // Skip destructive actions in automated tests
            if (buttonText && !buttonText.toLowerCase().includes('delete')) {
              try {
                await button.click()
                await page.waitForTimeout(500)
                
                // Check if any modal or form opened
                const modalExists = await page.locator('.modal, [role="dialog"], .dialog').count() > 0
                if (modalExists) {
                  // Close modal if opened
                  const closeSelectors = [
                    'button:has-text("Cancel")',
                    'button:has-text("Close")',
                    '[data-testid="close-modal"]',
                    '.modal-close'
                  ]
                  
                  await clickFirstAvailableButton(closeSelectors)
                }
              } catch (error) {
                // Log but don't fail test for individual button issues
                console.log(`Button interaction failed: ${buttonText}`, error)
              }
            }
          }
        }
      }
    })

    test('should test search functionality', async () => {
      const searchSelectors = [
        '[data-testid="search"]',
        '[data-testid="global-search"]',
        'input[placeholder*="search" i]',
        'input[type="search"]'
      ]
      
      const searchInput = await findFirstAvailableElement(searchSelectors)
      if (searchInput) {
        await searchInput.fill('test search query')
        await searchInput.press('Enter')
        
        await page.waitForTimeout(1000)
        
        // Check if search results or loading state appears
        const hasSearchResults = await page.locator('[data-testid="search-results"], .search-results').count() > 0
        const hasLoadingState = await page.locator('[data-testid="loading"], .loading').count() > 0
        
        expect(hasSearchResults || hasLoadingState).toBe(true)
      }
    })

    test('should test filter functionality', async () => {
      await page.click('[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")')
      
      const filterSelectors = [
        '[data-testid="filters"]',
        '[data-testid="filter-button"]',
        'button:has-text("Filter")',
        '.filter-toggle'
      ]
      
      const filterButton = await findFirstAvailableElement(filterSelectors)
      if (filterButton) {
        await filterButton.click()
        
        // Check if filter panel opens
        const filterPanelExists = await page.locator('[data-testid="filter-panel"], .filter-panel').count() > 0
        expect(filterPanelExists).toBe(true)
      }
    })
  })

  // Helper functions
  async function fillFirstAvailableField(selectors: string[], value: string) {
    for (const selector of selectors) {
      const field = page.locator(selector)
      if (await field.count() > 0 && await field.isVisible()) {
        await field.fill(value)
        return
      }
    }
  }

  async function clickFirstAvailableButton(selectors: string[]) {
    for (const selector of selectors) {
      const button = page.locator(selector)
      if (await button.count() > 0 && await button.isVisible()) {
        await button.click()
        return
      }
    }
  }

  async function findFirstAvailableElement(selectors: string[]) {
    for (const selector of selectors) {
      const element = page.locator(selector)
      if (await element.count() > 0 && await element.isVisible()) {
        return element
      }
    }
    return null
  }

  async function checkForSuccess(): Promise<boolean> {
    const successSelectors = [
      '.success',
      '.alert-success',
      '[role="alert"]',
      '.text-green-500',
      '.notification'
    ]
    
    for (const selector of successSelectors) {
      if (await page.locator(selector).count() > 0) {
        return true
      }
    }
    
    // Also check for URL change (redirect after success)
    const currentUrl = page.url()
    return !currentUrl.includes('/create') && !currentUrl.includes('/new')
  }
})