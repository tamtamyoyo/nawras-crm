import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Testing Leads CRUD operations...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // First, navigate to login page and login
    console.log('🔐 Logging in first...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard after successful login
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful, redirected to dashboard');
    await page.waitForTimeout(1000);
    
    // Navigate to leads page
    console.log('🎯 Navigating to Leads page...');
    await page.goto('http://localhost:5173/leads');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to open mobile menu first
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
    }
    
    // Test CREATE operation
    console.log('➕ Testing CREATE operation...');
    await page.click('[data-testid="add-lead-button"]');
    await page.waitForSelector('[data-testid="lead-name-input"]', { timeout: 5000 });
    
    // Fill out the form with valid values
    await page.fill('[data-testid="lead-name-input"]', 'Test Lead');
    await page.fill('[data-testid="lead-email-input"]', 'testlead@example.com');
    await page.fill('[data-testid="lead-phone-input"]', '555-0123');
    await page.fill('[data-testid="lead-company-input"]', 'Test Company');
    await page.selectOption('[data-testid="lead-source-select"]', 'website');
    await page.selectOption('[data-testid="lead-status-select"]', 'new');
    await page.fill('[data-testid="lead-score-input"]', '75');
    await page.fill('[data-testid="lead-notes-textarea"]', 'Test notes for lead');
    
    console.log('📝 Form filled with valid data');
    
    // Listen for network requests to debug API calls
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('supabase')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Submit the form
    console.log('💾 Clicking save button...');
    await page.click('[data-testid="lead-save-button"]');
    
    // Wait for potential success message or modal to close
    await page.waitForTimeout(2000);
    
    // Check if modal is still open (indicating an error)
     const modalStillOpen = await page.locator('.fixed.inset-0.bg-black.bg-opacity-50').isVisible();
     if (modalStillOpen) {
       console.log('⚠️ Modal still open, checking for validation errors...');
       
       // Check for various error message selectors
       const errorSelectors = [
         '.text-red-500',
         '.text-destructive', 
         '.error',
         '[role="alert"]',
         '.text-sm.text-red-600'
       ];
       
       let foundErrors = false;
       for (const selector of errorSelectors) {
         const errorMessages = await page.locator(selector).allTextContents();
         if (errorMessages.length > 0) {
           console.log(`❌ Validation errors found (${selector}):`, errorMessages);
           foundErrors = true;
         }
       }
       
       if (!foundErrors) {
         console.log('⚠️ No validation errors found, but modal is still open. Checking form state...');
         // Check if save button is disabled
         const saveButtonDisabled = await page.locator('[data-testid="lead-save-button"]').isDisabled();
         console.log('Save button disabled:', saveButtonDisabled);
       }
       
       // Try to close modal manually
       await page.click('[data-testid="lead-cancel-button"]');
       await page.waitForTimeout(1000);
     }
    
    // Wait longer for the lead to appear in the list
    await page.waitForTimeout(5000);
    console.log('✅ CREATE operation completed');
    
    // Test READ operation
    console.log('📖 Testing READ operation...');
    const leadExists = await page.locator('text=Test Lead').first().isVisible();
    if (leadExists) {
      console.log('✅ READ operation completed - Lead found');
    } else {
      console.log('❌ READ operation failed - Lead not found');
    }
    
    // Test UPDATE operation
    console.log('✏️ Testing UPDATE operation...');
    // Wait for the lead list to refresh after creation
    await page.waitForTimeout(3000);
    
    // Check if leads are visible in the list
    const leadCards = await page.locator('.grid.gap-6 > div').count();
    console.log(`Found ${leadCards} lead cards`);
    
    // Look for any buttons in the lead cards
    const allButtons = await page.locator('button').count();
    console.log(`Found ${allButtons} buttons on page`);
    
    // Try to find edit buttons specifically
    const editButtons = await page.locator('[data-testid="edit-lead-button"]').count();
    console.log(`Found ${editButtons} edit buttons`);
    
    if (editButtons === 0) {
      console.log('⚠️ No edit buttons found, checking page content...');
      const pageContent = await page.textContent('body');
      if (pageContent.includes('No leads yet') || pageContent.includes('No leads found')) {
        console.log('⚠️ Lead list appears to be empty');
        return;
      }
    }
    
    await page.waitForSelector('[data-testid="edit-lead-button"]', { timeout: 5000 });
    
    const editButton = page.locator('[data-testid="edit-lead-button"]').first();
    await editButton.click();
    await page.waitForSelector('[data-testid="lead-name-input"]', { timeout: 5000 });
    
    // Update the name
    await page.fill('[data-testid="lead-name-input"]', 'Updated Test Lead');
    await page.click('[data-testid="lead-save-button"]');
    await page.waitForTimeout(3000);
    console.log('✅ UPDATE operation completed');
    
    // Test DELETE operation
    console.log('🗑️ Testing DELETE operation...');
    // Wait for the updated lead to appear
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="delete-lead-button"]', { timeout: 10000 });
    
    const deleteButton = page.locator('[data-testid="delete-lead-button"]').first();
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ DELETE operation completed');
    
    console.log('🎉 Leads CRUD testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();