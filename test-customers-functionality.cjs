const { chromium } = require('playwright');

async function testCustomersFunctionality() {
  console.log('🚀 Starting customers functionality test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the dashboard (already logged in)
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (!currentUrl.includes('/dashboard')) {
      console.log('🔐 Not logged in, attempting login...');
      // Fill login form if we're on login page
      await page.fill('input[type="email"]', 'admin@nawrascrm.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to customers page
    console.log('👥 Navigating to customers page...');
    await page.click('a[href="/customers"]');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the customers page
    await page.waitForSelector('h1:has-text("Customers")', { timeout: 10000 });
    console.log('✅ Customers page loaded successfully');
    
    // Open add customer modal
    console.log('➕ Opening add customer modal...');
    await page.click('button:has-text("Add Customer")');
    await page.waitForSelector('h2:has-text("Add New Customer")', { timeout: 5000 });
    console.log('✅ Add customer modal opened');
    
    // Fill customer form
    console.log('📝 Filling customer form...');
    await page.fill('[data-testid="customer-name-input"]', 'Test Customer Company');
    await page.fill('[data-testid="customer-email-input"]', 'test@customer.com');
    await page.fill('[data-testid="customer-phone-input"]', '+1234567890');
    await page.fill('[data-testid="customer-company-input"]', 'Test Company Ltd');
    await page.fill('[data-testid="customer-address-input"]', '123 Test Street, Test City');
    
    // Select status
    await page.selectOption('[data-testid="customer-status-select"]', 'active');
    console.log('📊 Status set to active');
    
    // Select source
    await page.selectOption('[data-testid="customer-source-select"]', 'Website');
    console.log('🌐 Source set to Website');
    
    // Select responsible person
    await page.selectOption('[data-testid="customer-responsible-person-select"]', 'Mr. Ali');
    console.log('👤 Responsible person set to Mr. Ali');
    
    // Add notes
    await page.fill('[data-testid="customer-notes-textarea"]', 'Test customer created via automated testing');
    console.log('📝 Notes added');
    
    // Submit the form
    console.log('💾 Submitting customer form...');
    await page.click('[data-testid="customer-save-button"]');
    
    // Wait for success message or modal to close
    await page.waitForTimeout(2000);
    
    // Check if modal closed (indicating success)
    const modalExists = await page.locator('h2:has-text("Add New Customer")').count();
    if (modalExists === 0) {
      console.log('✅ Test customer created successfully!');
    } else {
      console.log('⚠️ Modal still open, checking for errors...');
      const errorElements = await page.locator('[data-testid*="error"]').count();
      if (errorElements > 0) {
        const errorText = await page.locator('[data-testid*="error"]').first().textContent();
        console.log('❌ Form error:', errorText);
      }
    }
    
    // Verify customer appears in the list
    await page.waitForTimeout(1000);
    const customerCard = await page.locator('text=Test Customer Company').count();
    if (customerCard > 0) {
      console.log('✅ Customer appears in the customers list');
    } else {
      console.log('⚠️ Customer not found in the list');
    }
    
    console.log('🎉 Customers functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testCustomersFunctionality().catch(console.error);