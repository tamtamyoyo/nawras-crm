// Comprehensive Proposals Page Test Script
// Tests database connectivity, dashboard integration, analytics, leads management, and cross-page synchronization

import { supabase } from './test-config.js'

class ProposalsTestSuite {
  constructor() {
    this.testResults = []
    this.browser = null
    this.page = null
    this.baseUrl = 'http://localhost:5173'
  }

  async setup() {
    console.log('🚀 Setting up test environment...')
    this.browser = await chromium.launch({ headless: false })
    this.page = await this.browser.newPage()
    await this.page.goto(this.baseUrl)
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  logResult(testName, status, details = '', severity = 'medium') {
    const result = {
      test: testName,
      status,
      details,
      severity,
      timestamp: new Date().toISOString()
    }
    this.testResults.push(result)
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`)
  }

  // Test 1: Database Connectivity
  async testDatabaseConnectivity() {
    console.log('\n📊 Testing Database Connectivity...')
    
    try {
      // Test basic connection
      const { data, error } = await supabase.from('proposals').select('count', { count: 'exact' })
      if (error) throw error
      
      this.logResult('Database Connection', 'PASS', `Connected successfully, found ${data.length} proposals`)
      
      // Test CRUD operations
      await this.testProposalCRUD()
      
    } catch (error) {
      this.logResult('Database Connection', 'FAIL', `Connection failed: ${error.message}`, 'high')
    }
  }

  async testProposalCRUD() {
    try {
      // Create test proposal
      const testProposal = {
        title: 'Test Proposal - ' + Date.now(),
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'draft',
        total_amount: 5000,
        content: { sections: [] },
        created_at: new Date().toISOString()
      }

      const { data: created, error: createError } = await supabase
        .from('proposals')
        .insert(testProposal)
        .select()
        .single()

      if (createError) throw createError
      this.logResult('Proposal Create', 'PASS', `Created proposal with ID: ${created.id}`)

      // Read proposal
      const { data: read, error: readError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', created.id)
        .single()

      if (readError) throw readError
      this.logResult('Proposal Read', 'PASS', `Successfully read proposal: ${read.title}`)

      // Update proposal
      const { data: updated, error: updateError } = await supabase
        .from('proposals')
        .update({ status: 'sent', total_amount: 6000 })
        .eq('id', created.id)
        .select()
        .single()

      if (updateError) throw updateError
      this.logResult('Proposal Update', 'PASS', `Updated status to: ${updated.status}`)

      // Delete proposal
      const { error: deleteError } = await supabase
        .from('proposals')
        .delete()
        .eq('id', created.id)

      if (deleteError) throw deleteError
      this.logResult('Proposal Delete', 'PASS', 'Successfully deleted test proposal')

    } catch (error) {
      this.logResult('Proposal CRUD', 'FAIL', `CRUD operation failed: ${error.message}`, 'high')
    }
  }

  // Test 2: Dashboard Integration
  async testDashboardIntegration() {
    console.log('\n📈 Testing Dashboard Integration...')
    
    try {
      await this.page.goto(`${this.baseUrl}/dashboard`)
      await this.page.waitForLoadState('networkidle')

      // Check if proposals data appears on dashboard
      const proposalsWidget = await this.page.locator('[data-testid="proposals-widget"], .proposals-card, [class*="proposal"]').first()
      
      if (await proposalsWidget.isVisible()) {
        const proposalsText = await proposalsWidget.textContent()
        this.logResult('Dashboard Proposals Widget', 'PASS', `Found proposals widget: ${proposalsText?.substring(0, 50)}...`)
      } else {
        this.logResult('Dashboard Proposals Widget', 'FAIL', 'Proposals widget not found on dashboard', 'medium')
      }

      // Check proposal metrics
      const metricsElements = await this.page.locator('[data-testid*="metric"], .metric, .stat').all()
      if (metricsElements.length > 0) {
        this.logResult('Dashboard Metrics', 'PASS', `Found ${metricsElements.length} metric elements`)
      } else {
        this.logResult('Dashboard Metrics', 'FAIL', 'No metrics found on dashboard', 'medium')
      }

    } catch (error) {
      this.logResult('Dashboard Integration', 'FAIL', `Dashboard test failed: ${error.message}`, 'high')
    }
  }

  // Test 3: Analytics Module
  async testAnalyticsModule() {
    console.log('\n📊 Testing Analytics Module...')
    
    try {
      await this.page.goto(`${this.baseUrl}/analytics`)
      await this.page.waitForLoadState('networkidle')

      // Check for analytics charts
      const chartElements = await this.page.locator('canvas, svg, [class*="chart"], [data-testid*="chart"]').all()
      if (chartElements.length > 0) {
        this.logResult('Analytics Charts', 'PASS', `Found ${chartElements.length} chart elements`)
      } else {
        this.logResult('Analytics Charts', 'FAIL', 'No charts found in analytics', 'medium')
      }

      // Check for proposal-related analytics
      const proposalAnalytics = await this.page.locator('text=/proposal/i, [data-testid*="proposal"]').all()
      if (proposalAnalytics.length > 0) {
        this.logResult('Proposal Analytics', 'PASS', `Found ${proposalAnalytics.length} proposal-related analytics`)
      } else {
        this.logResult('Proposal Analytics', 'FAIL', 'No proposal analytics found', 'low')
      }

    } catch (error) {
      this.logResult('Analytics Module', 'FAIL', `Analytics test failed: ${error.message}`, 'medium')
    }
  }

  // Test 4: Leads Management Integration
  async testLeadsIntegration() {
    console.log('\n🎯 Testing Leads Management Integration...')
    
    try {
      // Navigate to leads page
      await this.page.goto(`${this.baseUrl}/leads`)
      await this.page.waitForLoadState('networkidle')

      // Look for convert to proposal functionality
      const convertButtons = await this.page.locator('button:has-text("Convert"), button:has-text("Proposal"), [data-testid*="convert"]').all()
      if (convertButtons.length > 0) {
        this.logResult('Lead to Proposal Conversion', 'PASS', `Found ${convertButtons.length} conversion options`)
      } else {
        this.logResult('Lead to Proposal Conversion', 'FAIL', 'No lead-to-proposal conversion found', 'medium')
      }

      // Test actual conversion if possible
      if (convertButtons.length > 0) {
        try {
          await convertButtons[0].click()
          await this.page.waitForTimeout(1000)
          
          // Check if proposal creation dialog appears
          const proposalDialog = await this.page.locator('[role="dialog"], .modal, [data-testid*="proposal-dialog"]').first()
          if (await proposalDialog.isVisible()) {
            this.logResult('Conversion Dialog', 'PASS', 'Proposal creation dialog appeared')
          }
        } catch (conversionError) {
          this.logResult('Conversion Process', 'FAIL', `Conversion failed: ${conversionError.message}`, 'low')
        }
      }

    } catch (error) {
      this.logResult('Leads Integration', 'FAIL', `Leads integration test failed: ${error.message}`, 'medium')
    }
  }

  // Test 5: Cross-Page Data Synchronization
  async testCrossPageSync() {
    console.log('\n🔄 Testing Cross-Page Data Synchronization...')
    
    try {
      // Test customer data sync
      await this.page.goto(`${this.baseUrl}/customers`)
      await this.page.waitForLoadState('networkidle')
      
      const customerElements = await this.page.locator('[data-testid*="customer"], .customer-card, .customer-row').all()
      const customerCount = customerElements.length
      
      // Navigate to proposals and check customer data
      await this.page.goto(`${this.baseUrl}/proposals`)
      await this.page.waitForLoadState('networkidle')
      
      // Look for customer selection in proposal creation
      const addButton = await this.page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first()
      if (await addButton.isVisible()) {
        await addButton.click()
        await this.page.waitForTimeout(1000)
        
        const customerSelect = await this.page.locator('select, [role="combobox"], input[placeholder*="customer" i]').first()
        if (await customerSelect.isVisible()) {
          this.logResult('Customer Data Sync', 'PASS', 'Customer selection available in proposals')
        } else {
          this.logResult('Customer Data Sync', 'FAIL', 'Customer data not synced to proposals', 'medium')
        }
      }

    } catch (error) {
      this.logResult('Cross-Page Sync', 'FAIL', `Sync test failed: ${error.message}`, 'medium')
    }
  }

  // Test 6: Real-Time Synchronization
  async testRealTimeSync() {
    console.log('\n⚡ Testing Real-Time Synchronization...')
    
    try {
      // Open proposals page
      await this.page.goto(`${this.baseUrl}/proposals`)
      await this.page.waitForLoadState('networkidle')
      
      // Get initial proposal count
      const initialProposals = await this.page.locator('[data-testid*="proposal"], .proposal-card, .proposal-row').all()
      const initialCount = initialProposals.length
      
      // Create a proposal via API (simulating another user)
      const testProposal = {
        title: 'Real-time Test Proposal - ' + Date.now(),
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'draft',
        total_amount: 3000,
        content: { sections: [] }
      }
      
      const { data: newProposal, error } = await supabase
        .from('proposals')
        .insert(testProposal)
        .select()
        .single()
      
      if (error) throw error
      
      // Wait and check if the new proposal appears
      await this.page.waitForTimeout(3000)
      await this.page.reload()
      await this.page.waitForLoadState('networkidle')
      
      const updatedProposals = await this.page.locator('[data-testid*="proposal"], .proposal-card, .proposal-row').all()
      const updatedCount = updatedProposals.length
      
      if (updatedCount > initialCount) {
        this.logResult('Real-Time Sync', 'PASS', `Proposal count increased from ${initialCount} to ${updatedCount}`)
      } else {
        this.logResult('Real-Time Sync', 'FAIL', 'New proposal not reflected in real-time', 'low')
      }
      
      // Cleanup
      await supabase.from('proposals').delete().eq('id', newProposal.id)
      
    } catch (error) {
      this.logResult('Real-Time Sync', 'FAIL', `Real-time sync test failed: ${error.message}`, 'low')
    }
  }

  // Test 7: Proposals Page UI Functionality
  async testProposalsPageUI() {
    console.log('\n🎨 Testing Proposals Page UI Functionality...')
    
    try {
      await this.page.goto(`${this.baseUrl}/proposals`)
      await this.page.waitForLoadState('networkidle')

      // Test page load
      const pageTitle = await this.page.locator('h1, [data-testid="page-title"]').first()
      if (await pageTitle.isVisible()) {
        const titleText = await pageTitle.textContent()
        this.logResult('Proposals Page Load', 'PASS', `Page loaded with title: ${titleText}`)
      } else {
        this.logResult('Proposals Page Load', 'FAIL', 'Proposals page did not load properly', 'high')
      }

      // Test filters
      const filterElements = await this.page.locator('input[placeholder*="search" i], select, [data-testid*="filter"]').all()
      if (filterElements.length > 0) {
        this.logResult('Proposals Filters', 'PASS', `Found ${filterElements.length} filter elements`)
      } else {
        this.logResult('Proposals Filters', 'FAIL', 'No filters found', 'low')
      }

      // Test proposal cards/list
      const proposalElements = await this.page.locator('[data-testid*="proposal"], .proposal-card, .proposal-item').all()
      if (proposalElements.length > 0) {
        this.logResult('Proposals Display', 'PASS', `Found ${proposalElements.length} proposal elements`)
      } else {
        this.logResult('Proposals Display', 'FAIL', 'No proposals displayed', 'medium')
      }

      // Test action buttons
      const actionButtons = await this.page.locator('button:has-text("Edit"), button:has-text("View"), button:has-text("Delete"), button:has-text("Send")').all()
      if (actionButtons.length > 0) {
        this.logResult('Proposal Actions', 'PASS', `Found ${actionButtons.length} action buttons`)
      } else {
        this.logResult('Proposal Actions', 'FAIL', 'No action buttons found', 'medium')
      }

    } catch (error) {
      this.logResult('Proposals Page UI', 'FAIL', `UI test failed: ${error.message}`, 'high')
    }
  }

  // Generate comprehensive test report
  generateReport() {
    console.log('\n📋 Generating Test Report...')
    
    const passCount = this.testResults.filter(r => r.status === 'PASS').length
    const failCount = this.testResults.filter(r => r.status === 'FAIL').length
    const highSeverity = this.testResults.filter(r => r.severity === 'high' && r.status === 'FAIL').length
    const mediumSeverity = this.testResults.filter(r => r.severity === 'medium' && r.status === 'FAIL').length
    const lowSeverity = this.testResults.filter(r => r.severity === 'low' && r.status === 'FAIL').length

    const report = {
      summary: {
        totalTests: this.testResults.length,
        passed: passCount,
        failed: failCount,
        passRate: `${((passCount / this.testResults.length) * 100).toFixed(1)}%`,
        highSeverityIssues: highSeverity,
        mediumSeverityIssues: mediumSeverity,
        lowSeverityIssues: lowSeverity
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    }

    return report
  }

  generateRecommendations() {
    const recommendations = []
    const failedTests = this.testResults.filter(r => r.status === 'FAIL')
    
    if (failedTests.some(t => t.test.includes('Database'))) {
      recommendations.push('Review Supabase configuration and database permissions')
    }
    
    if (failedTests.some(t => t.test.includes('Dashboard'))) {
      recommendations.push('Verify dashboard components are properly integrated with proposals data')
    }
    
    if (failedTests.some(t => t.test.includes('Analytics'))) {
      recommendations.push('Implement or fix analytics tracking for proposals')
    }
    
    if (failedTests.some(t => t.test.includes('Leads'))) {
      recommendations.push('Implement lead-to-proposal conversion functionality')
    }
    
    if (failedTests.some(t => t.test.includes('Sync'))) {
      recommendations.push('Implement real-time data synchronization across pages')
    }
    
    return recommendations
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Comprehensive Proposals Test Suite...')
    
    try {
      await this.setup()
      
      await this.testDatabaseConnectivity()
      await this.testDashboardIntegration()
      await this.testAnalyticsModule()
      await this.testLeadsIntegration()
      await this.testCrossPageSync()
      await this.testRealTimeSync()
      await this.testProposalsPageUI()
      
      const report = this.generateReport()
      
      console.log('\n📊 TEST SUMMARY:')
      console.log(`Total Tests: ${report.summary.totalTests}`)
      console.log(`Passed: ${report.summary.passed} (${report.summary.passRate})`)
      console.log(`Failed: ${report.summary.failed}`)
      console.log(`High Severity Issues: ${report.summary.highSeverityIssues}`)
      console.log(`Medium Severity Issues: ${report.summary.mediumSeverityIssues}`)
      console.log(`Low Severity Issues: ${report.summary.lowSeverityIssues}`)
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:')
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`)
        })
      }
      
      // Save detailed report to file
      await fs.promises.writeFile(
        'proposals-test-report.json',
        JSON.stringify(report, null, 2)
      )
      
      console.log('\n📄 Detailed report saved to: proposals-test-report.json')
      
      return report
      
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      throw error
    } finally {
      await this.cleanup()
    }
  }
}

// Run the test suite
const testSuite = new ProposalsTestSuite()
testSuite.runAllTests()
  .then(report => {
    console.log('\n✅ Test suite completed successfully!')
    process.exit(report.summary.failed > 0 ? 1 : 0)
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  })

export default ProposalsTestSuite