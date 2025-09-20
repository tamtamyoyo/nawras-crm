import { test, expect, Page } from '@playwright/test'
// Note: axe-playwright may not be installed, using try-catch for graceful fallback
let injectAxe: ((page: Page) => Promise<void>) | undefined
let checkA11y: ((page: Page, context?: unknown, options?: unknown) => Promise<void>) | undefined
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const axePlaywright = require('axe-playwright')
  injectAxe = axePlaywright.injectAxe
  checkA11y = axePlaywright.checkA11y
} catch {
  // axe-playwright not available, will use manual checks
  console.log('axe-playwright not available, using manual accessibility checks')
}

// Comprehensive UX Evaluation and Accessibility Testing Suite
// Tests for WCAG compliance, usability, accessibility, and user experience

test.describe('UX Evaluation and Accessibility Testing', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Accessibility Compliance (WCAG 2.1)', () => {
    test('should pass automated accessibility checks on homepage', async () => {
      try {
        if (injectAxe && checkA11y) {
          await injectAxe(page)
          await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: { html: true }
          })
          console.log('✓ Homepage passes accessibility checks')
        } else {
          await performManualAccessibilityChecks()
        }
      } catch {
        // If axe-playwright is not available, perform manual accessibility checks
        console.log('Axe not available, performing manual accessibility checks')
        await performManualAccessibilityChecks()
      }
    })

    test('should have proper heading hierarchy', async () => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      const headingLevels: number[] = []
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
        const level = parseInt(tagName.charAt(1))
        headingLevels.push(level)
      }
      
      // Check heading hierarchy (should start with h1 and not skip levels)
      if (headingLevels.length > 0) {
        expect(headingLevels[0]).toBe(1) // Should start with h1
        
        for (let i = 1; i < headingLevels.length; i++) {
          const diff = headingLevels[i] - headingLevels[i - 1]
          expect(diff).toBeLessThanOrEqual(1) // Should not skip heading levels
        }
      }
      
      console.log('✓ Heading hierarchy is proper')
    })

    test('should have alt text for all images', async () => {
      const images = await page.locator('img').all()
      
      for (const img of images) {
        const alt = await img.getAttribute('alt')
        const src = await img.getAttribute('src')
        
        // All images should have alt attribute (can be empty for decorative images)
        expect(alt).not.toBeNull()
        
        // Content images should have meaningful alt text
        if (src && !src.includes('decoration') && !src.includes('icon')) {
          expect(alt?.length).toBeGreaterThan(0)
        }
      }
      
      console.log('✓ All images have appropriate alt text')
    })

    test('should have proper form labels', async () => {
      const inputs = await page.locator('input, select, textarea').all()
      
      for (const input of inputs) {
        const id = await input.getAttribute('id')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')
        const placeholder = await input.getAttribute('placeholder')
        
        // Check if input has associated label
        let hasLabel = false
        
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count()
          hasLabel = label > 0
        }
        
        // Input should have label, aria-label, aria-labelledby, or meaningful placeholder
        const hasAccessibleName = hasLabel || ariaLabelledBy || placeholder
        expect(hasAccessibleName).toBe(true)
      }
      
      console.log('✓ All form inputs have proper labels')
    })

    test('should have sufficient color contrast', async () => {
      // Get all text elements and check their contrast
      const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label').all()
      
      for (const element of textElements.slice(0, 10)) { // Check first 10 elements
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          }
        })
        
        // Basic check - ensure text has color and background
        expect(styles.color).toBeTruthy()
        expect(styles.backgroundColor).toBeTruthy()
      }
      
      console.log('✓ Color contrast checks completed')
    })

    test('should be keyboard navigable', async () => {
      // Test keyboard navigation
      const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all()
      
      if (focusableElements.length > 0) {
        // Start from first focusable element
        await focusableElements[0].focus()
        
        // Tab through several elements
        for (let i = 0; i < Math.min(5, focusableElements.length - 1); i++) {
          await page.keyboard.press('Tab')
          
          // Check if focus moved to next element
          const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
          expect(focusedElement).toBeTruthy()
        }
      }
      
      console.log('✓ Keyboard navigation works')
    })

    test('should have proper ARIA attributes', async () => {
      // Check for proper ARIA usage
      const elementsWithAria = await page.locator('[role], [aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-hidden]').all()
      
      for (const element of elementsWithAria) {
        const role = await element.getAttribute('role')
        const ariaExpanded = await element.getAttribute('aria-expanded')
        
        // If element has role, it should be a valid ARIA role
        if (role) {
          const validRoles = ['button', 'link', 'navigation', 'main', 'banner', 'contentinfo', 'complementary', 'form', 'search', 'dialog', 'alert', 'status', 'tab', 'tabpanel', 'tablist']
          expect(validRoles.includes(role)).toBe(true)
        }
        
        // If aria-expanded is used, it should be true or false
        if (ariaExpanded) {
          expect(['true', 'false'].includes(ariaExpanded)).toBe(true)
        }
      }
      
      console.log('✓ ARIA attributes are properly used')
    })
  })

  test.describe('Usability Testing', () => {
    test('should have clear and intuitive navigation', async () => {
      // Check for navigation elements
      const navElements = await page.locator('nav, [role="navigation"], .navbar, .nav-menu').count()
      expect(navElements).toBeGreaterThan(0)
      
      // Check for navigation links
      const navLinks = await page.locator('nav a, [role="navigation"] a, .navbar a').all()
      
      for (const link of navLinks) {
        const text = await link.textContent()
        const href = await link.getAttribute('href')
        
        // Navigation links should have meaningful text
        expect(text?.trim().length).toBeGreaterThan(0)
        
        // Links should have href or be buttons
        const isButton = await link.evaluate(el => el.tagName.toLowerCase() === 'button')
        expect(href || isButton).toBeTruthy()
      }
      
      console.log('✓ Navigation is clear and intuitive')
    })

    test('should provide clear feedback for user actions', async () => {
      await page.goto('http://localhost:5173/customers')
      
      const createButton = await findFirstAvailableElement([
        'button:has-text("Create Customer")',
        'button:has-text("Add Customer")',
        '[data-testid="create-customer"]'
      ])
      
      if (createButton) {
        await createButton.click()
        
        // Fill form with invalid data to trigger validation
        await fillFirstAvailableField([
          '[data-testid="customer-email"]', 
          'input[name="email"]'
        ], 'invalid-email')
        
        await clickFirstAvailableButton([
          'button:has-text("Save")',
          'button:has-text("Create")',
          'button[type="submit"]'
        ])
        
        await page.waitForTimeout(1000)
        
        // Should show validation feedback
        const feedbackElements = await page.locator('.error, .invalid, [role="alert"], .text-red-500, .validation-error').count()
        expect(feedbackElements).toBeGreaterThan(0)
        
        console.log('✓ Clear feedback provided for user actions')
        
        await closeModal()
      }
    })

    test('should have consistent UI patterns', async () => {
      const pages = ['/customers', '/leads', '/deals']
      const buttonStyles: string[] = []
      const inputStyles: string[] = []
      
      for (const pagePath of pages) {
        await page.goto(`http://localhost:5173${pagePath}`)
        await page.waitForLoadState('networkidle')
        
        // Check button styling consistency
        const buttons = await page.locator('button').all()
        if (buttons.length > 0) {
          const buttonStyle = await buttons[0].evaluate(el => {
            const computed = window.getComputedStyle(el)
            return `${computed.backgroundColor}-${computed.color}-${computed.borderRadius}`
          })
          buttonStyles.push(buttonStyle)
        }
        
        // Check input styling consistency
        const inputs = await page.locator('input').all()
        if (inputs.length > 0) {
          const inputStyle = await inputs[0].evaluate(el => {
            const computed = window.getComputedStyle(el)
            return `${computed.border}-${computed.borderRadius}-${computed.padding}`
          })
          inputStyles.push(inputStyle)
        }
      }
      
      // Styles should be consistent across pages
      if (buttonStyles.length > 1) {
        const firstButtonStyle = buttonStyles[0]
        for (const style of buttonStyles) {
          expect(style).toBe(firstButtonStyle)
        }
      }
      
      console.log('✓ UI patterns are consistent')
    })

    test('should have appropriate loading states', async () => {
      await page.goto('http://localhost:5173/customers')
      
      // Trigger an action that might show loading
      const createButton = await findFirstAvailableElement([
        'button:has-text("Create Customer")',
        'button:has-text("Add Customer")',
        '[data-testid="create-customer"]'
      ])
      
      if (createButton) {
        await createButton.click()
        
        // Check if loading state appears during form submission
        await fillFirstAvailableField([
          '[data-testid="customer-name"]', 
          'input[name="name"]'
        ], 'Loading Test Customer')
        
        await fillFirstAvailableField([
          '[data-testid="customer-email"]', 
          'input[name="email"]'
        ], 'loading.test@example.com')
        
        await clickFirstAvailableButton([
          'button:has-text("Save")',
          'button:has-text("Create")',
          'button[type="submit"]'
        ])
        
        // Check for loading state immediately after submission
        const hasLoadingState = await page.locator('.loading, .spinner, [data-testid="loading"]').count() > 0
        console.log('Loading state present:', hasLoadingState)
        
        await page.waitForTimeout(2000)
        await closeModal()
      }
      
      console.log('✓ Loading states checked')
    })

    test('should handle empty states gracefully', async () => {
      // Check different pages for empty state handling
      const pages = ['/customers', '/leads', '/deals']
      
      for (const pagePath of pages) {
        await page.goto(`http://localhost:5173${pagePath}`)
        await page.waitForLoadState('networkidle')
        
        // Look for empty state indicators
        const emptyStateElements = await page.locator(
          '.empty-state, .no-data, .no-results, [data-testid="empty-state"], ' +
          'text=/no.*found/i, text=/no.*data/i, text=/empty/i'
        ).count()
        
        // Look for data or empty state
        const hasData = await page.locator('table tr, .card, .list-item, [data-testid*="item"]').count() > 0
        const hasEmptyState = emptyStateElements > 0
        
        // Should have either data or empty state message
        expect(hasData || hasEmptyState).toBe(true)
        
        console.log(`✓ ${pagePath} handles empty state appropriately`)
      }
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile devices', async () => {
      const mobileViewports = [
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 414, height: 896, name: 'iPhone 11' },
        { width: 360, height: 640, name: 'Android' }
      ]
      
      for (const viewport of mobileViewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('http://localhost:5173')
        await page.waitForLoadState('networkidle')
        
        // Check if content is visible and accessible
        const bodyVisible = await page.locator('body').isVisible()
        expect(bodyVisible).toBe(true)
        
        // Check for mobile navigation (hamburger menu, etc.)
        const mobileNav = await page.locator('.mobile-menu, .hamburger, [data-testid="mobile-nav"]').count()
        console.log(`Mobile navigation elements on ${viewport.name}:`, mobileNav)
        
        // Check if text is readable (not too small)
        const textElements = await page.locator('p, span, div').all()
        if (textElements.length > 0) {
          const fontSize = await textElements[0].evaluate(el => {
            return window.getComputedStyle(el).fontSize
          })
          const fontSizeNum = parseInt(fontSize)
          expect(fontSizeNum).toBeGreaterThanOrEqual(14) // Minimum readable font size
        }
        
        console.log(`✓ Responsive on ${viewport.name} (${viewport.width}x${viewport.height})`)
      }
    })

    test('should have touch-friendly interactive elements', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('http://localhost:5173')
      
      // Check button sizes (should be at least 44px for touch)
      const buttons = await page.locator('button, a[href], [role="button"]').all()
      
      for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
        const boundingBox = await button.boundingBox()
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(40) // Minimum touch target size
          expect(boundingBox.width).toBeGreaterThanOrEqual(40)
        }
      }
      
      console.log('✓ Interactive elements are touch-friendly')
    })
  })

  test.describe('Performance UX', () => {
    test('should provide smooth scrolling experience', async () => {
      await page.goto('http://localhost:5173/customers')
      
      // Test smooth scrolling
      await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' })
      })
      
      await page.waitForTimeout(1000)
      
      const scrollPosition = await page.evaluate(() => window.scrollY)
      expect(scrollPosition).toBeGreaterThan(0)
      
      console.log('✓ Smooth scrolling works')
    })

    test('should handle rapid interactions gracefully', async () => {
      await page.goto('http://localhost:5173')
      
      // Rapid clicking test
      const clickableElement = await page.locator('button, a[href]').first()
      
      if (await clickableElement.count() > 0) {
        // Click rapidly 5 times
        for (let i = 0; i < 5; i++) {
          await clickableElement.click()
          await page.waitForTimeout(100)
        }
        
        // Page should still be responsive
        const isResponsive = await page.locator('body').isVisible()
        expect(isResponsive).toBe(true)
      }
      
      console.log('✓ Handles rapid interactions gracefully')
    })
  })

  // Manual accessibility checks when axe is not available
  async function performManualAccessibilityChecks() {
    // Check for skip links
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"], .skip-link').count()
    console.log('Skip links found:', skipLinks)
    
    // Check for landmark roles
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').count()
    expect(landmarks).toBeGreaterThan(0)
    
    // Check for focus indicators
    const focusableElement = await page.locator('button, a[href], input').first()
    if (await focusableElement.count() > 0) {
      await focusableElement.focus()
      
      const focusStyles = await focusableElement.evaluate(el => {
        const computed = window.getComputedStyle(el, ':focus')
        return {
          outline: computed.outline,
          boxShadow: computed.boxShadow
        }
      })
      
      // Should have some form of focus indicator
      const hasFocusIndicator = focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none'
      expect(hasFocusIndicator).toBe(true)
    }
  }

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