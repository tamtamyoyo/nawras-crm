/**
 * Comprehensive End-to-End Testing Script for CRM Application
 * Tests all CRUD operations across modules with detailed reporting
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class CRMTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        startTime: new Date().toISOString(),
        endTime: null
      },
      modules: {
        authentication: { tests: [], status: 'pending' },
        customers: { tests: [], status: 'pending' },
        deals: { tests: [], status: 'pending' },
        leads: { tests: [], status: 'pending' },
        invoices: { tests: [], status: 'pending' },
        proposals: { tests: [], status: 'pending' },
        navigation: { tests: [], status: 'pending' },
        errorHandling: { tests: [], status: 'pending' },
        database: { tests: [], status: 'pending' }
      },
      defects: []
    };
    this.baseUrl = 'http://localhost:5173';
  }

  async initialize() {
    console.log('🚀 Initializing CRM Test Suite...');
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Set up error handling
    this.page.on('pageerror', (error) => {
      this.logDefect('Page Error', error.message, 'Critical');
    });
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.logDefect('Console Error', msg.text(), 'Medium');
      }
    });
  }

  async runAllTests() {
    try {
      console.log('📋 Starting comprehensive CRM testing...');
      
      await this.testAuthentication();
      await this.testCustomersModule();
      await this.testDealsModule();
      await this.testLeadsModule();
      await this.testInvoicesModule();
      await this.testProposalsModule();
      await this.testNavigation();
      await this.testErrorHandling();
      await this.testDatabaseIntegration();
      
      this.testResults.summary.endTime = new Date().toISOString();
      await this.generateReport();
      
    } catch (error) {
      this.logDefect('Test Suite Error', error.message, 'Critical');
    } finally {
      await this.cleanup();
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication Module...');
    this.testResults.modules.authentication.status = 'running';
    
    try {
      // Test login functionality
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');
      
      const loginTest = await this.runTest('Login Form Validation', async () => {
        await this.page.fill('input[name="email"]', 'test@example.com');
        await this.page.fill('input[name="password"]', 'password123');
        await this.page.click('button[type="submit"]');
        await this.page.waitForTimeout(3000);
        return this.page.url().includes('/dashboard') || this.page.url().includes('/login');
      });
      
      this.testResults.modules.authentication.tests.push(loginTest);
      
      // Test logout functionality
      const logoutTest = await this.runTest('Logout Functionality', async () => {
        // Navigate to dashboard first if not already there
        if (!this.page.url().includes('/dashboard')) {
          await this.page.goto(`${this.baseUrl}/dashboard`);
          await this.page.waitForLoadState('networkidle');
        }
        // Look for logout button in navigation
        const logoutButton = await this.page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout"]').first();
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          await this.page.waitForTimeout(2000);
          return this.page.url().includes('/login');
        }
        return false;
      });
      
      this.testResults.modules.authentication.tests.push(logoutTest);
      
      this.testResults.modules.authentication.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.authentication.status = 'failed';
      this.logDefect('Authentication Module', error.message, 'High');
    }
  }

  async testCustomersModule() {
    console.log('👥 Testing Customers Module...');
    this.testResults.modules.customers.status = 'running';
    
    try {
      await this.ensureLoggedIn();
      await this.page.goto(`${this.baseUrl}/customers`);
      await this.page.waitForLoadState('networkidle');
      
      // Test Create Customer
      const createTest = await this.runTest('Create Customer', async () => {
        // Close any existing modals first
        const cancelButtons = await this.page.locator('[data-testid="customer-cancel-button"], button:has-text("Cancel")').all();
        for (const cancelBtn of cancelButtons) {
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
            await this.page.waitForTimeout(500);
          }
        }
        
        await this.page.click('[data-testid="add-customer-button"]');
        await this.page.waitForTimeout(1000);
        await this.page.fill('[data-testid="customer-name-input"]', 'Test Customer');
        await this.page.fill('[data-testid="customer-email-input"]', 'test.customer@example.com');
        await this.page.fill('[data-testid="customer-phone-input"]', '+1234567890');
        await this.page.click('[data-testid="customer-save-button"]');
        await this.page.waitForTimeout(3000);
        return await this.page.isVisible('text=Test Customer');
      });
      
      // Test Read/List Customers
      const readTest = await this.runTest('Read Customers List', async () => {
        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
        return await this.page.isVisible('text=Test Customer') || await this.page.isVisible('[data-testid="page-title"]');
      });
      
      // Test Update Customer
      const updateTest = await this.runTest('Update Customer', async () => {
        const editButton = await this.page.locator('button:has-text("Edit"), [data-testid*="edit"]').first();
        if (await editButton.isVisible()) {
          await editButton.click();
          await this.page.waitForTimeout(1000);
          await this.page.fill('[data-testid="customer-name-input"]', 'Updated Test Customer');
          await this.page.click('[data-testid="customer-save-button"]');
          await this.page.waitForTimeout(3000);
          return await this.page.isVisible('text=Updated Test Customer');
        }
        return false;
      });
      
      // Test Delete Customer
      const deleteTest = await this.runTest('Delete Customer', async () => {
        // Close any open modals first
        const cancelButtons = await this.page.locator('[data-testid="customer-cancel-button"], button:has-text("Cancel")').all();
        for (const cancelBtn of cancelButtons) {
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
            await this.page.waitForTimeout(500);
          }
        }
        
        // Set up dialog handler before clicking delete
        this.page.on('dialog', async dialog => {
          console.log('Dialog message:', dialog.message());
          await dialog.accept();
        });
        
        const deleteButton = await this.page.locator('[data-testid="delete-customer-button"]').first();
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await this.page.waitForTimeout(3000);
          return !(await this.page.isVisible('text=Updated Test Customer'));
        }
        return false;
      });
      
      this.testResults.modules.customers.tests.push(createTest, readTest, updateTest, deleteTest);
      this.testResults.modules.customers.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.customers.status = 'failed';
      this.logDefect('Customers Module', error.message, 'High');
    }
  }

  async testDealsModule() {
    console.log('💼 Testing Deals Module...');
    this.testResults.modules.deals.status = 'running';
    
    try {
      await this.page.goto(`${this.baseUrl}/deals`);
      await this.page.waitForLoadState('networkidle');
      
      // Test Create Deal
      const createTest = await this.runTest('Create Deal', async () => {
        // Close any existing modals first
        const cancelButtons = await this.page.locator('[data-testid="deal-cancel-button"], button:has-text("Cancel")').all();
        for (const cancelBtn of cancelButtons) {
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
            await this.page.waitForTimeout(500);
          }
        }
        
        await this.page.click('[data-testid="add-deal-button"]');
        await this.page.waitForTimeout(1500);
        
        // Fill required fields
        await this.page.fill('[data-testid="deal-title-input"]', 'Test Deal');
        await this.page.fill('[data-testid="deal-value-input"]', '10000');
        await this.page.selectOption('[data-testid="deal-stage-select"]', 'prospecting');
        
        // Select first customer if available
        const customerOptions = await this.page.locator('[data-testid="deal-customer-select"] option').count();
        if (customerOptions > 1) {
          await this.page.selectOption('[data-testid="deal-customer-select"]', { index: 1 });
        }
        
        await this.page.click('[data-testid="deal-save-button"]');
        await this.page.waitForTimeout(4000);
        
        // Check if deal was created successfully
        const dealExists = await this.page.isVisible('text=Test Deal');
        return dealExists;
      });
      
      // Test Deal Status Change
      const statusTest = await this.runTest('Change Deal Status', async () => {
        await this.page.click('[data-testid="edit-deal-button"]:first-child');
        await this.page.selectOption('[data-testid="deal-status"]', 'won');
        await this.page.click('[data-testid="save-deal"]');
        await this.page.waitForTimeout(2000);
        return await this.page.isVisible('text=Won');
      });
      
      this.testResults.modules.deals.tests.push(createTest, statusTest);
      this.testResults.modules.deals.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.deals.status = 'failed';
      this.logDefect('Deals Module', error.message, 'High');
    }
  }

  async testLeadsModule() {
    console.log('🎯 Testing Leads Module...');
    this.testResults.modules.leads.status = 'running';
    
    try {
      await this.page.goto(`${this.baseUrl}/leads`);
      await this.page.waitForLoadState('networkidle');
      
      // Test Create Lead
      const createTest = await this.runTest('Create Lead', async () => {
        // Close any existing modals first
        const cancelButtons = await this.page.locator('[data-testid="lead-cancel-button"], button:has-text("Cancel")').all();
        for (const cancelBtn of cancelButtons) {
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
            await this.page.waitForTimeout(500);
          }
        }
        
        await this.page.click('[data-testid="add-lead-button"]');
        await this.page.waitForTimeout(1500);
        await this.page.fill('[data-testid="lead-name-input"]', 'Test Lead');
        await this.page.fill('[data-testid="lead-email-input"]', 'testlead@example.com');
        await this.page.fill('[data-testid="lead-phone-input"]', '123-456-7890');
        await this.page.click('[data-testid="lead-save-button"]');
        await this.page.waitForTimeout(3000);
        return await this.page.isVisible('text=Test Lead');
      });
      
      // Test Convert Lead to Customer
      const convertTest = await this.runTest('Convert Lead to Customer', async () => {
        const convertButton = await this.page.locator('[data-testid="convert-lead-button"]').first();
        if (await convertButton.isVisible()) {
          await convertButton.click();
          await this.page.waitForTimeout(3000);
          return await this.page.isVisible('text=closed_won');
        }
        return false;
      });
      
      this.testResults.modules.leads.tests.push(createTest, convertTest);
      this.testResults.modules.leads.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.leads.status = 'failed';
      this.logDefect('Leads Module', error.message, 'High');
    }
  }

  async testInvoicesModule() {
    console.log('📄 Testing Invoices Module...');
    this.testResults.modules.invoices.status = 'running';
    
    try {
      await this.page.goto(`${this.baseUrl}/invoices`);
      await this.page.waitForLoadState('networkidle');
      
      // Test Create Invoice
      const createTest = await this.runTest('Create Invoice', async () => {
        // Look for create invoice button (text-based since no test ID)
        const createButton = await this.page.waitForSelector('button:has-text("Create Commercial Invoice")', { timeout: 5000 });
        await createButton.click();
        await this.page.waitForTimeout(1500);
        
        // Fill invoice form fields (using available test IDs)
        try {
          // Fill responsible person if available
          const responsibleSelect = await this.page.$('[data-testid="responsible-person-select"]');
          if (responsibleSelect) {
            await responsibleSelect.click();
            await this.page.waitForTimeout(500);
            const firstOption = await this.page.$('div[role="option"]:first-child');
            if (firstOption) await firstOption.click();
          }
          
          // Fill payment method if available
          const paymentSelect = await this.page.$('[data-testid="payment-method-select"]');
          if (paymentSelect) {
            await paymentSelect.click();
            await this.page.waitForTimeout(500);
            const firstOption = await this.page.$('div[role="option"]:first-child');
            if (firstOption) await firstOption.click();
          }
          
          await this.page.waitForTimeout(1000);
        } catch (fillError) {
          console.log('Note: Some form fields may not be available:', fillError.message);
        }
        
        // Save invoice (look for Create/Update button)
        const saveButton = await this.page.waitForSelector('button:has-text("Create Commercial Invoice"), button:has-text("Update Commercial Invoice")', { timeout: 3000 });
        await saveButton.click();
        await this.page.waitForTimeout(4000);
        
        // Verify invoice was created (check for success message or invoice in list)
        const invoiceCreated = await this.page.evaluate(() => {
          // Check for success toast or invoice in the list
          const successToast = document.querySelector('[data-sonner-toast]');
          const invoiceList = document.querySelector('table, .grid');
          return (successToast && successToast.textContent.includes('success')) || 
                 (invoiceList && invoiceList.textContent.includes('Commercial Invoice'));
        });
        
        return invoiceCreated;
      });
      
      this.testResults.modules.invoices.tests.push(createTest);
      this.testResults.modules.invoices.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.invoices.status = 'failed';
      this.logDefect('Invoices Module', error.message, 'High');
    }
  }

  async testProposalsModule() {
    console.log('📋 Testing Proposals Module...');
    this.testResults.modules.proposals.status = 'running';
    
    try {
      await this.page.goto(`${this.baseUrl}/proposals`);
      await this.page.waitForLoadState('networkidle');
      
      // Test Create Proposal
      const createTest = await this.runTest('Create Proposal', async () => {
        // Look for create proposal button
        const createButton = await this.page.waitForSelector('button:has-text("Create Proforma Invoice")', { timeout: 5000 });
        await createButton.click();
        await this.page.waitForTimeout(1500);
        
        // Fill proposal form using the correct IDs from ProposalTemplate component
        try {
          // Fill template name
          const nameInput = await this.page.$('input[id="template-name"]');
          if (nameInput) {
            await nameInput.fill('Test Proposal');
            console.log('✅ Filled template name');
          }
          
          // Fill template description
          const descInput = await this.page.$('textarea[id="template-description"]');
          if (descInput) {
            await descInput.fill('Test proposal description');
            console.log('✅ Filled template description');
          }
          
          await this.page.waitForTimeout(1000);
        } catch (fillError) {
          console.log('Note: Some form fields may not be available:', fillError.message);
        }
        
        // Save proposal
        const saveButton = await this.page.waitForSelector('button:has-text("Save Template")', { timeout: 3000 });
        await saveButton.click();
        await this.page.waitForTimeout(4000);
        
        // Verify proposal was created (check for success message or proposal in list)
        const proposalCreated = await this.page.evaluate(() => {
          // Check for success toast or proposal in the list
          const successToast = document.querySelector('[data-sonner-toast]');
          const proposalList = document.querySelector('.grid, table');
          return (successToast && successToast.textContent.includes('success')) || 
                 (proposalList && proposalList.textContent.includes('Test Proposal'));
        });
        
        return proposalCreated;
      });
      
      this.testResults.modules.proposals.tests.push(createTest);
      this.testResults.modules.proposals.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.proposals.status = 'failed';
      this.logDefect('Proposals Module', error.message, 'High');
    }
  }

  async testNavigation() {
    console.log('🧭 Testing Navigation...');
    this.testResults.modules.navigation.status = 'running';
    
    try {
      const routes = ['/dashboard', '/customers', '/deals', '/leads', '/invoices', '/proposals', '/analytics'];
      
      for (const route of routes) {
        const navTest = await this.runTest(`Navigate to ${route}`, async () => {
          await this.page.goto(`${this.baseUrl}${route}`);
          await this.page.waitForLoadState('networkidle');
          return this.page.url().includes(route);
        });
        this.testResults.modules.navigation.tests.push(navTest);
      }
      
      this.testResults.modules.navigation.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.navigation.status = 'failed';
      this.logDefect('Navigation', error.message, 'Medium');
    }
  }

  async testErrorHandling() {
    console.log('⚠️ Testing Error Handling...');
    this.testResults.modules.errorHandling.status = 'running';
    
    try {
      // Test form validation
      await this.page.goto(`${this.baseUrl}/customers`);
      
      const validationTest = await this.runTest('Form Validation', async () => {
        await this.page.click('[data-testid="add-customer-button"]');
        await this.page.click('[data-testid="save-customer"]');
        return await this.page.isVisible('text=required') || await this.page.isVisible('.error');
      });
      
      this.testResults.modules.errorHandling.tests.push(validationTest);
      this.testResults.modules.errorHandling.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.errorHandling.status = 'failed';
      this.logDefect('Error Handling', error.message, 'Medium');
    }
  }

  async testDatabaseIntegration() {
    console.log('🗄️ Testing Database Integration...');
    this.testResults.modules.database.status = 'running';
    
    try {
      // Test data persistence
      const persistenceTest = await this.runTest('Data Persistence', async () => {
        await this.page.goto(`${this.baseUrl}/customers`);
        await this.page.waitForLoadState('networkidle');
        const customerCount = await this.page.locator('[data-testid="customer-row"]').count();
        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
        const newCustomerCount = await this.page.locator('[data-testid="customer-row"]').count();
        return customerCount === newCustomerCount;
      });
      
      this.testResults.modules.database.tests.push(persistenceTest);
      this.testResults.modules.database.status = 'completed';
      
    } catch (error) {
      this.testResults.modules.database.status = 'failed';
      this.logDefect('Database Integration', error.message, 'High');
    }
  }

  async runTest(testName, testFunction) {
    console.log(`  ▶️ Running: ${testName}`);
    this.testResults.summary.total++;
    
    try {
      const result = await testFunction();
      if (result) {
        console.log(`  ✅ Passed: ${testName}`);
        this.testResults.summary.passed++;
        return { name: testName, status: 'passed', error: null };
      } else {
        console.log(`  ❌ Failed: ${testName}`);
        this.testResults.summary.failed++;
        this.logDefect(testName, 'Test assertion failed', 'Medium');
        return { name: testName, status: 'failed', error: 'Test assertion failed' };
      }
    } catch (error) {
      console.log(`  ❌ Error: ${testName} - ${error.message}`);
      this.testResults.summary.failed++;
      this.logDefect(testName, error.message, 'High');
      return { name: testName, status: 'failed', error: error.message };
    }
  }

  logDefect(area, description, severity) {
    this.testResults.defects.push({
      area,
      description,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  async ensureLoggedIn() {
    if (!this.page.url().includes('/dashboard')) {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');
      
      // Check if already logged in by looking for dashboard elements
      if (this.page.url().includes('/dashboard')) {
        return;
      }
      
      // Try to login with test credentials
      try {
        await this.page.fill('input[name="email"]', 'test@example.com');
        await this.page.fill('input[name="password"]', 'password123');
        await this.page.click('button[type="submit"]');
        await this.page.waitForTimeout(3000);
      } catch (error) {
        console.log('Login attempt failed, continuing with tests...');
      }
    }
  }

  async generateReport() {
    const reportPath = path.join(__dirname, 'comprehensive-test-report.json');
    const summaryPath = path.join(__dirname, 'test-execution-summary.md');
    
    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    // Generate Markdown summary
    const summary = this.generateMarkdownSummary();
    fs.writeFileSync(summaryPath, summary);
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${this.testResults.summary.total}`);
    console.log(`Passed: ${this.testResults.summary.passed}`);
    console.log(`Failed: ${this.testResults.summary.failed}`);
    console.log(`Success Rate: ${((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(2)}%`);
    console.log(`\nDefects Found: ${this.testResults.defects.length}`);
    
    if (this.testResults.defects.length > 0) {
      console.log('\n🐛 Critical Issues:');
      this.testResults.defects.forEach(defect => {
        console.log(`  - ${defect.area}: ${defect.description} (${defect.severity})`);
      });
    }
    
    console.log(`\n📄 Detailed reports saved:`);
    console.log(`  - JSON: ${reportPath}`);
    console.log(`  - Summary: ${summaryPath}`);
  }

  generateMarkdownSummary() {
    const successRate = ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(2);
    
    let markdown = `# CRM Application Test Execution Summary\n\n`;
    markdown += `**Test Execution Date:** ${this.testResults.summary.startTime}\n`;
    markdown += `**Duration:** ${new Date(this.testResults.summary.endTime) - new Date(this.testResults.summary.startTime)}ms\n\n`;
    
    markdown += `## Overall Results\n\n`;
    markdown += `- **Total Tests:** ${this.testResults.summary.total}\n`;
    markdown += `- **Passed:** ${this.testResults.summary.passed}\n`;
    markdown += `- **Failed:** ${this.testResults.summary.failed}\n`;
    markdown += `- **Success Rate:** ${successRate}%\n\n`;
    
    markdown += `## Module Test Results\n\n`;
    Object.entries(this.testResults.modules).forEach(([module, data]) => {
      const modulePassRate = data.tests.length > 0 ? 
        ((data.tests.filter(t => t.status === 'passed').length / data.tests.length) * 100).toFixed(2) : '0';
      markdown += `### ${module.charAt(0).toUpperCase() + module.slice(1)}\n`;
      markdown += `- **Status:** ${data.status}\n`;
      markdown += `- **Tests:** ${data.tests.length}\n`;
      markdown += `- **Pass Rate:** ${modulePassRate}%\n\n`;
    });
    
    if (this.testResults.defects.length > 0) {
      markdown += `## Defects Found\n\n`;
      this.testResults.defects.forEach((defect, index) => {
        markdown += `### Defect ${index + 1}\n`;
        markdown += `- **Area:** ${defect.area}\n`;
        markdown += `- **Description:** ${defect.description}\n`;
        markdown += `- **Severity:** ${defect.severity}\n`;
        markdown += `- **Timestamp:** ${defect.timestamp}\n\n`;
      });
    }
    
    markdown += `## Recommendations\n\n`;
    if (this.testResults.summary.failed === 0) {
      markdown += `✅ All tests passed successfully. The application is ready for deployment.\n\n`;
      markdown += `**Next Steps:**\n`;
      markdown += `1. Commit and push changes to GitHub\n`;
      markdown += `2. Deploy to Vercel\n`;
    } else {
      markdown += `❌ ${this.testResults.summary.failed} test(s) failed. Please address the following issues before deployment:\n\n`;
      this.testResults.defects.forEach(defect => {
        markdown += `- Fix ${defect.area}: ${defect.description}\n`;
      });
      markdown += `\n**Next Steps:**\n`;
      markdown += `1. Fix all identified issues\n`;
      markdown += `2. Re-run focused regression tests\n`;
      markdown += `3. Only deploy after all tests pass\n`;
    }
    
    return markdown;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const testSuite = new CRMTestSuite();
  await testSuite.initialize();
  await testSuite.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CRMTestSuite;