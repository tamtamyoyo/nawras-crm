import { test, expect } from '@playwright/test';

test.describe('Debug Offline Mode Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Check offline mode detection and data flow', async ({ page }) => {
    console.log('🔍 Debugging offline mode detection');
    
    // Navigate to customers page
    await page.click('[data-testid="desktop-nav-customers"]');
    await page.waitForLoadState('networkidle');
    
    // Check if offline mode is detected
    const offlineModeResult = await page.evaluate(() => {
      // Check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const offlineEnv = import.meta.env.VITE_OFFLINE_MODE;
      
      return {
        supabaseUrl,
        supabaseKey: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined',
        offlineEnv,
        hasValidUrl: supabaseUrl && supabaseUrl !== 'your-supabase-url' && supabaseUrl.includes('supabase.co'),
        hasValidKey: supabaseKey && supabaseKey.length > 50 && supabaseKey.startsWith('eyJ')
      };
    });
    
    console.log('🔧 Environment check:', offlineModeResult);
    
    // Try to create a customer and monitor console logs
    await page.click('[data-testid="add-customer-button"]');
    await page.waitForSelector('[data-testid="customer-name-input"]');
    
    const testCustomer = {
      name: `Debug Customer ${Date.now()}`,
      email: `debug${Date.now()}@example.com`,
      phone: '555-0123',
      company: 'Debug Company'
    };
    
    await page.fill('[data-testid="customer-name-input"]', testCustomer.name);
    await page.fill('[data-testid="customer-email-input"]', testCustomer.email);
    await page.fill('[data-testid="customer-phone-input"]', testCustomer.phone);
    await page.fill('[data-testid="customer-company-input"]', testCustomer.company);
    
    // Listen for console logs during save
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('offline') || msg.text().includes('Supabase') || msg.text().includes('save'))) {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.click('[data-testid="customer-save-button"]');
    await page.waitForTimeout(3000);
    
    console.log('📝 Console logs during save:', consoleLogs);
    
    // Check if customer appears in the list
    const customerVisible = await page.locator('.hover\\:shadow-md').filter({ hasText: testCustomer.name }).isVisible();
    console.log('👀 Customer visible after save:', customerVisible);
    
    // Count total customers
    const customerCount = await page.locator('.hover\\:shadow-md').count();
    console.log('📊 Total customer cards:', customerCount);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-offline-mode.png', fullPage: true });
  });
});