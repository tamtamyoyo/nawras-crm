import { test, expect } from '@playwright/test';

test.describe('Comprehensive CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('Customers CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Customers CRUD Operations');
    
    // Navigate directly to customers page
    await page.goto('http://localhost:5173/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial customers count: ${initialCount}`);
    
    const testCustomer = {
      name: 'Test Customer ' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      phone: '+1234567890',
      company: 'Test Company'
    };
    
    // CREATE - Add new customer
    console.log('📝 Creating new customer...');
    await page.getByTestId('add-customer-button').click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('customer-name-input').fill(testCustomer.name);
    await page.getByTestId('customer-email-input').fill(testCustomer.email);
    await page.getByTestId('customer-phone-input').fill(testCustomer.phone);
    await page.getByTestId('customer-company-input').fill(testCustomer.company);
    
    await page.getByTestId('customer-save-button').click();
    await page.waitForTimeout(3000);
    
    // Reload and verify creation
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const customerExists = await page.getByText(testCustomer.name).isVisible();
    expect(customerExists).toBeTruthy();
    console.log('✅ Customer created successfully');
    
    // UPDATE - Edit the customer
    console.log('✏️ Testing customer update...');
    
    // Find and click the customer row
    const customerRow = page.locator('tbody tr').filter({ hasText: testCustomer.name });
    await customerRow.click();
    await page.waitForTimeout(1000);
    
    // Click edit button
    await page.getByTestId('edit-customer-button').click();
    await page.waitForTimeout(1000);
    
    const updatedName = testCustomer.name + ' Updated';
    await page.getByTestId('customer-name-input').clear();
    await page.getByTestId('customer-name-input').fill(updatedName);
    await page.getByTestId('customer-save-button').click();
    await page.waitForTimeout(3000);
    
    // Reload and verify update
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const updatedCustomerExists = await page.getByText(updatedName).isVisible();
    expect(updatedCustomerExists).toBeTruthy();
    console.log('✅ Customer updated successfully');
    
    // DELETE - Remove the customer
    console.log('🗑️ Testing customer deletion...');
    
    // Find and click the updated customer row
    const updatedCustomerRow = page.locator('tbody tr').filter({ hasText: updatedName });
    await updatedCustomerRow.click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('delete-customer-button').click();
    await page.waitForTimeout(1000);
    
    // Confirm deletion if there's a confirmation dialog
    try {
      const confirmButton = page.getByTestId('confirm-delete-button');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    } catch (e) {
      console.log('No confirmation dialog found');
    }
    
    await page.waitForTimeout(3000);
    
    // Reload and verify deletion
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const deletedCustomerExists = await page.getByText(updatedName).isVisible();
    expect(deletedCustomerExists).toBeFalsy();
    console.log('✅ Customer deleted successfully');
  });

  test('Leads CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Leads CRUD Operations');
    
    // Navigate directly to leads page
    await page.goto('http://localhost:5173/leads');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial leads count: ${initialCount}`);
    
    const testLead = {
      name: 'Test Lead ' + Date.now(),
      email: 'testlead' + Date.now() + '@example.com',
      phone: '+1234567891',
      company: 'Test Lead Company'
    };
    
    // CREATE - Add new lead
    console.log('📝 Creating new lead...');
    await page.getByTestId('add-lead-button').click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('lead-name-input').fill(testLead.name);
    await page.getByTestId('lead-email-input').fill(testLead.email);
    await page.getByTestId('lead-phone-input').fill(testLead.phone);
    await page.getByTestId('lead-company-input').fill(testLead.company);
    
    await page.getByTestId('lead-save-button').click();
    await page.waitForTimeout(3000);
    
    // Reload and verify creation
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const leadExists = await page.getByText(testLead.name).isVisible();
    expect(leadExists).toBeTruthy();
    console.log('✅ Lead created successfully');
    
    // UPDATE - Edit the lead
    console.log('✏️ Testing lead update...');
    
    // Find and click the lead row
    const leadRow = page.locator('tbody tr').filter({ hasText: testLead.name });
    await leadRow.click();
    await page.waitForTimeout(1000);
    
    // Click edit button
    await page.getByTestId('edit-lead-button').click();
    await page.waitForTimeout(1000);
    
    const updatedLeadName = testLead.name + ' Updated';
    await page.getByTestId('lead-name-input').clear();
    await page.getByTestId('lead-name-input').fill(updatedLeadName);
    await page.getByTestId('lead-save-button').click();
    await page.waitForTimeout(3000);
    
    // Reload and verify update
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const updatedLeadExists = await page.getByText(updatedLeadName).isVisible();
    expect(updatedLeadExists).toBeTruthy();
    console.log('✅ Lead updated successfully');
    
    // DELETE - Remove the lead
    console.log('🗑️ Testing lead deletion...');
    
    // Find and click the updated lead row
    const updatedLeadRow = page.locator('tbody tr').filter({ hasText: updatedLeadName });
    await updatedLeadRow.click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('delete-lead-button').click();
    await page.waitForTimeout(1000);
    
    // Confirm deletion if there's a confirmation dialog
    try {
      const confirmButton = page.getByTestId('confirm-delete-button');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    } catch (e) {
      console.log('No confirmation dialog found');
    }
    
    await page.waitForTimeout(3000);
    
    // Reload and verify deletion
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const deletedLeadExists = await page.getByText(updatedLeadName).isVisible();
    expect(deletedLeadExists).toBeFalsy();
    console.log('✅ Lead deleted successfully');
  });

  test('Deals CRUD Operations', async ({ page }) => {
    console.log('🧪 Testing Deals CRUD Operations');
    
    // Navigate directly to deals page
    await page.goto('http://localhost:5173/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial deals count: ${initialCount}`);
    
    const testDeal = {
      title: 'Test Deal ' + Date.now(),
      value: '5000',
      description: 'Test deal description'
    };
    
    // CREATE - Add new deal
    console.log('📝 Creating new deal...');
    await page.getByTestId('add-deal-button').click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('deal-title-input').fill(testDeal.title);
    await page.getByTestId('deal-value-input').fill(testDeal.value);
    await page.getByTestId('deal-description-input').fill(testDeal.description);
    
    await page.getByTestId('deal-save-button').click();
    await page.waitForTimeout(3000);
    
    // Reload and verify creation
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dealExists = await page.getByText(testDeal.title).isVisible();
    expect(dealExists).toBeTruthy();
    console.log('✅ Deal created successfully');
    
    // UPDATE - Edit the deal
    console.log('✏️ Testing deal update...');
    
    // Find and click the deal row
    const dealRow = page.locator('tbody tr').filter({ hasText: testDeal.title });
    await dealRow.click();
    await page.waitForTimeout(1000);
    
    // Click edit button
    await page.getByTestId('edit-deal-button').click();
    await page.waitForTimeout(1000);
    
    const updatedDealTitle = testDeal.title + ' Updated';
    await page.getByTestId('deal-title-input').clear();
    await page.getByTestId('deal-title-input').fill(updatedDealTitle);
    await page.getByTestId('deal-save-button').click();
    await page.waitForTimeout(3000);
    
    // Reload and verify update
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const updatedDealExists = await page.getByText(updatedDealTitle).isVisible();
    expect(updatedDealExists).toBeTruthy();
    console.log('✅ Deal updated successfully');
    
    // DELETE - Remove the deal
    console.log('🗑️ Testing deal deletion...');
    
    // Find and click the updated deal row
    const updatedDealRow = page.locator('tbody tr').filter({ hasText: updatedDealTitle });
    await updatedDealRow.click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('delete-deal-button').click();
    await page.waitForTimeout(1000);
    
    // Confirm deletion if there's a confirmation dialog
    try {
      const confirmButton = page.getByTestId('confirm-delete-button');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    } catch (e) {
      console.log('No confirmation dialog found');
    }
    
    await page.waitForTimeout(3000);
    
    // Reload and verify deletion
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const deletedDealExists = await page.getByText(updatedDealTitle).isVisible();
    expect(deletedDealExists).toBeFalsy();
    console.log('✅ Deal deleted successfully');
  });

  test('Data Persistence Across Page Refreshes', async ({ page }) => {
    console.log('🧪 Testing Data Persistence Across Page Refreshes');
    
    // Test customers persistence
    await page.goto('http://localhost:5173/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const testCustomer = 'Persistence Test ' + Date.now();
    
    // Add a customer
    await page.getByTestId('add-customer-button').click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('customer-name-input').fill(testCustomer);
    await page.getByTestId('customer-email-input').fill(`persist${Date.now()}@example.com`);
    await page.getByTestId('customer-save-button').click();
    await page.waitForTimeout(3000);
    
    // Verify customer exists before refresh
    let customerExists = await page.getByText(testCustomer).isVisible();
    expect(customerExists).toBeTruthy();
    console.log('✅ Customer created before refresh');
    
    // Refresh the page multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      customerExists = await page.getByText(testCustomer).isVisible();
      expect(customerExists).toBeTruthy();
      console.log(`✅ Customer persists after refresh ${i + 1}`);
    }
    
    console.log('✅ Data persistence test completed successfully');
  });
});