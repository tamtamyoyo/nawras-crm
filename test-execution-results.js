// CRM Test Execution Script - Run in Browser Console
// Navigate to http://localhost:5173 and run this script

class CRMTestExecutor {
    constructor() {
        this.results = {
            dashboard: { status: 'pending', issues: [], details: {}, timestamp: null },
            customers: { status: 'pending', issues: [], details: {}, timestamp: null },
            leads: { status: 'pending', issues: [], details: {}, timestamp: null },
            deals: { status: 'pending', issues: [], details: {}, timestamp: null },
            proposals: { status: 'pending', issues: [], details: {}, timestamp: null },
            invoices: { status: 'pending', issues: [], details: {}, timestamp: null },
            analytics: { status: 'pending', issues: [], details: {}, timestamp: null },
            settings: { status: 'pending', issues: [], details: {}, timestamp: null }
        };
        this.consoleErrors = [];
        this.startTime = new Date();
        this.setupErrorTracking();
    }

    setupErrorTracking() {
        const originalError = console.error;
        console.error = (...args) => {
            this.consoleErrors.push({
                timestamp: new Date().toISOString(),
                message: args.join(' '),
                stack: new Error().stack
            });
            originalError.apply(console, args);
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            test: '🔍'
        }[type] || 'ℹ️';
        console.log(`${emoji} [${timestamp}] ${message}`);
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    checkElement(selector, description, required = true) {
        const element = document.querySelector(selector);
        if (!element && required) {
            this.log(`Missing required element: ${description} (${selector})`, 'error');
            return null;
        } else if (element) {
            this.log(`Found element: ${description}`, 'success');
        }
        return element;
    }

    checkMultipleElements(selector, description, minCount = 1) {
        const elements = document.querySelectorAll(selector);
        if (elements.length < minCount) {
            this.log(`Insufficient elements: ${description} (found ${elements.length}, expected ${minCount})`, 'warning');
        } else {
            this.log(`Found ${elements.length} elements: ${description}`, 'success');
        }
        return elements;
    }

    async navigateToSection(path, sectionName) {
        this.log(`Navigating to ${sectionName}...`, 'test');
        
        // Try navigation link first
        const navLink = document.querySelector(`a[href="${path}"], a[href*="${path.replace('/', '')}"]`);
        if (navLink) {
            navLink.click();
        } else {
            // Fallback to direct navigation
            window.history.pushState({}, '', path);
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
        
        await this.wait(2000); // Wait for navigation and rendering
        
        // Verify navigation
        const currentPath = window.location.pathname;
        if (currentPath === path || currentPath.includes(path.replace('/', ''))) {
            this.log(`Successfully navigated to ${sectionName}`, 'success');
            return true;
        } else {
            this.log(`Navigation failed. Expected: ${path}, Current: ${currentPath}`, 'error');
            return false;
        }
    }

    async testDashboard() {
        this.log('🏠 Testing Dashboard Section', 'test');
        const startTime = new Date();
        const startErrors = this.consoleErrors.length;
        
        try {
            // Navigate to dashboard
            const navigated = await this.navigateToSection('/dashboard', 'Dashboard');
            if (!navigated) {
                // Try root path
                await this.navigateToSection('/', 'Dashboard (root)');
            }

            // Check page elements
            const checks = [
                { selector: 'h1[data-testid="page-title"], h1:contains("Dashboard")', description: 'Dashboard title', required: true },
                { selector: '.container, .dashboard-container', description: 'Main container', required: true },
                { selector: '[role="button"], button', description: 'Interactive buttons', required: false },
                { selector: 'canvas, .recharts-wrapper, .chart', description: 'Charts/graphs', required: false },
                { selector: '.grid, .stats, [class*="grid"]', description: 'Stats grid', required: false }
            ];

            let passedChecks = 0;
            checks.forEach(check => {
                const element = this.checkElement(check.selector, check.description, check.required);
                if (element) passedChecks++;
            });

            // Check for specific dashboard features
            const statsCards = this.checkMultipleElements('[class*="card"], .card', 'Statistics cards', 0);
            const refreshButton = this.checkElement('button:contains("Refresh"), [aria-label*="refresh"]', 'Refresh button', false);
            
            // Test refresh functionality if available
            if (refreshButton) {
                this.log('Testing refresh functionality...', 'test');
                refreshButton.click();
                await this.wait(1000);
            }

            // Record results
            this.results.dashboard = {
                status: passedChecks >= 2 ? 'passed' : 'failed',
                issues: [],
                details: {
                    elementsFound: `${passedChecks}/${checks.length}`,
                    statsCards: statsCards.length,
                    hasRefreshButton: !!refreshButton,
                    loadTime: new Date() - startTime
                },
                timestamp: new Date().toISOString()
            };

            // Check for new console errors
            const newErrors = this.consoleErrors.length - startErrors;
            if (newErrors > 0) {
                this.results.dashboard.issues.push(`${newErrors} console errors detected`);
            }

            this.log(`Dashboard test completed: ${this.results.dashboard.status}`, 
                    this.results.dashboard.status === 'passed' ? 'success' : 'error');

        } catch (error) {
            this.results.dashboard.status = 'failed';
            this.results.dashboard.issues.push(`Test execution error: ${error.message}`);
            this.log(`Dashboard test failed: ${error.message}`, 'error');
        }
    }

    async testSection(sectionName, path, expectedElements) {
        this.log(`🔍 Testing ${sectionName} Section`, 'test');
        const startTime = new Date();
        const startErrors = this.consoleErrors.length;
        
        try {
            // Navigate to section
            const navigated = await this.navigateToSection(path, sectionName);
            if (!navigated) {
                this.results[sectionName.toLowerCase()].status = 'failed';
                this.results[sectionName.toLowerCase()].issues.push('Navigation failed');
                return;
            }

            // Check expected elements
            let passedChecks = 0;
            expectedElements.forEach(check => {
                const element = this.checkElement(check.selector, check.description, check.required);
                if (element) passedChecks++;
            });

            // Test CRUD operations
            const crudResults = await this.testCRUDOperations(sectionName.toLowerCase());
            
            // Check for data display
            const dataElements = this.checkMultipleElements(
                'table, .table, .list-item, .grid-item, [class*="item"]', 
                'Data display elements', 0
            );

            // Record results
            this.results[sectionName.toLowerCase()] = {
                status: passedChecks >= Math.floor(expectedElements.length / 2) ? 'passed' : 'failed',
                issues: [],
                details: {
                    elementsFound: `${passedChecks}/${expectedElements.length}`,
                    dataElements: dataElements.length,
                    crudOperations: crudResults,
                    loadTime: new Date() - startTime
                },
                timestamp: new Date().toISOString()
            };

            // Check for new console errors
            const newErrors = this.consoleErrors.length - startErrors;
            if (newErrors > 0) {
                this.results[sectionName.toLowerCase()].issues.push(`${newErrors} console errors detected`);
            }

            this.log(`${sectionName} test completed: ${this.results[sectionName.toLowerCase()].status}`, 
                    this.results[sectionName.toLowerCase()].status === 'passed' ? 'success' : 'error');

        } catch (error) {
            this.results[sectionName.toLowerCase()].status = 'failed';
            this.results[sectionName.toLowerCase()].issues.push(`Test execution error: ${error.message}`);
            this.log(`${sectionName} test failed: ${error.message}`, 'error');
        }
    }

    async testCRUDOperations(section) {
        const operations = {
            create: false,
            read: false,
            update: false,
            delete: false
        };

        // Test Create (Add/New buttons)
        const createButtons = this.checkMultipleElements(
            'button:contains("Add"), button:contains("New"), button:contains("Create"), [class*="add"]',
            'Create buttons', 0
        );
        operations.create = createButtons.length > 0;

        // Test Read (Data display)
        const dataDisplay = this.checkMultipleElements(
            'table, .table, .list, .grid, [class*="list"], [class*="table"]',
            'Data display', 0
        );
        operations.read = dataDisplay.length > 0;

        // Test Update (Edit buttons)
        const updateButtons = this.checkMultipleElements(
            'button:contains("Edit"), button:contains("Update"), [class*="edit"]',
            'Update buttons', 0
        );
        operations.update = updateButtons.length > 0;

        // Test Delete (Delete buttons)
        const deleteButtons = this.checkMultipleElements(
            'button:contains("Delete"), button:contains("Remove"), [class*="delete"]',
            'Delete buttons', 0
        );
        operations.delete = deleteButtons.length > 0;

        return operations;
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive CRM Testing', 'test');
        this.log(`Test started at: ${this.startTime.toLocaleString()}`, 'info');
        
        // Test Dashboard
        await this.testDashboard();
        await this.wait(1000);

        // Test all sections
        const sections = [
            {
                name: 'Customers',
                path: '/customers',
                elements: [
                    { selector: 'h1, h2, .page-title', description: 'Page title', required: true },
                    { selector: 'table, .customer-list, .list', description: 'Customer list', required: false },
                    { selector: 'button, .button', description: 'Action buttons', required: false },
                    { selector: 'input[type="search"], .search', description: 'Search functionality', required: false }
                ]
            },
            {
                name: 'Leads',
                path: '/leads',
                elements: [
                    { selector: 'h1, h2, .page-title', description: 'Page title', required: true },
                    { selector: 'table, .lead-list, .list', description: 'Lead list', required: false },
                    { selector: 'button, .button', description: 'Action buttons', required: false },
                    { selector: '.status, .badge', description: 'Status indicators', required: false }
                ]
            },
            {
                name: 'Deals',
                path: '/deals',
                elements: [
                    { selector: 'h1, h2, .page-title', description: 'Page title', required: true },
                    { selector: 'table, .deal-list, .list', description: 'Deal list', required: false },
                    { selector: 'button, .button', description: 'Action buttons', required: false },
                    { selector: '.amount, .value, .price', description: 'Deal values', required: false }
                ]
            },
            {
                name: 'Proposals',
                path: '/proposals',
                elements: [
                    { selector: 'h1, h2, .page-title', description: 'Page title', required: true },
                    { selector: 'table, .proposal-list, .list', description: 'Proposal list', required: false },
                    { selector: 'button, .button', description: 'Action buttons', required: false },
                    { selector: '.status, .badge', description: 'Status indicators', required: false }
                ]
            },
            {
                name: 'Invoices',
                path: '/invoices',
                elements: [
                    { selector: 'h1, h2, .page-title', description: 'Page title', required: true },
                    { selector: 'table, .invoice-list, .list', description: 'Invoice list', required: false },
                    { selector: 'button, .button', description: 'Action buttons', required: false },
                    { selector: '.amount, .total, .price', description: 'Invoice amounts', required: false }
                ]
            },
            {
                name: 'Analytics',
                path: '/analytics',
                elements: [
                    { selector: 'h1, h2, .page-title', description: 'Page title', required: true },
                    { selector: 'canvas, .chart, .graph', description: 'Charts/graphs', required: false },
                    { selector: '.metric, .stat', description: 'Metrics', required: false },
                    { selector: '.filter, .controls', description: 'Controls', required: false }
                ]
            },
            {
                name: 'Settings',
                path: '/settings',
                elements: [
                    { selector: 'h1, h2, .page-title', description: 'Page title', required: true },
                    { selector: 'form, .form', description: 'Settings form', required: false },
                    { selector: 'input, select, textarea', description: 'Form inputs', required: false },
                    { selector: 'button[type="submit"], .save', description: 'Save button', required: false }
                ]
            }
        ];

        for (const section of sections) {
            await this.testSection(section.name, section.path, section.elements);
            await this.wait(1000);
        }

        this.generateFinalReport();
    }

    generateFinalReport() {
        const endTime = new Date();
        const totalTime = endTime - this.startTime;
        
        console.log('\n' + '='.repeat(80));
        console.log('🔍 CRM COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(80));
        console.log(`📅 Test Date: ${this.startTime.toLocaleDateString()}`);
        console.log(`⏰ Test Duration: ${Math.round(totalTime / 1000)}s`);
        console.log(`🔗 Test URL: ${window.location.origin}`);
        console.log('');
        
        // Summary statistics
        const sections = Object.keys(this.results);
        const passed = sections.filter(s => this.results[s].status === 'passed').length;
        const failed = sections.filter(s => this.results[s].status === 'failed').length;
        const pending = sections.filter(s => this.results[s].status === 'pending').length;
        
        console.log('📊 TEST SUMMARY:');
        console.log(`   ✅ Passed: ${passed}/${sections.length}`);
        console.log(`   ❌ Failed: ${failed}/${sections.length}`);
        console.log(`   ⏳ Pending: ${pending}/${sections.length}`);
        console.log(`   🚨 Console Errors: ${this.consoleErrors.length}`);
        console.log('');
        
        // Detailed results
        console.log('📋 DETAILED RESULTS:');
        sections.forEach(section => {
            const result = this.results[section];
            const emoji = {
                'passed': '✅',
                'failed': '❌',
                'pending': '⏳'
            }[result.status] || '❓';
            
            console.log(`\n${emoji} ${section.toUpperCase()}:`);
            console.log(`   Status: ${result.status}`);
            if (result.details && Object.keys(result.details).length > 0) {
                console.log(`   Details: ${JSON.stringify(result.details, null, 6)}`);
            }
            if (result.issues && result.issues.length > 0) {
                console.log(`   Issues: ${result.issues.join(', ')}`);
            }
            if (result.timestamp) {
                console.log(`   Tested: ${new Date(result.timestamp).toLocaleTimeString()}`);
            }
        });
        
        // Console errors
        if (this.consoleErrors.length > 0) {
            console.log('\n🚨 CONSOLE ERRORS DETECTED:');
            this.consoleErrors.forEach((error, index) => {
                console.log(`   ${index + 1}. [${error.timestamp}] ${error.message}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (failed > 0) {
            console.log('   • Review failed sections and fix identified issues');
        }
        if (this.consoleErrors.length > 0) {
            console.log('   • Investigate and resolve console errors');
        }
        if (passed === sections.length && this.consoleErrors.length === 0) {
            console.log('   • All tests passed! CRM system is functioning correctly.');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('🏁 Test execution completed!');
        console.log('='.repeat(80));
        
        // Return results for programmatic access
        return {
            summary: {
                total: sections.length,
                passed,
                failed,
                pending,
                consoleErrors: this.consoleErrors.length,
                duration: totalTime,
                timestamp: endTime.toISOString()
            },
            results: this.results,
            errors: this.consoleErrors
        };
    }
}

// Auto-execution when script is loaded
if (typeof window !== 'undefined') {
    console.log('🔍 CRM Test Execution Script Loaded');
    console.log('📋 To run tests manually: const tester = new CRMTestExecutor(); await tester.runAllTests();');
    console.log('🚀 Auto-starting comprehensive tests in 3 seconds...');
    
    setTimeout(async () => {
        try {
            const tester = new CRMTestExecutor();
            const results = await tester.runAllTests();
            
            // Store results globally for access
            window.crmTestResults = results;
            console.log('\n💾 Results stored in window.crmTestResults');
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
        }
    }, 3000);
 } else {
     console.log('⚠️ This script should be run in a browser environment');
 }