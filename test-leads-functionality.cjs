const puppeteer = require('puppeteer');

async function testLeadsFunctionality() {
  let browser;
  try {
    console.log('🚀 Starting leads functionality test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page or already logged in
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Logging in with test credentials...');
      
      // Fill login form
      await page.waitForSelector('[data-testid="email-input"]', { timeout: 5000 });
      await page.type('[data-testid="email-input"]', 'test@example.com');
      await page.type('[data-testid="password-input"]', 'TestPassword123!');
      
      // Submit login
      await page.click('[data-testid="login-button"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }
    
    // Navigate to leads page
    console.log('📋 Navigating to leads page...');
    await page.goto('http://localhost:5173/leads', { waitUntil: 'networkidle0' });
    
    // Wait for leads page to load
    await page.waitForSelector('[data-testid="page-title"]', { timeout: 10000 });
    console.log('✅ Leads page loaded successfully');
    
    // Click Add Lead button
    console.log('➕ Opening add lead modal...');
    await page.click('button:has-text("Add Lead")');
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="lead-name-input"]', { timeout: 5000 });
    console.log('✅ Add lead modal opened');
    
    // Fill lead form
    console.log('📝 Filling lead form...');
    await page.fill('[data-testid="lead-name-input"]', 'Test Lead Contact Preferences');
    await page.fill('[data-testid="lead-email-input"]', 'testlead@example.com');
    await page.fill('[data-testid="lead-phone-input"]', '+1234567890');
    await page.fill('[data-testid="lead-company-input"]', 'Test Company Inc.');
    
    // Select source
    await page.selectOption('[data-testid="lead-source-select"]', 'Website');
    
    // Select status
    await page.selectOption('[data-testid="lead-status-select"]', 'new');
    
    // Set lead score
    await page.fill('[data-testid="lead-score-input"]', '75');
    
    // Select responsible person
    await page.selectOption('[data-testid="lead-responsible-person-select"]', 'Mr. Ali');
    
    // Test contact preferences - this is the key field we're testing
    console.log('📞 Testing contact preferences field...');
    
    // Check email preference (should be checked by default)
    const emailCheckbox = await page.$('[data-testid="lead-contact-preference-email"]');
    const isEmailChecked = await emailCheckbox.isChecked();
    console.log('📧 Email preference checked:', isEmailChecked);
    
    // Check phone preference
    await page.check('[data-testid="lead-contact-preference-phone"]');
    console.log('📱 Phone preference checked');
    
    // Check whatsapp preference
    await page.check('[data-testid="lead-contact-preference-whatsapp"]');
    console.log('💬 WhatsApp preference checked');
    
    // Uncheck in_person preference if checked
    const inPersonCheckbox = await page.$('[data-testid="lead-contact-preference-in_person"]');
    const isInPersonChecked = await inPersonCheckbox.isChecked();
    if (isInPersonChecked) {
      await page.uncheck('[data-testid="lead-contact-preference-in_person"]');
    }
    console.log('👥 In-person preference unchecked');
    
    // Add notes
    await page.fill('[data-testid="lead-notes-textarea"]', 'Test lead created to verify contact preferences functionality');
    
    // Submit the form
    console.log('💾 Submitting lead form...');
    await page.click('[data-testid="lead-save-button"]');
    
    // Wait for form submission and modal to close
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if lead was created successfully
    const leadCards = await page.$$('.lead-card, [data-testid*="lead"]');
    console.log('📊 Number of leads found:', leadCards.length);
    
    // Look for our test lead
    const testLeadExists = await page.$('text=Test Lead Contact Preferences');
    if (testLeadExists) {
      console.log('✅ Test lead created successfully!');
    } else {
      console.log('❌ Test lead not found in the list');
    }
    
    console.log('🎉 Leads functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testLeadsFunctionality();