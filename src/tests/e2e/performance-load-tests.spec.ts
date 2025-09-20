import { test, expect, Page } from '@playwright/test'

// Comprehensive Performance and Load Testing Suite
// Tests for page load times, memory usage, network performance, and stress testing

test.describe('Performance and Load Testing', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
  })

  test.describe('Page Load Performance', () => {
    test('should load main pages within acceptable time limits', async () => {
      const pages = [
        { url: 'http://localhost:5173', name: 'Home' },
        { url: 'http://localhost:5173/customers', name: 'Customers' },
        { url: 'http://localhost:5173/leads', name: 'Leads' },
        { url: 'http://localhost:5173/deals', name: 'Deals' },
        { url: 'http://localhost:5173/analytics', name: 'Analytics' }
      ]

      const performanceResults: Array<{page: string, loadTime: number, domContentLoaded: number}> = []

      for (const pageInfo of pages) {
        const startTime = Date.now()
        
        // Navigate and wait for load
        await page.goto(pageInfo.url, { waitUntil: 'networkidle' })
        const loadTime = Date.now() - startTime

        // Get performance metrics
        const performanceMetrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          }
        })

        performanceResults.push({
          page: pageInfo.name,
          loadTime,
          domContentLoaded: performanceMetrics.domContentLoaded
        })

        // Assert reasonable load times (adjust thresholds as needed)
        expect(loadTime).toBeLessThan(5000) // 5 seconds max
        expect(performanceMetrics.domContentLoaded).toBeLessThan(3000) // 3 seconds max for DOM
        
        console.log(`${pageInfo.name} - Load Time: ${loadTime}ms, DOM Ready: ${performanceMetrics.domContentLoaded}ms`)
      }

      // Log overall performance summary
      const avgLoadTime = performanceResults.reduce((sum, result) => sum + result.loadTime, 0) / performanceResults.length
      console.log(`Average page load time: ${avgLoadTime.toFixed(2)}ms`)
    })

    test('should have acceptable Core Web Vitals', async () => {
      await page.goto('http://localhost:5173')
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {
            LCP: 0, // Largest Contentful Paint
            FID: 0, // First Input Delay
            CLS: 0  // Cumulative Layout Shift
          }

          // Measure LCP
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            vitals.LCP = lastEntry.startTime
          }).observe({ entryTypes: ['largest-contentful-paint'] })

          // Measure CLS
          let clsValue = 0
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
              if (!layoutShiftEntry.hadRecentInput) {
                clsValue += layoutShiftEntry.value || 0
              }
            }
            vitals.CLS = clsValue
          }).observe({ entryTypes: ['layout-shift'] })

          // Simulate measurement completion after 3 seconds
          setTimeout(() => resolve(vitals), 3000)
        })
      })

      // Core Web Vitals thresholds (Google recommendations)
      expect(webVitals.LCP).toBeLessThan(2500) // LCP should be < 2.5s
      expect(webVitals.CLS).toBeLessThan(0.1)  // CLS should be < 0.1
      
      console.log('Core Web Vitals:', webVitals)
    })
  })

  test.describe('Memory Usage Testing', () => {
    test('should not have significant memory leaks during navigation', async () => {
      const initialMemory = await getMemoryUsage()
      
      // Navigate through multiple pages multiple times
      const routes = ['/customers', '/leads', '/deals', '/analytics', '/']
      
      for (let i = 0; i < 3; i++) {
        for (const route of routes) {
          await page.goto(`http://localhost:5173${route}`)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(500)
        }
      }

      // Force garbage collection if possible
      await page.evaluate(() => {
        const windowWithGc = window as Window & { gc?: () => void }
        if (windowWithGc.gc) {
          windowWithGc.gc()
        }
      })

      const finalMemory = await getMemoryUsage()
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100

      console.log(`Memory usage - Initial: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Memory usage - Final: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(2)}%)`)

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50)
    })

    test('should handle large datasets efficiently', async () => {
      await page.goto('http://localhost:5173/customers')
      
      const initialMemory = await getMemoryUsage()
      
      // Simulate loading large dataset by scrolling or pagination
      const hasInfiniteScroll = await page.locator('[data-testid="infinite-scroll"], .infinite-scroll').count() > 0
      const hasPagination = await page.locator('.pagination, [data-testid="pagination"]').count() > 0
      
      if (hasInfiniteScroll) {
        // Test infinite scroll performance
        for (let i = 0; i < 10; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
          await page.waitForTimeout(1000)
        }
      } else if (hasPagination) {
        // Test pagination performance
        const nextButtons = await page.locator('button:has-text("Next"), .pagination-next').count()
        for (let i = 0; i < Math.min(5, nextButtons); i++) {
          await page.click('button:has-text("Next"), .pagination-next')
          await page.waitForLoadState('networkidle')
        }
      }
      
      const finalMemory = await getMemoryUsage()
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      
      console.log(`Large dataset memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      
      // Should not consume excessive memory (less than 100MB increase)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    })
  })

  test.describe('Network Performance Testing', () => {
    test('should handle slow network conditions gracefully', async () => {
      // Simulate slow 3G network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
        await route.continue()
      })

      const startTime = Date.now()
      await page.goto('http://localhost:5173/customers')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime

      // Should still load within reasonable time even with network delay
      expect(loadTime).toBeLessThan(10000) // 10 seconds max with simulated delay
      
      // Should show loading states
      const hasLoadingIndicator = await page.locator('.loading, .spinner, [data-testid="loading"]').count() > 0
      console.log('Loading indicator present:', hasLoadingIndicator)
    })

    test('should optimize resource loading', async () => {
      const resourceSizes: Array<{url: string, size: number, type: string}> = []
      
      page.on('response', async (response) => {
        const url = response.url()
        const headers = response.headers()
        const contentLength = headers['content-length']
        
        if (contentLength) {
          resourceSizes.push({
            url,
            size: parseInt(contentLength),
            type: response.request().resourceType()
          })
        }
      })

      await page.goto('http://localhost:5173')
      await page.waitForLoadState('networkidle')

      // Analyze resource sizes
      const totalSize = resourceSizes.reduce((sum, resource) => sum + resource.size, 0)
      const jsSize = resourceSizes.filter(r => r.type === 'script').reduce((sum, r) => sum + r.size, 0)
      const cssSize = resourceSizes.filter(r => r.type === 'stylesheet').reduce((sum, r) => sum + r.size, 0)
      const imageSize = resourceSizes.filter(r => r.type === 'image').reduce((sum, r) => sum + r.size, 0)

      console.log(`Total page size: ${(totalSize / 1024).toFixed(2)}KB`)
      console.log(`JavaScript size: ${(jsSize / 1024).toFixed(2)}KB`)
      console.log(`CSS size: ${(cssSize / 1024).toFixed(2)}KB`)
      console.log(`Images size: ${(imageSize / 1024).toFixed(2)}KB`)

      // Assert reasonable resource sizes
      expect(totalSize).toBeLessThan(5 * 1024 * 1024) // Total < 5MB
      expect(jsSize).toBeLessThan(2 * 1024 * 1024)     // JS < 2MB
      expect(cssSize).toBeLessThan(500 * 1024)         // CSS < 500KB
    })
  })

  test.describe('Stress Testing', () => {
    test('should handle rapid user interactions', async () => {
      await page.goto('http://localhost:5173/customers')
      
      // Rapid clicking and navigation
      const actions = [
        () => page.click('[data-testid="nav-customers"], a[href="/customers"]').catch(() => {}),
        () => page.click('[data-testid="nav-leads"], a[href="/leads"]').catch(() => {}),
        () => page.click('[data-testid="nav-deals"], a[href="/deals"]').catch(() => {}),
        () => page.click('[data-testid="nav-analytics"], a[href="/analytics"]').catch(() => {})
      ]

      // Perform rapid actions
      for (let i = 0; i < 20; i++) {
        const randomAction = actions[Math.floor(Math.random() * actions.length)]
        await randomAction()
        await page.waitForTimeout(50) // Very short delay
      }

      // Should still be responsive
      await page.waitForLoadState('networkidle')
      const isResponsive = await page.locator('body').isVisible()
      expect(isResponsive).toBe(true)
    })

    test('should handle multiple form submissions', async () => {
      await page.goto('http://localhost:5173/customers')
      
      const createButton = await findFirstAvailableElement([
        'button:has-text("Create Customer")',
        'button:has-text("Add Customer")',
        '[data-testid="create-customer"]'
      ])
      
      if (createButton) {
        // Try to create multiple customers rapidly
        for (let i = 0; i < 5; i++) {
          await createButton.click()
          
          await fillFirstAvailableField([
            '[data-testid="customer-name"]', 
            'input[name="name"]'
          ], `Stress Test Customer ${i}`)
          
          await fillFirstAvailableField([
            '[data-testid="customer-email"]', 
            'input[name="email"]'
          ], `stress${i}@test.com`)
          
          await clickFirstAvailableButton([
            'button:has-text("Save")',
            'button:has-text("Create")',
            'button[type="submit"]'
          ])
          
          await page.waitForTimeout(500)
          
          // Close any success messages or modals
          await closeModal()
        }
        
        // Application should still be functional
        const isStillWorking = await page.locator('body').isVisible()
        expect(isStillWorking).toBe(true)
      }
    })
  })

  test.describe('Database Performance Testing', () => {
    test('should handle concurrent database operations', async () => {
      await page.goto('http://localhost:5173/customers')
      
      // Simulate concurrent operations by opening multiple tabs/contexts
      const context = page.context()
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ])
      
      // Navigate all pages to customers
      await Promise.all(pages.map(p => p.goto('http://localhost:5173/customers')))
      
      // Perform operations concurrently
      const operations = pages.map(async (p, index) => {
        const createButton = await findFirstAvailableElementOnPage(p, [
          'button:has-text("Create Customer")',
          'button:has-text("Add Customer")',
          '[data-testid="create-customer"]'
        ])
        
        if (createButton) {
          await createButton.click()
          
          await fillFirstAvailableFieldOnPage(p, [
            '[data-testid="customer-name"]', 
            'input[name="name"]'
          ], `Concurrent Customer ${index}`)
          
          await fillFirstAvailableFieldOnPage(p, [
            '[data-testid="customer-email"]', 
            'input[name="email"]'
          ], `concurrent${index}@test.com`)
          
          await clickFirstAvailableButtonOnPage(p, [
            'button:has-text("Save")',
            'button:has-text("Create")',
            'button[type="submit"]'
          ])
        }
      })
      
      // Wait for all operations to complete
      await Promise.all(operations)
      
      // Clean up
      await Promise.all(pages.map(p => p.close()))
      
      // Main page should still be functional
      const isMainPageWorking = await page.locator('body').isVisible()
      expect(isMainPageWorking).toBe(true)
    })
  })

  // Helper functions
  async function getMemoryUsage() {
    return await page.evaluate(() => {
      const performanceWithMemory = performance as Performance & {
        memory?: {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }
      }
      return performanceWithMemory.memory || {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      }
    })
  }

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

  async function fillFirstAvailableFieldOnPage(page: Page, selectors: string[], value: string) {
    for (const selector of selectors) {
      const field = page.locator(selector)
      if (await field.count() > 0 && await field.isVisible()) {
        await field.fill(value)
        return
      }
    }
  }

  async function clickFirstAvailableButtonOnPage(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      const button = page.locator(selector)
      if (await button.count() > 0 && await button.isVisible()) {
        await button.click()
        return
      }
    }
  }

  async function findFirstAvailableElementOnPage(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      const element = page.locator(selector)
      if (await element.count() > 0 && await element.isVisible()) {
        return element
      }
    }
    return null
  }

  async function closeModal() {
    const closeSelectors = [
      'button:has-text("Cancel")',
      'button:has-text("Close")',
      '[data-testid="close-modal"]',
      '.modal-close',
      '[aria-label="Close"]'
    ]
    
    await clickFirstAvailableButton(closeSelectors)
    await page.waitForTimeout(500)
  }
})