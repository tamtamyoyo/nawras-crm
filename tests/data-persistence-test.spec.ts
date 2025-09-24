import { test, expect } from '@playwright/test';

// Test data for data persistence testing
const testData = {
  customer1: {
    name: `Persistence Customer 1 ${Date.now()}`,
    email: `persist1-${Date.now()}@example.com`,
    phone: '+1234567890',
    company: 'Persistence Test Company 1'
  },
  customer2: {
    name: `Persistence Customer 2 ${Date.now()}`,
    email: `persist2-${Date.now()}@example.com`,
    phone: '+1987654321',
    company: 'Persistence Test Company 2'
  },
  lead1: {
    name: `Persistence Lead 1 ${Date.now()}`,
    email: `lead1-${Date.now()}@example.com`,
    phone: '+1555666777',
    source: 'Website'
  },
  lead2: {
    name: `Persistence Lead 2 ${Date.now()}`,
    email: `lead2-${Date.now()}@example.com`,
    phone: '+1555888999',
    source: 'Referral'
  },
  deal1: {
    title: `Persistence Deal 1 ${Date.now()}`,
    value: '25000',
    stage: 'Proposal'
  },
  deal2: {
    title: `Persistence Deal 2 ${Date.now()}`,
    value: '50000',
    stage: 'Negotiation'
  }
};

// Helper function to wait for page load
async function waitForPageLoad(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Additional wait for UI to settle
}

// Helper function to wait for modal to close
async function waitForModalClose(page: import('@playwright/test').Page) {
  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10000 });
  await page.waitForTimeout(1000);
}

test.describe('Data Persistence and Erasure Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Customer Data Persistence', () => {
    test('should not erase existing customers when adding new ones', async ({ page }) => {
      await page.goto('/customers');
      await waitForPageLoad(page);

      // Step 1: Create first customer
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer1.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer1.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer1.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer1.company);
      await page.click('[data-testid="customer-save-button"]');
      
      await waitForModalClose(page);
      
      // Verify first customer exists
      await expect(page.locator(`text=${testData.customer1.name}`)).toBeVisible();
      console.log('✓ First customer created successfully');

      // Step 2: Create second customer
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer2.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer2.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer2.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer2.company);
      await page.click('[data-testid="customer-save-button"]');
      
      await waitForModalClose(page);
      
      // Critical test: Verify BOTH customers still exist
      await expect(page.locator(`text=${testData.customer1.name}`)).toBeVisible();
      await expect(page.locator(`text=${testData.customer2.name}`)).toBeVisible();
      console.log('✓ Both customers persist after second creation');

      // Step 3: Refresh page and verify persistence
      await page.reload();
      await waitForPageLoad(page);
      
      await expect(page.locator(`text=${testData.customer1.name}`)).toBeVisible();
      await expect(page.locator(`text=${testData.customer2.name}`)).toBeVisible();
      console.log('✓ Both customers persist after page reload');

      // Cleanup
      page.on('dialog', dialog => dialog.accept());
      const deleteButtons = await page.locator('[data-testid^="delete-customer-"]').all();
      for (const button of deleteButtons.slice(0, 2)) {
        await button.click();
        await waitForPageLoad(page);
      }
    });

    test('should maintain customer data during rapid operations', async ({ page }) => {
      await page.goto('/customers');
      await waitForPageLoad(page);

      // Create multiple customers rapidly
      const customers = [testData.customer1, testData.customer2];
      
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        await page.click('[data-testid="add-customer-button"]');
        await page.fill('[data-testid="customer-name-input"]', customer.name);
        await page.fill('[data-testid="customer-email-input"]', customer.email);
        await page.fill('[data-testid="customer-phone-input"]', customer.phone);
        await page.fill('[data-testid="customer-company-input"]', customer.company);
        await page.click('[data-testid="customer-save-button"]');
        
        await waitForModalClose(page);
        
        // Verify all previously created customers still exist
        for (let j = 0; j <= i; j++) {
          await expect(page.locator(`text=${customers[j].name}`)).toBeVisible();
        }
        console.log(`✓ Customer ${i + 1} created, all ${i + 1} customers visible`);
      }

      // Final verification
      for (const customer of customers) {
        await expect(page.locator(`text=${customer.name}`)).toBeVisible();
      }
      console.log('✓ All customers maintained during rapid operations');

      // Cleanup
      page.on('dialog', dialog => dialog.accept());
      const deleteButtons = await page.locator('[data-testid^="delete-customer-"]').all();
      for (const button of deleteButtons.slice(0, customers.length)) {
        await button.click();
        await waitForPageLoad(page);
      }
    });
  });

  test.describe('Lead Data Persistence', () => {
    test('should not erase existing leads when adding new ones', async ({ page }) => {
      await page.goto('/leads');
      await waitForPageLoad(page);

      // Step 1: Create first lead
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name-input"]', testData.lead1.name);
      await page.fill('[data-testid="lead-email-input"]', testData.lead1.email);
      await page.fill('[data-testid="lead-phone-input"]', testData.lead1.phone);
      await page.fill('[data-testid="lead-source-input"]', testData.lead1.source);
      await page.click('[data-testid="lead-save-button"]');
      
      await waitForModalClose(page);
      
      // Verify first lead exists
      await expect(page.locator(`text=${testData.lead1.name}`)).toBeVisible();
      console.log('✓ First lead created successfully');

      // Step 2: Create second lead
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name-input"]', testData.lead2.name);
      await page.fill('[data-testid="lead-email-input"]', testData.lead2.email);
      await page.fill('[data-testid="lead-phone-input"]', testData.lead2.phone);
      await page.fill('[data-testid="lead-source-input"]', testData.lead2.source);
      await page.click('[data-testid="lead-save-button"]');
      
      await waitForModalClose(page);
      
      // Critical test: Verify BOTH leads still exist
      await expect(page.locator(`text=${testData.lead1.name}`)).toBeVisible();
      await expect(page.locator(`text=${testData.lead2.name}`)).toBeVisible();
      console.log('✓ Both leads persist after second creation');

      // Step 3: Refresh page and verify persistence
      await page.reload();
      await waitForPageLoad(page);
      
      await expect(page.locator(`text=${testData.lead1.name}`)).toBeVisible();
      await expect(page.locator(`text=${testData.lead2.name}`)).toBeVisible();
      console.log('✓ Both leads persist after page reload');

      // Cleanup
      page.on('dialog', dialog => dialog.accept());
      const deleteButtons = await page.locator('[data-testid^="delete-lead-"]').all();
      for (const button of deleteButtons.slice(0, 2)) {
        await button.click();
        await waitForPageLoad(page);
      }
    });
  });

  test.describe('Deal Data Persistence', () => {
    test('should not erase existing deals when adding new ones', async ({ page }) => {
      // First create a customer for the deals
      await page.goto('/customers');
      await waitForPageLoad(page);
      
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer1.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer1.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer1.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer1.company);
      await page.click('[data-testid="customer-save-button"]');
      await waitForModalClose(page);

      // Navigate to deals
      await page.goto('/deals');
      await waitForPageLoad(page);

      // Step 1: Create first deal
      await page.click('[data-testid="add-deal-button"]');
      await page.fill('[data-testid="deal-title-input"]', testData.deal1.title);
      
      // Select customer
      const customerSelect = page.locator('[data-testid="deal-customer-select"]');
      await page.waitForTimeout(2000); // Wait for customers to load
      const customerOptions = await customerSelect.locator('option').all();
      for (const option of customerOptions) {
        const text = await option.textContent();
        if (text && text.includes(testData.customer1.name)) {
          const value = await option.getAttribute('value');
          if (value) {
            await customerSelect.selectOption(value);
            break;
          }
        }
      }
      
      await page.fill('[data-testid="deal-value-input"]', testData.deal1.value);
      await page.selectOption('[data-testid="deal-stage-select"]', testData.deal1.stage);
      await page.click('[data-testid="deal-save-button"]');
      
      await waitForModalClose(page);
      
      // Verify first deal exists
      await expect(page.locator(`text=${testData.deal1.title}`)).toBeVisible();
      console.log('✓ First deal created successfully');

      // Step 2: Create second deal
      await page.click('[data-testid="add-deal-button"]');
      await page.fill('[data-testid="deal-title-input"]', testData.deal2.title);
      
      // Select customer again
      await page.waitForTimeout(2000);
      const customerSelect2 = page.locator('[data-testid="deal-customer-select"]');
      const customerOptions2 = await customerSelect2.locator('option').all();
      for (const option of customerOptions2) {
        const text = await option.textContent();
        if (text && text.includes(testData.customer1.name)) {
          const value = await option.getAttribute('value');
          if (value) {
            await customerSelect2.selectOption(value);
            break;
          }
        }
      }
      
      await page.fill('[data-testid="deal-value-input"]', testData.deal2.value);
      await page.selectOption('[data-testid="deal-stage-select"]', testData.deal2.stage);
      await page.click('[data-testid="deal-save-button"]');
      
      await waitForModalClose(page);
      
      // Critical test: Verify BOTH deals still exist
      await expect(page.locator(`text=${testData.deal1.title}`)).toBeVisible();
      await expect(page.locator(`text=${testData.deal2.title}`)).toBeVisible();
      console.log('✓ Both deals persist after second creation');

      // Step 3: Refresh page and verify persistence
      await page.reload();
      await waitForPageLoad(page);
      
      await expect(page.locator(`text=${testData.deal1.title}`)).toBeVisible();
      await expect(page.locator(`text=${testData.deal2.title}`)).toBeVisible();
      console.log('✓ Both deals persist after page reload');

      // Cleanup deals
      page.on('dialog', dialog => dialog.accept());
      const deleteButtons = await page.locator('[data-testid^="delete-deal-"]').all();
      for (const button of deleteButtons.slice(0, 2)) {
        await button.click();
        await waitForPageLoad(page);
      }
      
      // Cleanup customer
      await page.goto('/customers');
      await waitForPageLoad(page);
      await page.locator(`text=${testData.customer1.name}`).locator('..').locator('[data-testid^="delete-customer-"]').click();
      await waitForPageLoad(page);
    });
  });

  test.describe('Cross-Module Data Integrity', () => {
    test('should maintain data integrity across all modules simultaneously', async ({ page }) => {
      // Create customer
      await page.goto('/customers');
      await waitForPageLoad(page);
      
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer1.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer1.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer1.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer1.company);
      await page.click('[data-testid="customer-save-button"]');
      await waitForModalClose(page);
      
      // Create lead
      await page.goto('/leads');
      await waitForPageLoad(page);
      
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name-input"]', testData.lead1.name);
      await page.fill('[data-testid="lead-email-input"]', testData.lead1.email);
      await page.fill('[data-testid="lead-phone-input"]', testData.lead1.phone);
      await page.fill('[data-testid="lead-source-input"]', testData.lead1.source);
      await page.click('[data-testid="lead-save-button"]');
      await waitForModalClose(page);
      
      // Create deal
      await page.goto('/deals');
      await waitForPageLoad(page);
      
      await page.click('[data-testid="add-deal-button"]');
      await page.fill('[data-testid="deal-title-input"]', testData.deal1.title);
      
      // Select customer
      const customerSelect = page.locator('[data-testid="deal-customer-select"]');
      await page.waitForTimeout(2000);
      const customerOptions = await customerSelect.locator('option').all();
      for (const option of customerOptions) {
        const text = await option.textContent();
        if (text && text.includes(testData.customer1.name)) {
          const value = await option.getAttribute('value');
          if (value) {
            await customerSelect.selectOption(value);
            break;
          }
        }
      }
      
      await page.fill('[data-testid="deal-value-input"]', testData.deal1.value);
      await page.selectOption('[data-testid="deal-stage-select"]', testData.deal1.stage);
      await page.click('[data-testid="deal-save-button"]');
      await waitForModalClose(page);
      
      // Verify all data exists across modules
      await page.goto('/customers');
      await waitForPageLoad(page);
      await expect(page.locator(`text=${testData.customer1.name}`)).toBeVisible();
      
      await page.goto('/leads');
      await waitForPageLoad(page);
      await expect(page.locator(`text=${testData.lead1.name}`)).toBeVisible();
      
      await page.goto('/deals');
      await waitForPageLoad(page);
      await expect(page.locator(`text=${testData.deal1.title}`)).toBeVisible();
      
      console.log('✓ All data maintained across modules');
      
      // Test adding new data to each module and verify others persist
      await page.goto('/customers');
      await waitForPageLoad(page);
      
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer2.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer2.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer2.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer2.company);
      await page.click('[data-testid="customer-save-button"]');
      await waitForModalClose(page);
      
      // Verify lead and deal still exist after adding new customer
      await page.goto('/leads');
      await waitForPageLoad(page);
      await expect(page.locator(`text=${testData.lead1.name}`)).toBeVisible();
      
      await page.goto('/deals');
      await waitForPageLoad(page);
      await expect(page.locator(`text=${testData.deal1.title}`)).toBeVisible();
      
      console.log('✓ Cross-module data integrity maintained');
      
      // Cleanup
      page.on('dialog', dialog => dialog.accept());
      
      // Clean deals first (they depend on customers)
      await page.goto('/deals');
      await waitForPageLoad(page);
      const dealDeleteButtons = await page.locator('[data-testid^="delete-deal-"]').all();
      for (const button of dealDeleteButtons.slice(0, 1)) {
        await button.click();
        await waitForPageLoad(page);
      }
      
      // Clean leads
      await page.goto('/leads');
      await waitForPageLoad(page);
      const leadDeleteButtons = await page.locator('[data-testid^="delete-lead-"]').all();
      for (const button of leadDeleteButtons.slice(0, 1)) {
        await button.click();
        await waitForPageLoad(page);
      }
      
      // Clean customers
      await page.goto('/customers');
      await waitForPageLoad(page);
      const customerDeleteButtons = await page.locator('[data-testid^="delete-customer-"]').all();
      for (const button of customerDeleteButtons.slice(0, 2)) {
        await button.click();
        await waitForPageLoad(page);
      }
    });
  });

  test.describe('Supabase Synchronization', () => {
    test('should verify real-time database synchronization', async ({ page }) => {
      await page.goto('/customers');
      await waitForPageLoad(page);
      
      // Create customer and verify immediate database sync
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name-input"]', testData.customer1.name);
      await page.fill('[data-testid="customer-email-input"]', testData.customer1.email);
      await page.fill('[data-testid="customer-phone-input"]', testData.customer1.phone);
      await page.fill('[data-testid="customer-company-input"]', testData.customer1.company);
      await page.click('[data-testid="customer-save-button"]');
      
      await waitForModalClose(page);
      
      // Verify data persists through multiple page reloads (database sync test)
      for (let i = 0; i < 3; i++) {
        await page.reload();
        await waitForPageLoad(page);
        await expect(page.locator(`text=${testData.customer1.name}`)).toBeVisible();
        console.log(`✓ Database sync verified - reload ${i + 1}`);
      }
      
      // Test update synchronization
      const updatedName = `${testData.customer1.name} Updated`;
      await page.locator(`text=${testData.customer1.name}`).locator('..').locator('[data-testid^="edit-customer-"]').click();
      await page.fill('[data-testid="customer-name-input"]', updatedName);
      await page.click('[data-testid="customer-save-button"]');
      await waitForModalClose(page);
      
      // Verify update persists
      await page.reload();
      await waitForPageLoad(page);
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
      console.log('✓ Update synchronization verified');
      
      // Cleanup
      page.on('dialog', dialog => dialog.accept());
      await page.locator(`text=${updatedName}`).locator('..').locator('[data-testid^="delete-customer-"]').click();
      await waitForPageLoad(page);
      
      // Verify deletion persists
      await page.reload();
      await waitForPageLoad(page);
      await expect(page.locator(`text=${updatedName}`)).not.toBeVisible();
      console.log('✓ Deletion synchronization verified');
    });
  });
});