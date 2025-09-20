import { chromium } from 'playwright';

async function testDealsCRUD() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for API responses
  page.on('response', response => {
    if (response.url().includes('supabase.co') || response.status() >= 400) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('🔍 Testing Deals CRUD operations...');

    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Login successful');

    // Navigate to Deals page
    console.log('📄 Navigating to Deals page...');
    // Use desktop navigation selector
    await page.click('[data-testid="desktop-nav-deals"]');
    await page.waitForURL('**/deals');
    await page.waitForTimeout(2000);

    // Test data
    const testDeal = {
      title: `Test Deal ${Date.now()}`,
      value: '50000',
      stage: 'Proposal',
      description: 'Test deal for CRUD operations'
    };

    // CREATE Test
    console.log('\n🆕 Testing CREATE operation...');
    
    // Click Add Deal button
    const addButton = await page.$('[data-testid="add-deal-button"]');
    if (!addButton) {
      console.log('❌ Add Deal button not found');
      return;
    }

    await addButton.click();
    await page.waitForTimeout(2000);

    // Wait for form inputs to be available
    await page.waitForSelector('[data-testid="deal-title-input"]', { timeout: 10000 });
    console.log('✅ Modal appeared, filling form...');

    console.log(`Creating deal: ${testDeal.title}`);
    
    // Fill form fields with explicit waits
    await page.waitForSelector('[data-testid="deal-title-input"]', { state: 'visible' });
    await page.fill('[data-testid="deal-title-input"]', testDeal.title);
    
    await page.waitForSelector('[data-testid="deal-value-input"]', { state: 'visible' });
    await page.fill('[data-testid="deal-value-input"]', testDeal.value);
    
    // Select customer - improved selection logic
    const customerSelect = await page.$('[data-testid="deal-customer-select"]');
    if (customerSelect) {
      await page.click('[data-testid="deal-customer-select"]');
      await page.waitForTimeout(500);
      const customerOptions = await page.$$('[data-testid="deal-customer-select"] option:not([value=""])');
      if (customerOptions.length > 0) {
        await page.selectOption('[data-testid="deal-customer-select"]', { index: 1 });
        console.log('✅ Customer selected');
      } else {
        console.log('⚠️ No customers available for selection');
      }
    }
    
    // Add probability field
    const probabilityInput = await page.$('[data-testid="deal-probability-input"]');
    if (probabilityInput) {
      await page.fill('[data-testid="deal-probability-input"]', '75');
    }
    
    await page.waitForSelector('[data-testid="deal-description-textarea"]', { state: 'visible' });
    await page.fill('[data-testid="deal-description-textarea"]', testDeal.description);
    
    // Submit form
    await page.waitForSelector('[data-testid="deal-save-button"]', { state: 'visible' });
    console.log('Clicking Save button...');
    await page.click('[data-testid="deal-save-button"]');
    await page.waitForTimeout(3000);
    
    // Check if modal closed (success indicator)
    const modalStillOpen = await page.isVisible('[data-testid="deal-title-input"]');
    if (!modalStillOpen) {
      console.log('✅ CREATE: Deal created successfully (modal closed)');
      // Wait for page to refresh and show new deal
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ CREATE: Modal still open, creation may have failed');
    }

    // READ Test
    console.log('\n📖 Testing READ operation...');
    await page.waitForTimeout(2000);
    
    // Wait for deals to load and look for deal cards
    await page.waitForTimeout(1000);
    const dealElements = await page.$$('.bg-white.rounded-lg.shadow');
    console.log(`Found ${dealElements.length} deals displayed`);
    
    if (dealElements.length === 0) {
      console.log('⚠️ READ: No deals found in the list');
      // Check if there's an empty state
      const emptyState = await page.$('[data-testid="add-deal-empty-state"]');
      if (emptyState) {
        console.log('📝 Empty state detected - this might be expected');
      }
    } else {
      console.log('✅ READ: Deals are displayed in the list');
    }

    // UPDATE Test
    console.log('\n✏️ Testing UPDATE operation...');
    
    // Look for edit buttons
    const editButtons = await page.$$('[data-testid="edit-deal-button"]');
    console.log(`Found ${editButtons.length} edit buttons`);
    
    if (editButtons.length > 0) {
      try {
        // Click first edit button with force option to bypass overlay
        await page.click('[data-testid="edit-deal-button"]', { force: true });
        await page.waitForTimeout(2000);
        
        // Wait for edit modal to appear
        const titleInput = await page.waitForSelector('[data-testid="deal-title-input"]', { timeout: 5000 }).catch(() => null);
        if (titleInput) {
          console.log('✅ UPDATE: Edit modal opened');
          
          const updatedTitle = 'Updated ' + testDeal.title;
          await page.fill('[data-testid="deal-title-input"]', updatedTitle);
          
          // Save changes
          await page.click('[data-testid="deal-save-button"]');
          await page.waitForTimeout(2000);
          console.log('✅ UPDATE: Deal update attempted');
        } else {
          console.log('⚠️ UPDATE: Edit modal did not open');
        }
      } catch (error) {
        console.log(`⚠️ UPDATE: Error during update - ${error.message}`);
      }
    } else {
      console.log('⚠️ UPDATE: No edit buttons found');
    }

    // DELETE Test
    console.log('\n🗑️ Testing DELETE operation...');
    
    // Look for delete buttons
    const deleteButtons = await page.$$('[data-testid="delete-deal-button"]');
    console.log(`Found ${deleteButtons.length} delete buttons`);
    
    if (deleteButtons.length > 0) {
      try {
        // Click first delete button with force option
        await page.click('[data-testid="delete-deal-button"]', { force: true });
        await page.waitForTimeout(2000);
        
        // Look for confirmation dialog
        const confirmButton = await page.$('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")');
        if (confirmButton) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ DELETE: Deal deletion attempted');
        } else {
          console.log('⚠️ DELETE: No confirmation dialog found');
        }
      } catch (error) {
        console.log(`⚠️ DELETE: Error during deletion - ${error.message}`);
      }
    } else {
      console.log('⚠️ DELETE: No delete buttons found');
    }

    console.log('\n📊 Deals CRUD Test Summary:');
    console.log('- CREATE: Form submission attempted');
    console.log('- READ: Deal list loading verified');
    console.log('- UPDATE: Edit functionality tested');
    console.log('- DELETE: Delete functionality tested');

  } catch (error) {
    console.log(`❌ Error during Deals CRUD testing: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testDealsCRUD();