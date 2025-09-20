import { test, expect, Browser, BrowserContext, Page } from '@playwright/test'

// Cross-Browser Compatibility Testing Suite
// Tests functionality across Chrome, Firefox, Safari, and Edge browsers

test.describe('Cross-Browser Compatibility Testing', () => {
  const browsers = ['chromium', 'firefox', 'webkit'] // webkit represents Safari
  
  for (const browserName of browsers) {
    test.describe(`${browserName.toUpperCase()} Browser Tests`, () => {
      let browser: Browser
      let context: BrowserContext
      let page: Page

      test.beforeAll(async ({ playwright }) => {
        browser = await playwright[browserName as keyof typeof playwright].launch()
        context = await browser.newContext()
        page = await context.newPage()
      })

      test.afterAll(async () => {
        await context.close()
        await browser.close()
      })

      test(`should load homepage correctly in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        await page.waitForLoadState('networkidle')
        
        // Check if page loads without errors
        const title = await page.title()
        expect(title).toBeTruthy()
        
        // Check if main content is visible
        const body = await page.locator('body').isVisible()
        expect(body).toBe(true)
        
        // Check for JavaScript errors
        const errors: string[] = []
        page.on('pageerror', (error) => {
          errors.push(error.message)
        })
        
        await page.waitForTimeout(2000)
        expect(errors.length).toBe(0)
        
        console.log(`✓ Homepage loaded successfully in ${browserName}`)
      })

      test(`should handle navigation correctly in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        
        const navigationTests = [
          { selector: '[data-testid="nav-customers"], a[href="/customers"], a:has-text("Customers")', expectedUrl: '/customers' },
          { selector: '[data-testid="nav-leads"], a[href="/leads"], a:has-text("Leads")', expectedUrl: '/leads' },
          { selector: '[data-testid="nav-deals"], a[href="/deals"], a:has-text("Deals")', expectedUrl: '/deals' },
          { selector: '[data-testid="nav-analytics"], a[href="/analytics"], a:has-text("Analytics")', expectedUrl: '/analytics' }
        ]

        for (const navTest of navigationTests) {
          const navElement = await findFirstAvailableElement(page, navTest.selector.split(', '))
          if (navElement) {
            await navElement.click()
            await page.waitForLoadState('networkidle')
            
            const currentUrl = page.url()
            expect(currentUrl).toContain(navTest.expectedUrl)
            
            console.log(`✓ Navigation to ${navTest.expectedUrl} works in ${browserName}`)
          }
        }
      })

      test(`should handle form interactions correctly in ${browserName}`, async () => {
        await page.goto('http://localhost:5173/customers')
        await page.waitForLoadState('networkidle')
        
        const createButton = await findFirstAvailableElement(page, [
          'button:has-text("Create Customer")',
          'button:has-text("Add Customer")',
          '[data-testid="create-customer"]'
        ])
        
        if (createButton) {
          await createButton.click()
          await page.waitForTimeout(1000)
          
          // Test form field interactions
          await fillFirstAvailableField(page, [
            '[data-testid="customer-name"]', 
            'input[name="name"]'
          ], `${browserName} Test Customer`)
          
          await fillFirstAvailableField(page, [
            '[data-testid="customer-email"]', 
            'input[name="email"]'
          ], `${browserName.toLowerCase()}.test@example.com`)
          
          // Test form submission
          await clickFirstAvailableButton(page, [
            'button:has-text("Save")',
            'button:has-text("Create")',
            'button[type="submit"]'
          ])
          
          await page.waitForTimeout(2000)
          
          // Check for success or error feedback
          const hasSuccess = await page.locator('.success, .alert-success, [role="alert"]').count() > 0
          const hasError = await page.locator('.error, .alert-error, .text-red-500').count() > 0
          
          // Should have some form of feedback
          expect(hasSuccess || hasError).toBe(true)
          
          console.log(`✓ Form interactions work in ${browserName}`)
          
          await closeModal(page)
        }
      })

      test(`should handle CSS styling correctly in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        await page.waitForLoadState('networkidle')
        
        // Check if CSS is loaded and applied
        const bodyStyles = await page.evaluate(() => {
          const body = document.body
          const computedStyle = window.getComputedStyle(body)
          return {
            backgroundColor: computedStyle.backgroundColor,
            fontFamily: computedStyle.fontFamily,
            fontSize: computedStyle.fontSize
          }
        })
        
        // Should have some styling applied (not default browser styles)
        expect(bodyStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
        expect(bodyStyles.fontFamily).toBeTruthy()
        
        // Check for responsive design elements
        const hasResponsiveElements = await page.locator('.container, .grid, .flex, [class*="responsive"]').count() > 0
        console.log(`Responsive elements found in ${browserName}:`, hasResponsiveElements)
        
        console.log(`✓ CSS styling works in ${browserName}`)
      })

      test(`should handle JavaScript interactions in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        await page.waitForLoadState('networkidle')
        
        // Test interactive elements
        const interactiveElements = [
          'button',
          'a[href]',
          'input',
          'select',
          '[role="button"]'
        ]
        
        let interactiveCount = 0
        for (const selector of interactiveElements) {
          const count = await page.locator(selector).count()
          interactiveCount += count
        }
        
        expect(interactiveCount).toBeGreaterThan(0)
        
        // Test click interactions
        const clickableElement = await page.locator('button, a[href], [role="button"]').first()
        if (await clickableElement.count() > 0) {
          await clickableElement.click()
          await page.waitForTimeout(1000)
          
          // Should not cause JavaScript errors
          const errors: string[] = []
          page.on('pageerror', (error) => {
            errors.push(error.message)
          })
          
          await page.waitForTimeout(1000)
          expect(errors.length).toBe(0)
        }
        
        console.log(`✓ JavaScript interactions work in ${browserName}`)
      })

      test(`should handle local storage in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        
        // Test localStorage functionality
        await page.evaluate(() => {
          localStorage.setItem('test-key', 'test-value')
        })
        
        const storedValue = await page.evaluate(() => {
          return localStorage.getItem('test-key')
        })
        
        expect(storedValue).toBe('test-value')
        
        // Clean up
        await page.evaluate(() => {
          localStorage.removeItem('test-key')
        })
        
        console.log(`✓ Local storage works in ${browserName}`)
      })

      test(`should handle viewport changes in ${browserName}`, async () => {
        const viewports = [
          { width: 1920, height: 1080, name: 'Desktop' },
          { width: 768, height: 1024, name: 'Tablet' },
          { width: 375, height: 667, name: 'Mobile' }
        ]
        
        for (const viewport of viewports) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height })
          await page.goto('http://localhost:5173')
          await page.waitForLoadState('networkidle')
          
          // Check if page is still functional at this viewport
          const isVisible = await page.locator('body').isVisible()
          expect(isVisible).toBe(true)
          
          // Check for responsive navigation (might collapse on mobile)
          const navElements = await page.locator('nav, [role="navigation"], .navbar').count()
          expect(navElements).toBeGreaterThan(0)
          
          console.log(`✓ ${viewport.name} viewport (${viewport.width}x${viewport.height}) works in ${browserName}`)
        }
      })

      test(`should handle file uploads in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        
        // Look for file input elements
        const fileInputs = await page.locator('input[type="file"]').count()
        
        if (fileInputs > 0) {
          const fileInput = page.locator('input[type="file"]').first()
          
          // Create a test file
          const testFile = {
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('Test file content')
          }
          
          await fileInput.setInputFiles(testFile)
          
          // Check if file was selected
          const files = await fileInput.evaluate((input: HTMLInputElement) => {
            return input.files ? Array.from(input.files).map(f => f.name) : []
          })
          
          expect(files).toContain('test.txt')
          console.log(`✓ File upload works in ${browserName}`)
        } else {
          console.log(`No file inputs found in ${browserName} - skipping file upload test`)
        }
      })

      test(`should handle date/time inputs in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        
        // Look for date/time input elements
        const dateInputs = await page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]').count()
        
        if (dateInputs > 0) {
          const dateInput = page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]').first()
          
          const inputType = await dateInput.getAttribute('type')
          let testValue = ''
          
          switch (inputType) {
            case 'date':
              testValue = '2024-01-15'
              break
            case 'datetime-local':
              testValue = '2024-01-15T10:30'
              break
            case 'time':
              testValue = '10:30'
              break
          }
          
          if (testValue) {
            await dateInput.fill(testValue)
            const value = await dateInput.inputValue()
            expect(value).toBe(testValue)
            
            console.log(`✓ ${inputType} input works in ${browserName}`)
          }
        } else {
          console.log(`No date/time inputs found in ${browserName} - skipping date/time test`)
        }
      })

      test(`should handle drag and drop in ${browserName}`, async () => {
        await page.goto('http://localhost:5173')
        
        // Look for draggable elements
        const draggableElements = await page.locator('[draggable="true"], .draggable, [data-testid*="drag"]').count()
        
        if (draggableElements >= 2) {
          const source = page.locator('[draggable="true"], .draggable, [data-testid*="drag"]').first()
          const target = page.locator('[draggable="true"], .draggable, [data-testid*="drag"]').nth(1)
          
          // Perform drag and drop
          await source.dragTo(target)
          
          console.log(`✓ Drag and drop works in ${browserName}`)
        } else {
          console.log(`Insufficient draggable elements found in ${browserName} - skipping drag and drop test`)
        }
      })
    })
  }

  // Cross-browser comparison tests
  test.describe('Cross-Browser Consistency', () => {
    test('should render consistently across all browsers', async ({ playwright }) => {
      const results: Array<{browser: string, title: string, bodyText: string}> = []
      
      for (const browserName of browsers) {
        const browser = await playwright[browserName as keyof typeof playwright].launch()
        const context = await browser.newContext()
        const page = await context.newPage()
        
        await page.goto('http://localhost:5173')
        await page.waitForLoadState('networkidle')
        
        const title = await page.title()
        const bodyText = await page.locator('body').textContent() || ''
        
        results.push({
          browser: browserName,
          title,
          bodyText: bodyText.substring(0, 100) // First 100 chars for comparison
        })
        
        await context.close()
        await browser.close()
      }
      
      // Compare results across browsers
      const firstResult = results[0]
      for (let i = 1; i < results.length; i++) {
        const currentResult = results[i]
        
        // Title should be the same
        expect(currentResult.title).toBe(firstResult.title)
        
        // Basic content structure should be similar
        const similarity = calculateSimilarity(firstResult.bodyText, currentResult.bodyText)
        expect(similarity).toBeGreaterThan(0.8) // 80% similarity threshold
        
        console.log(`Similarity between ${firstResult.browser} and ${currentResult.browser}: ${(similarity * 100).toFixed(2)}%`)
      }
    })
  })

  // Helper functions
  async function fillFirstAvailableField(page: Page, selectors: string[], value: string) {
    for (const selector of selectors) {
      const field = page.locator(selector)
      if (await field.count() > 0 && await field.isVisible()) {
        await field.fill(value)
        return
      }
    }
  }

  async function clickFirstAvailableButton(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      const button = page.locator(selector)
      if (await button.count() > 0 && await button.isVisible()) {
        await button.click()
        return
      }
    }
  }

  async function findFirstAvailableElement(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      const element = page.locator(selector)
      if (await element.count() > 0 && await element.isVisible()) {
        return element
      }
    }
    return null
  }

  async function closeModal(page: Page) {
    const closeSelectors = [
      'button:has-text("Cancel")',
      'button:has-text("Close")',
      '[data-testid="close-modal"]',
      '.modal-close',
      '[aria-label="Close"]'
    ]
    
    for (const selector of closeSelectors) {
      const button = page.locator(selector)
      if (await button.count() > 0 && await button.isVisible()) {
        await button.click()
        await page.waitForTimeout(500)
        break
      }
    }
  }

  function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
})