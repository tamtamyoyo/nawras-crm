// CRM Comprehensive Test Execution Script
// Run this in the browser console at http://localhost:5173

class CRMTester {
    constructor() {
        this.testResults = {
            dashboard: { status: 'pending', issues: [], details: {} },
            customers: { status: 'pending', issues: [], details: {} },
            leads: { status: 'pending', issues: [], details: {} },
            deals: { status: 'pending', issues: [], details: {} },
            proposals: { status: 'pending', issues: [], details: {} },
            invoices: { status: 'pending', issues: [], details: {} },
            analytics: { status: 'pending', issues: [], details: {} },
            settings: { status: 'pending', issues: [], details: {} }
        };
        this.consoleErrors = [];
        this.originalConsoleError = console.error;
        this.setupErrorTracking();
    }

    setupErrorTracking() {
        console.error = (...args) => {
            this.consoleErrors.push({ timestamp: new Date().toISOString(), message: args.join(' ') });
            this.originalConsoleError.apply(console, args);
        };
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
        console.log(`${prefix} ${message}`);
    }

    checkElement(selector, description) {
        const element = document.querySelector(selector);
        if (!element) {
            this.log(`❌ Missing element: ${description} (${selector})`, 'error');
            return false;
        }
        this.log(`✅ Found element: ${description}`, 'success');
        return element;
    }

    async testDashboard() {
        this.log('🔍 Testing Dashboard...', 'test');
        const startErrors = this.consoleErrors.length;
        
        try {
            // Navigate to dashboard
            const dashboardLink = this.checkElement('a[href="/"], a[href="/dashboard"]', 'Dashboard navigation link');
            if (dashboardLink) {
                dashboardLink.click();
                await this.wait(2000);
            }

            // Check page load
            const pageTitle = document.title;
            this.testResults.dashboard.details.pageTitle = pageTitle;
            
            // Check key dashboard elements
            const checks = [
                { selector: 'h1, h2, .dashboard-title', description: 'Dashboard title' },
                { selector: '.stats, .metrics, .dashboard-stats', description: 'Statistics/metrics section' },
                { selector: '.chart, .graph, canvas', description: 'Charts or graphs' },
                { selector: '.recent, .activity, .dashboard-activity', description: 'Recent activity section' }
            ];

            let passedChecks = 0;
            checks.forEach(check => {
                if (this.checkElement(check.selector, check.description)) {
                    passedChecks++;
                }
            });

            this.testResults.dashboard.details.elementsFound = `${passedChecks}/${checks.length}`;
            
            // Check for console errors during dashboard test
            const newErrors = this.consoleErrors.length - startErrors;
            if (newErrors > 0) {
                this.testResults.dashboard.issues.push(`${newErrors} console errors detected`);
            }

            this.testResults.dashboard.status = passedChecks >= 2 ? 'passed' : 'failed';
            this.log(`Dashboard test ${this.testResults.dashboard.status}`, this.testResults.dashboard.status === 'passed' ? 'success' : 'error');
            
        } catch (error) {
            this.testResults.dashboard.status = 'failed';
            this.testResults.dashboard.issues.push(`Test execution error: ${error.message}`);
            this.log(`Dashboard test failed: ${error.message}`, 'error');
        }
    }

    async testSection(sectionName, navSelector, expectedElements) {
        this.log(`🔍 Testing ${sectionName}...`, 'test');
        const startErrors = this.consoleErrors.length;
        
        try {
            // Navigate to section
            const navLink = this.checkElement(navSelector, `${sectionName} navigation link`);
            if (navLink) {
                navLink.click();
                await this.wait(2000);
            }

            // Check page load
            const url = window.location.pathname;
            this.testResults[sectionName.toLowerCase()].details.currentUrl = url;
            
            // Check expected elements
            let passedChecks = 0;
            expectedElements.forEach(check => {
                if (this.checkElement(check.selector, check.description)) {
                    passedChecks++;
                }
            });

            this.testResults[sectionName.toLowerCase()].details.elementsFound = `${passedChecks}/${expectedElements.length}`;
            
            // Test CRUD operations if applicable
            await this.testCRUDOperations(sectionName.toLowerCase());
            
            // Check for console errors
            const newErrors = this.consoleErrors.length - startErrors;
            if (newErrors > 0) {
                this.testResults[sectionName.toLowerCase()].issues.push(`${newErrors} console errors detected`);
            }

            this.testResults[sectionName.toLowerCase()].status = passedChecks >= Math.floor(expectedElements.length / 2) ? 'passed' : 'failed';
            this.log(`${sectionName} test ${this.testResults[sectionName.toLowerCase()].status}`, this.testResults[sectionName.toLowerCase()].status === 'passed' ? 'success' : 'error');
            
        } catch (error) {
            this.testResults[sectionName.toLowerCase()].status = 'failed';
            this.testResults[sectionName.toLowerCase()].issues.push(`Test execution error: ${error.message}`);
            this.log(`${sectionName} test failed: ${error.message}`, 'error');
        }
    }

    async testCRUDOperations(section) {
        // Test Create operation
        const addButton = document.querySelector('button[class*="add"], button[class*="create"], button[class*="new"]');
        if (addButton) {
            this.log(`✅ Found add/create button for ${section}`, 'success');
            this.testResults[section].details.hasCreateButton = true;
        }

        // Test Read operation (data display)
        const dataTable = document.querySelector('table, .table, .list, .grid');
        if (dataTable) {
            this.log(`✅ Found data display for ${section}`, 'success');
            this.testResults[section].details.hasDataDisplay = true;
        }

        // Test Update/Delete operations (action buttons)
        const actionButtons = document.querySelectorAll('button[class*="edit"], button[class*="update"], button[class*="delete"]');
        if (actionButtons.length > 0) {
            this.log(`✅ Found ${actionButtons.length} action buttons for ${section}`, 'success');
            this.testResults[section].details.hasActionButtons = actionButtons.length;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting comprehensive CRM testing...', 'test');
        
        // Test Dashboard
        await this.testDashboard();
        await this.wait(1000);

        // Test Customers
        await this.testSection('Customers', 'a[href*="customer"]', [
            { selector: 'h1, h2, .page-title', description: 'Page title' },
            { selector: 'table, .customer-list', description: 'Customer list/table' },
            { selector: 'button[class*="add"], button[class*="create"]', description: 'Add customer button' },
            { selector: 'input[type="search"], .search', description: 'Search functionality' }
        ]);
        await this.wait(1000);

        // Test Leads
        await this.testSection('Leads', 'a[href*="lead"]', [
            { selector: 'h1, h2, .page-title', description: 'Page title' },
            { selector: 'table, .lead-list', description: 'Lead list/table' },
            { selector: 'button[class*="add"], button[class*="create"]', description: 'Add lead button' },
            { selector: '.status, .lead-status', description: 'Lead status indicators' }
        ]);
        await this.wait(1000);

        // Test Deals
        await this.testSection('Deals', 'a[href*="deal"]', [
            { selector: 'h1, h2, .page-title', description: 'Page title' },
            { selector: 'table, .deal-list', description: 'Deal list/table' },
            { selector: 'button[class*="add"], button[class*="create"]', description: 'Add deal button' },
            { selector: '.amount, .value', description: 'Deal values/amounts' }
        ]);
        await this.wait(1000);

        // Test Proposals
        await this.testSection('Proposals', 'a[href*="proposal"]', [
            { selector: 'h1, h2, .page-title', description: 'Page title' },
            { selector: 'table, .proposal-list', description: 'Proposal list/table' },
            { selector: 'button[class*="add"], button[class*="create"]', description: 'Add proposal button' },
            { selector: '.status, .proposal-status', description: 'Proposal status' }
        ]);
        await this.wait(1000);

        // Test Invoices
        await this.testSection('Invoices', 'a[href*="invoice"]', [
            { selector: 'h1, h2, .page-title', description: 'Page title' },
            { selector: 'table, .invoice-list', description: 'Invoice list/table' },
            { selector: 'button[class*="add"], button[class*="create"]', description: 'Add invoice button' },
            { selector: '.amount, .total', description: 'Invoice amounts' }
        ]);
        await this.wait(1000);

        // Test Analytics
        await this.testSection('Analytics', 'a[href*="analytic"]', [
            { selector: 'h1, h2, .page-title', description: 'Page title' },
            { selector: 'canvas, .chart, .graph', description: 'Charts/graphs' },
            { selector: '.metric, .stat', description: 'Metrics/statistics' },
            { selector: '.filter, .date-range', description: 'Filters/controls' }
        ]);
        await this.wait(1000);

        // Test Settings
        await this.testSection('Settings', 'a[href*="setting"]', [
            { selector: 'h1, h2, .page-title', description: 'Page title' },
            { selector: 'form, .settings-form', description: 'Settings form' },
            { selector: 'input, select, textarea', description: 'Form inputs' },
            { selector: 'button[type="submit"], .save-button', description: 'Save button' }
        ]);

        this.generateReport();
    }

    generateReport() {
        this.log('📊 Generating comprehensive test report...', 'test');
        
        console.log('\n' + '='.repeat(60));
        console.log('🔍 CRM COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(60));
        
        const sections = Object.keys(this.testResults);
        let totalPassed = 0;
        let totalFailed = 0;
        
        sections.forEach(section => {
            const result = this.testResults[section];
            const status = result.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
            
            console.log(`\n📋 ${section.toUpperCase()}: ${status}`);
            console.log(`   Elements Found: ${result.details.elementsFound || 'N/A'}`);
            console.log(`   URL: ${result.details.currentUrl || 'N/A'}`);
            
            if (result.details.hasCreateButton) console.log('   ✅ Create functionality available');
            if (result.details.hasDataDisplay) console.log('   ✅ Data display working');
            if (result.details.hasActionButtons) console.log(`   ✅ ${result.details.hasActionButtons} action buttons found`);
            
            if (result.issues.length > 0) {
                console.log('   🚨 Issues:');
                result.issues.forEach(issue => console.log(`      - ${issue}`));
            }
            
            if (result.status === 'passed') totalPassed++;
            else totalFailed++;
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${totalPassed}/${sections.length}`);
        console.log(`❌ Failed: ${totalFailed}/${sections.length}`);
        console.log(`🚨 Total Console Errors: ${this.consoleErrors.length}`);
        
        if (this.consoleErrors.length > 0) {
            console.log('\n🚨 Console Errors:');
            this.consoleErrors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.timestamp}] ${error.message}`);
            });
        }
        
        const overallStatus = totalFailed === 0 ? '✅ ALL TESTS PASSED' : `❌ ${totalFailed} TESTS FAILED`;
        console.log(`\n🎯 Overall Status: ${overallStatus}`);
        console.log('='.repeat(60));
        
        // Store results for external access
        window.crmTestResults = this.testResults;
        window.crmTestSummary = {
            totalSections: sections.length,
            passed: totalPassed,
            failed: totalFailed,
            consoleErrors: this.consoleErrors.length,
            overallStatus: totalFailed === 0 ? 'PASSED' : 'FAILED'
        };
    }
}

// Auto-execute the tests
const tester = new CRMTester();
tester.runAllTests();

console.log('\n🚀 CRM Test Execution Started!');
console.log('📝 Test results will be available in window.crmTestResults');
console.log('📊 Test summary will be available in window.crmTestSummary');
console.log('⏱️  Please wait for all tests to complete...');