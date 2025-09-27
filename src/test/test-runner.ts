// Comprehensive test runner for Nawras CRM
import { supabase } from '@/lib/supabase-client'
import { addDemoData, clearDemoData } from '@/utils/demo-data'
import type { Database } from '@/lib/database.types'

// Use untyped client to avoid 'never' type issues in demo mode
const testClient = supabase as any

export interface TestResult {
  section: string
  testName: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: unknown
  timestamp: string
}

export interface TestReport {
  testId: string
  startTime: string
  endTime: string
  totalTests: number
  passed: number
  failed: number
  warnings: number
  results: TestResult[]
  summary: string
  recommendations: string[]
}

class CRMTestRunner {
  public results: TestResult[] = []
  private userId: string
  private testId: string

  constructor(userId: string) {
    this.userId = userId
    this.testId = `test_${Date.now()}`
  }

  private addResult(section: string, testName: string, status: 'pass' | 'fail' | 'warning', message: string, details?: unknown) {
    this.results.push({
      section,
      testName,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    })
    
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
    console.log(`${emoji} [${section}] ${testName}: ${message}`)
  }

  // Test Customer Management
  async testCustomerManagement(): Promise<void> {
    console.log('\n🧪 Testing Customer Management...')
    
    try {
      // Test customer creation
      const testCustomer: Database['public']['Tables']['customers']['Insert'] = {
        name: 'Test Customer Corp',
        email: 'test@testcorp.com',
        phone: '+1-555-TEST',
        company: 'Test Customer Corp',
        address: '123 Test St, Test City, TC 12345',
        status: 'prospect' as const,
        notes: 'This is a test customer for validation',
        created_by: this.userId,
        responsible_person: 'Mr. Ali'
      }

      const { data: customer, error: createError } = await testClient
        .from('customers')
        .insert([testCustomer])
        .select()
        .single()

      if (createError || !customer) {
        this.addResult('Customer Management', 'Customer Creation', 'fail', `Failed to create customer: ${createError?.message || 'No customer returned'}`, createError)
        return
      }

      this.addResult('Customer Management', 'Customer Creation', 'pass', 'Successfully created test customer', customer)

      // Test customer update
      const { error: updateError } = await testClient
        .from('customers')
        .update({ status: 'active' as const, notes: 'Updated test customer' })
        .eq('id', customer.id)

      if (updateError) {
        this.addResult('Customer Management', 'Customer Update', 'fail', `Failed to update customer: ${updateError.message}`, updateError)
      } else {
        this.addResult('Customer Management', 'Customer Update', 'pass', 'Successfully updated customer status and notes')
      }

      // Test customer retrieval
      const { data: retrievedCustomer, error: retrieveError } = await testClient
        .from('customers')
        .select('*')
        .eq('id', customer.id)
        .single()

      if (retrieveError) {
        this.addResult('Customer Management', 'Customer Retrieval', 'fail', `Failed to retrieve customer: ${retrieveError.message}`, retrieveError)
      } else if (retrievedCustomer?.status === 'active') {
        this.addResult('Customer Management', 'Customer Retrieval', 'pass', 'Successfully retrieved updated customer data')
      } else {
        this.addResult('Customer Management', 'Customer Retrieval', 'warning', 'Customer retrieved but update may not have persisted')
      }

      // Test customer search
      const { data: searchResults, error: searchError } = await testClient
        .from('customers')
        .select('*')
        .ilike('name', '%Test Customer%')

      if (searchError) {
        this.addResult('Customer Management', 'Customer Search', 'fail', `Search failed: ${searchError.message}`, searchError)
      } else if (searchResults && searchResults.length > 0) {
        this.addResult('Customer Management', 'Customer Search', 'pass', `Search returned ${searchResults.length} results`)
      } else {
        this.addResult('Customer Management', 'Customer Search', 'warning', 'Search completed but no results found')
      }

      // Test customer deletion
      const { error: deleteError } = await testClient
        .from('customers')
        .delete()
        .eq('id', customer.id)

      if (deleteError) {
        this.addResult('Customer Management', 'Customer Deletion', 'fail', `Failed to delete customer: ${deleteError.message}`, deleteError)
      } else {
        this.addResult('Customer Management', 'Customer Deletion', 'pass', 'Successfully deleted test customer')
      }

    } catch (error) {
      this.addResult('Customer Management', 'General Error', 'fail', `Unexpected error: ${error}`, error)
    }
  }

  // Test Lead Management
  async testLeadManagement(): Promise<void> {
    console.log('\n🎯 Testing Lead Management...')
    
    try {
      // First create a test customer for the lead
      const testCustomer: Database['public']['Tables']['customers']['Insert'] = {
        name: 'Lead Test Customer',
        email: 'leadtest@example.com',
        phone: '+1-555-LEAD',
        company: 'Lead Test Corp',
        address: '456 Lead St',
        status: 'prospect',
        created_by: this.userId,
        responsible_person: 'Mr. Ali'
      }

      const { data: customer, error: customerError } = await testClient
        .from('customers')
        .insert([testCustomer])
        .select()
        .single()

      if (customerError || !customer) {
        this.addResult('Lead Management', 'Setup', 'fail', `Failed to create test customer for lead testing: ${customerError?.message || 'No customer returned'}`)
        return
      }

      // Test lead creation
      const testLead: Database['public']['Tables']['leads']['Insert'] = {
        name: 'Test Lead Opportunity',
        status: 'new' as const,
        notes: 'This is a test lead for validation',
        created_by: this.userId,
        responsible_person: 'Mr. Ali'
      }

      const { data: lead, error: createError } = await testClient
        .from('leads')
        .insert([testLead])
        .select()
        .single()

      if (createError || !lead) {
        this.addResult('Lead Management', 'Lead Creation', 'fail', `Failed to create lead: ${createError?.message || 'No lead returned'}`, createError)
        return
      } else {
        this.addResult('Lead Management', 'Lead Creation', 'pass', 'Successfully created test lead', lead)
      }

      // Test lead status progression
      const statuses = ['qualified', 'converted', 'lost'] as const
      for (const status of statuses) {
        const { error: updateError } = await testClient
          .from('leads')
          .update({ status })
          .eq('id', lead.id)

        if (updateError) {
          this.addResult('Lead Management', `Status Update to ${status}`, 'fail', `Failed to update status: ${updateError.message}`)
        } else {
          this.addResult('Lead Management', `Status Update to ${status}`, 'pass', `Successfully updated lead status to ${status}`)
        }
      }

      // Cleanup
      await testClient.from('leads').delete().eq('id', lead.id)
      await testClient.from('customers').delete().eq('id', customer.id)

    } catch (error) {
      this.addResult('Lead Management', 'General Error', 'fail', `Unexpected error: ${error}`, error)
    }
  }

  // Test Deal Pipeline
  async testDealPipeline(): Promise<void> {
    console.log('\n💼 Testing Deal Pipeline...')
    
    try {
      // Create test customer
      const testCustomer: Database['public']['Tables']['customers']['Insert'] = {
        name: 'Deal Test Customer',
        email: 'dealtest@example.com',
        phone: '+1-555-DEAL',
        company: 'Deal Test Corp',
        address: '789 Deal Ave',
        status: 'active',
        created_by: this.userId,
        responsible_person: 'Mr. Ali'
      }

      const { data: customer, error: customerError } = await testClient
        .from('customers')
        .insert([testCustomer])
        .select()
        .single()

      if (customerError || !customer) {
        this.addResult('Deal Pipeline', 'Setup', 'fail', `Failed to create test customer for deal testing: ${customerError?.message || 'No customer returned'}`)
        return
      }

      // Test deal creation
      const testDeal: Database['public']['Tables']['deals']['Insert'] = {
        title: 'Test Deal for Validation',
        stage: 'prospecting' as const,
        amount: 50000,
        value: 50000,
        expected_close_date: '2024-03-31',
        probability: 75,
        description: 'This is a test deal for validation',
        customer_id: customer.id,
        created_by: this.userId,
        responsible_person: 'Mr. Ali'
      }

      const { data: deal, error: createError } = await testClient
        .from('deals')
        .insert([testDeal])
        .select()
        .single()

      if (createError || !deal) {
        this.addResult('Deal Pipeline', 'Deal Creation', 'fail', `Failed to create deal: ${createError?.message || 'No deal returned'}`, createError)
        return
      } else {
        this.addResult('Deal Pipeline', 'Deal Creation', 'pass', 'Successfully created test deal', deal)
      }

      // Test deal stage progression
      const stages = ['qualification', 'proposal', 'negotiation', 'closed_won'] as const
      for (const stage of stages) {
        const { error: updateError } = await testClient
          .from('deals')
          .update({ stage })
          .eq('id', deal.id)

        if (updateError) {
          this.addResult('Deal Pipeline', `Stage Update to ${stage}`, 'fail', `Failed to update stage: ${updateError.message}`)
        } else {
          this.addResult('Deal Pipeline', `Stage Update to ${stage}`, 'pass', `Successfully updated deal stage to ${stage}`)
        }
      }

      // Test deal value calculation
      const { data: updatedDeal } = await testClient
        .from('deals')
        .select('*')
        .eq('id', deal.id)
        .single()

      if (updatedDeal && updatedDeal.value === 50000) {
        this.addResult('Deal Pipeline', 'Value Persistence', 'pass', 'Deal value correctly maintained through stage changes')
      } else {
        this.addResult('Deal Pipeline', 'Value Persistence', 'warning', 'Deal value may have been modified unexpectedly')
      }

      // Cleanup
      if (deal?.id) {
        await testClient.from('deals').delete().eq('id', deal.id)
      }
      if (customer?.id) {
        await testClient.from('customers').delete().eq('id', customer.id)
      }

    } catch (error) {
      this.addResult('Deal Pipeline', 'General Error', 'fail', `Unexpected error: ${error}`, error)
    }
  }

  // Test Database Schema and Relationships
  async testDatabaseSchema(): Promise<void> {
    console.log('\n🗄️ Testing Database Schema...')
    
    try {
      // Test table existence
      const tables = ['customers', 'leads', 'deals', 'proposals', 'invoices']
      
      for (const table of tables) {
        const { error } = await testClient
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          this.addResult('Database Schema', `Table ${table}`, 'fail', `Table not accessible: ${error.message}`)
        } else {
          this.addResult('Database Schema', `Table ${table}`, 'pass', `Table ${table} is accessible`)
        }
      }

      // Test foreign key relationships
      const { error: relationError } = await testClient
        .from('customers')
        .select(`
          *,
          leads(*),
          deals(*),
          proposals(*),
          invoices(*)
        `)
        .limit(1)

      if (relationError) {
        this.addResult('Database Schema', 'Foreign Key Relations', 'fail', `Relationship query failed: ${relationError.message}`)
      } else {
        this.addResult('Database Schema', 'Foreign Key Relations', 'pass', 'Foreign key relationships are properly configured')
      }

    } catch (error) {
      this.addResult('Database Schema', 'General Error', 'fail', `Unexpected error: ${error}`, error)
    }
  }

  // Test Authentication and Permissions
  async testAuthenticationAndPermissions(): Promise<void> {
    console.log('\n🔐 Testing Authentication and Permissions...')
    
    try {
      // Test current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        this.addResult('Authentication', 'User Session', 'fail', `Failed to get user: ${userError.message}`)
      } else if (user) {
        this.addResult('Authentication', 'User Session', 'pass', `User authenticated: ${user.email}`)
      } else {
        this.addResult('Authentication', 'User Session', 'warning', 'No user session found')
      }

      // Test RLS (Row Level Security) by trying to access data
      const { data: customers, error: rlsError } = await testClient
        .from('customers')
        .select('*')
        .limit(5)

      if (rlsError) {
        this.addResult('Authentication', 'RLS Access', 'fail', `RLS blocking access: ${rlsError.message}`)
      } else {
        this.addResult('Authentication', 'RLS Access', 'pass', `RLS allowing proper access, returned ${customers?.length || 0} records`)
      }

    } catch (error) {
      this.addResult('Authentication', 'General Error', 'fail', `Unexpected error: ${error}`, error)
    }
  }

  // Run all tests
  async runAllTests(): Promise<TestReport> {
    const startTime = new Date().toISOString()
    console.log(`\n🚀 Starting comprehensive CRM test suite at ${startTime}`)
    console.log('=' .repeat(60))

    try {
      // Clear any existing test data first
      await clearDemoData()
      
      // Run individual test suites
      await this.testDatabaseSchema()
      await this.testAuthenticationAndPermissions()
      await this.testCustomerManagement()
      await this.testLeadManagement()
      await this.testDealPipeline()
      
      // Add demo data for manual testing
      console.log('\n📊 Adding demo data for manual testing...')
      const demoStats = await addDemoData(this.userId)
      this.addResult('Demo Data', 'Data Population', 'pass', 
        `Added demo data: ${demoStats.customers} customers, ${demoStats.leads} leads, ${demoStats.deals} deals, ${demoStats.proposals} proposals, ${demoStats.invoices} invoices`
      )

    } catch (error) {
      this.addResult('Test Suite', 'General Error', 'fail', `Test suite error: ${error}`, error)
    }

    const endTime = new Date().toISOString()
    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const warnings = this.results.filter(r => r.status === 'warning').length

    const report: TestReport = {
      testId: this.testId,
      startTime,
      endTime,
      totalTests: this.results.length,
      passed,
      failed,
      warnings,
      results: this.results,
      summary: this.generateSummary(passed, failed, warnings),
      recommendations: this.generateRecommendations()
    }

    console.log('\n' + '=' .repeat(60))
    console.log('📋 TEST REPORT SUMMARY')
    console.log('=' .repeat(60))
    console.log(report.summary)
    console.log('\n💡 RECOMMENDATIONS:')
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })
    console.log('=' .repeat(60))

    return report
  }

  private generateSummary(passed: number, failed: number, warnings: number): string {
    const total = passed + failed + warnings
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0'
    
    return `Test Suite Completed: ${passed}/${total} tests passed (${passRate}% success rate)\n` +
           `✅ Passed: ${passed}\n` +
           `❌ Failed: ${failed}\n` +
           `⚠️  Warnings: ${warnings}\n` +
           `\nOverall Status: ${failed === 0 ? '🟢 HEALTHY' : failed <= 2 ? '🟡 NEEDS ATTENTION' : '🔴 CRITICAL ISSUES'}`
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const failedTests = this.results.filter(r => r.status === 'fail')
    const warningTests = this.results.filter(r => r.status === 'warning')

    if (failedTests.length === 0 && warningTests.length === 0) {
      recommendations.push('All tests passed successfully! The CRM system is functioning properly.')
      recommendations.push('Consider adding more comprehensive integration tests for edge cases.')
      recommendations.push('Monitor system performance under load with the demo data.')
    } else {
      if (failedTests.length > 0) {
        recommendations.push(`Address ${failedTests.length} critical failures before production deployment.`)
        recommendations.push('Review database permissions and RLS policies if data access tests failed.')
        recommendations.push('Check Supabase connection and API key configuration if authentication tests failed.')
      }
      
      if (warningTests.length > 0) {
        recommendations.push(`Investigate ${warningTests.length} warnings that may indicate potential issues.`)
        recommendations.push('Review data validation and error handling mechanisms.')
      }
    }

    recommendations.push('Test the application manually in the browser to verify UI functionality.')
    recommendations.push('Verify that all demo data displays correctly in each section of the CRM.')
    recommendations.push('Test responsive design on different screen sizes.')
    recommendations.push('Validate form submissions and error handling in the UI.')

    return recommendations
  }
}

// Export the test runner
export const runComprehensiveTests = async (userId: string): Promise<TestReport> => {
  const testRunner = new CRMTestRunner(userId)
  return await testRunner.runAllTests()
}

// Export individual test functions for targeted testing
export const runCustomerTests = async (userId: string): Promise<TestResult[]> => {
  const testRunner = new CRMTestRunner(userId)
  await testRunner.testCustomerManagement()
  return testRunner.results
}

export const runLeadTests = async (userId: string): Promise<TestResult[]> => {
  const testRunner = new CRMTestRunner(userId)
  await testRunner.testLeadManagement()
  return testRunner.results
}

export const runDealTests = async (userId: string): Promise<TestResult[]> => {
  const testRunner = new CRMTestRunner(userId)
  await testRunner.testDealPipeline()
  return testRunner.results
}