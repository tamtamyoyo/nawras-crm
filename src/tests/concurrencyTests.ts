import { ConcurrentDbService, ConcurrencyMetrics } from '../services/concurrentDbService';
import { supabase } from '../lib/supabase-client';

// Test data generators
const generateTestCustomer = (index: number) => ({
  name: `Test Customer ${index}`,
  email: `customer${index}@test.com`,
  phone: `555-000${index.toString().padStart(4, '0')}`,
  company: `Test Company ${index}`,
  status: 'active'
});

const generateTestLead = (index: number) => ({
  name: `Test Lead ${index}`,
  email: `lead${index}@test.com`,
  phone: `555-100${index.toString().padStart(4, '0')}`,
  company: `Lead Company ${index}`,
  status: 'new',
  source: 'website'
});

const generateTestDeal = (customerId: string, index: number) => ({
  title: `Test Deal ${index}`,
  customer_id: customerId,
  value: Math.floor(Math.random() * 100000) + 10000,
  stage: 'prospecting',
  probability: 25,
  expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});

// Calendar functionality removed

// Test result tracking
interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: {
    successful?: number;
    failed?: number;
    total?: number;
    [key: string]: unknown;
  };
}

class ConcurrencyTestRunner {
  private results: TestResult[] = [];
  private testData: {
    customers: Array<{ id: string; name: string; email: string; version?: number; [key: string]: unknown }>;
    leads: Array<{ id: string; name: string; email: string; version?: number; [key: string]: unknown }>;
    deals: Array<{ id: string; title: string; value: number; customer_id: string; version?: number; [key: string]: unknown }>;
    events: Array<{ id: string; title: string; date: string; [key: string]: unknown }>;
  } = {
    customers: [],
    leads: [],
    deals: [],
    events: []
  };

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Concurrency Tests...');
    ConcurrencyMetrics.reset();
    
    // Setup test data
    await this.setupTestData();
    
    // Run individual tests
    await this.testOptimisticLocking();
    await this.testConcurrentUpdates();
    // Calendar tests removed
    await this.testBatchOperations();
    await this.testRetryMechanisms();
    await this.testRaceConditions();
    await this.testDataIntegrity();
    await this.testLoadScenarios();
    
    // Cleanup
    await this.cleanupTestData();
    
    // Print results
    this.printResults();
    
    return this.results;
  }
  
  private async setupTestData(): Promise<void> {
    console.log('📋 Setting up test data...');
    
    try {
      // Create test customers
      for (let i = 1; i <= 5; i++) {
        const customer = await ConcurrentDbService.createSafely(
          'customers',
          generateTestCustomer(i),
          ['email']
        );
        this.testData.customers.push(customer);
      }
      
      // Create test leads
      for (let i = 1; i <= 5; i++) {
        const lead = await ConcurrentDbService.createSafely(
          'leads',
          generateTestLead(i),
          ['email']
        );
        this.testData.leads.push(lead);
      }
      
      // Create test deals
      for (let i = 1; i <= 3; i++) {
        const deal = await ConcurrentDbService.createSafely(
          'deals',
          generateTestDeal(this.testData.customers[0].id, i)
        );
        this.testData.deals.push(deal);
      }
      
      console.log('✅ Test data setup complete');
    } catch (error) {
      console.error('❌ Failed to setup test data:', error);
      throw error;
    }
  }
  
  private async testOptimisticLocking(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔒 Testing optimistic locking...');
      
      const customer = this.testData.customers[0];
      const originalVersion = customer.version;
      
      // First update should succeed
      const updated1 = await ConcurrentDbService.updateWithOptimisticLocking(
        'customers',
        customer.id,
        { name: 'Updated Name 1' },
        originalVersion
      );
      
      // Second update with old version should fail
      try {
        await ConcurrentDbService.updateWithOptimisticLocking(
          'customers',
          customer.id,
          { name: 'Updated Name 2' },
          originalVersion // Using old version
        );
        
        throw new Error('Expected conflict error but update succeeded');
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        if (err.code !== 'CONFLICT') {
          throw error;
        }
        // Expected conflict - test passed
      }
      
      // Third update with correct version should succeed
      await ConcurrentDbService.updateWithOptimisticLocking(
        'customers',
        customer.id,
        { name: 'Updated Name 3' },
        updated1.version
      );
      
      this.results.push({
        testName: 'Optimistic Locking',
        success: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ Optimistic locking test passed');
    } catch (error: unknown) {
      const err = error as Error;
      this.results.push({
        testName: 'Optimistic Locking',
        success: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      
      console.error('❌ Optimistic locking test failed:', error);
    }
  }
  
  private async testConcurrentUpdates(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('⚡ Testing concurrent updates...');
      
      const customer = this.testData.customers[1];
      const concurrentOperations = 5;
      
      // Simulate concurrent updates
      const promises = Array.from({ length: concurrentOperations }, async (_, index) => {
        try {
          // Get fresh version for each operation
          const { data: freshCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customer.id)
            .single();
          
          if (!freshCustomer) throw new Error('Customer not found');
          
          return await ConcurrentDbService.updateWithOptimisticLocking(
            'customers',
            customer.id,
            { name: `Concurrent Update ${index}` },
            freshCustomer.version
          );
        } catch (error) {
          return { error: error.message, index };
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && !(r.value as { error?: string }).error).length;
      const failed = results.length - successful;
      
      // At least one should succeed, others may fail due to conflicts
      if (successful === 0) {
        throw new Error('No concurrent updates succeeded');
      }
      
      this.results.push({
        testName: 'Concurrent Updates',
        success: true,
        duration: Date.now() - startTime,
        details: { successful, failed, total: concurrentOperations }
      });
      
      console.log(`✅ Concurrent updates test passed: ${successful}/${concurrentOperations} succeeded`);
    } catch (error: unknown) {
      const err = error as Error;
      this.results.push({
        testName: 'Concurrent Updates',
        success: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      
      console.error('❌ Concurrent updates test failed:', error);
    }
  }
  
  // Calendar conflict tests removed
  
  private async testBatchOperations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📦 Testing batch operations...');
      
      const operations = this.testData.customers.slice(0, 3).map((customer, index) => ({
        table: 'customers',
        id: customer.id,
        updates: { name: `Batch Update ${index}` },
        expectedVersion: customer.version
      }));
      
      const results = await ConcurrentDbService.batchUpdate(operations);
      
      if (results.length !== operations.length) {
        throw new Error(`Expected ${operations.length} results, got ${results.length}`);
      }
      
      this.results.push({
        testName: 'Batch Operations',
        success: true,
        duration: Date.now() - startTime,
        details: { operationsCount: operations.length }
      });
      
      console.log('✅ Batch operations test passed');
    } catch (error: unknown) {
      const err = error as Error;
      this.results.push({
        testName: 'Batch Operations',
        success: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      
      console.error('❌ Batch operations test failed:', error);
    }
  }
  
  private async testRetryMechanisms(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing retry mechanisms...');
      
      let attemptCount = 0;
      const maxRetries = 3;
      
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Simulated temporary failure');
        }
        return { success: true, attempts: attemptCount };
      };
      
      const result = await ConcurrentDbService['withRetry'](operation, {
        maxRetries,
        baseDelay: 100,
        maxDelay: 1000
      });
      
      if (result.attempts !== 3) {
        throw new Error(`Expected 3 attempts, got ${result.attempts}`);
      }
      
      this.results.push({
        testName: 'Retry Mechanisms',
        success: true,
        duration: Date.now() - startTime,
        details: { attempts: result.attempts }
      });
      
      console.log('✅ Retry mechanisms test passed');
    } catch (error: unknown) {
      const err = error as Error;
      this.results.push({
        testName: 'Retry Mechanisms',
        success: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      
      console.error('❌ Retry mechanisms test failed:', error);
    }
  }
  
  private async testRaceConditions(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🏃 Testing race condition prevention...');
      
      const customer = this.testData.customers[2];
      const simultaneousOperations = 10;
      
      // Simulate race conditions with rapid concurrent operations
      const promises = Array.from({ length: simultaneousOperations }, async (_, index) => {
        const delay = Math.random() * 100; // Random delay to create race conditions
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          // Get fresh data
          const { data: freshCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customer.id)
            .single();
          
          if (!freshCustomer) throw new Error('Customer not found');
          
          return await ConcurrentDbService.updateWithOptimisticLocking(
            'customers',
            customer.id,
            { name: `Race Test ${index}`, phone: `555-${index.toString().padStart(4, '0')}` },
            freshCustomer.version
          );
        } catch (error: unknown) {
          const err = error as Error;
          return { error: err.message, index };
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && !(r.value as { error?: string }).error
      ).length;
      
      // Verify data integrity - check final state
      const { data: finalCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer.id)
        .single();
      
      if (!finalCustomer) {
        throw new Error('Customer was lost during race condition test');
      }
      
      // At least one operation should succeed
      if (successful === 0) {
        throw new Error('No operations succeeded in race condition test');
      }
      
      this.results.push({
        testName: 'Race Conditions',
        success: true,
        duration: Date.now() - startTime,
        details: { 
          successful, 
          total: simultaneousOperations,
          finalVersion: finalCustomer.version
        }
      });
      
      console.log(`✅ Race condition prevention test passed: ${successful}/${simultaneousOperations} succeeded`);
    } catch (error: unknown) {
      const err = error as Error;
      this.results.push({
        testName: 'Race Conditions',
        success: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      
      console.error('❌ Race condition prevention test failed:', error);
    }
  }
  
  private async testDataIntegrity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing data integrity...');
      
      // Verify all test data still exists and has correct versions
      const customerIds = this.testData.customers.map(c => c.id);
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);
      
      if (error) throw error;
      
      if (!customers || customers.length !== this.testData.customers.length) {
        throw new Error(`Expected ${this.testData.customers.length} customers, found ${customers?.length || 0}`);
      }
      
      // Verify version integrity
      for (const customer of customers) {
        if (!customer.version || customer.version < 1) {
          throw new Error(`Invalid version for customer ${customer.id}: ${customer.version}`);
        }
      }
      
      // Verify no duplicate emails
      const emails = customers.map(c => c.email);
      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) {
        throw new Error('Duplicate emails found - data integrity compromised');
      }
      
      this.results.push({
        testName: 'Data Integrity',
        success: true,
        duration: Date.now() - startTime,
        details: { customersChecked: customers.length }
      });
      
      console.log('✅ Data integrity test passed');
    } catch (error: unknown) {
      const err = error as Error;
      this.results.push({
        testName: 'Data Integrity',
        success: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      
      console.error('❌ Data integrity test failed:', error);
    }
  }
  
  private async testLoadScenarios(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('⚡ Testing load scenarios...');
      
      const concurrentUsers = 20;
      const operationsPerUser = 5;
      
      const userOperations = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const operations = [];
        
        for (let opIndex = 0; opIndex < operationsPerUser; opIndex++) {
          const operation = async () => {
            const randomCustomer = this.testData.customers[
              Math.floor(Math.random() * this.testData.customers.length)
            ];
            
            // Get fresh data
            const { data: freshCustomer } = await supabase
              .from('customers')
              .select('*')
              .eq('id', randomCustomer.id)
              .single();
            
            if (!freshCustomer) throw new Error('Customer not found');
            
            return await ConcurrentDbService.updateWithOptimisticLocking(
              'customers',
              randomCustomer.id,
              { name: `Load Test User${userIndex} Op${opIndex}` },
              freshCustomer.version
            );
          };
          
          operations.push(operation());
        }
        
        const results = await Promise.allSettled(operations);
        return results.filter(r => r.status === 'fulfilled').length;
      });
      
      const userResults = await Promise.allSettled(userOperations);
      const totalSuccessful = userResults
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + (r.value as number), 0);
      
      const totalOperations = concurrentUsers * operationsPerUser;
      const successRate = totalSuccessful / totalOperations;
      
      // Accept success rate above 50% as good for high concurrency
      if (successRate < 0.5) {
        throw new Error(`Low success rate: ${(successRate * 100).toFixed(1)}%`);
      }
      
      this.results.push({
        testName: 'Load Scenarios',
        success: true,
        duration: Date.now() - startTime,
        details: {
          concurrentUsers,
          operationsPerUser,
          totalOperations,
          successful: totalSuccessful,
          successRate: `${(successRate * 100).toFixed(1)}%`
        }
      });
      
      console.log(`✅ Load scenarios test passed: ${(successRate * 100).toFixed(1)}% success rate`);
    } catch (error: unknown) {
      const err = error as Error;
      this.results.push({
        testName: 'Load Scenarios',
        success: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      
      console.error('❌ Load scenarios test failed:', error);
    }
  }
  
  private async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Calendar events cleanup removed
      
      // Delete test deals
      if (this.testData.deals.length > 0) {
        const dealIds = this.testData.deals.map(d => d.id);
        await supabase.from('deals').delete().in('id', dealIds);
      }
      
      // Delete test leads
      if (this.testData.leads.length > 0) {
        const leadIds = this.testData.leads.map(l => l.id);
        await supabase.from('leads').delete().in('id', leadIds);
      }
      
      // Delete test customers
      if (this.testData.customers.length > 0) {
        const customerIds = this.testData.customers.map(c => c.id);
        await supabase.from('customers').delete().in('id', customerIds);
      }
      
      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
    }
  }
  
  private printResults(): void {
    console.log('\n📊 CONCURRENCY TEST RESULTS');
    console.log('=' .repeat(50));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.length - successful;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.testName} (${duration})`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details)}`);
      }
    });
    
    // Print concurrency metrics
    const metrics = ConcurrencyMetrics.getMetrics();
    console.log('\n📈 CONCURRENCY METRICS');
    console.log('=' .repeat(30));
    console.log(`Total Operations: ${metrics.totalOperations}`);
    console.log(`Conflicts: ${metrics.totalConflicts} (${(metrics.conflictRate * 100).toFixed(1)}%)`);
    console.log(`Retries: ${metrics.totalRetries} (${(metrics.retryRate * 100).toFixed(1)}%)`);
    console.log(`Lock Waits: ${metrics.totalLockWaits} (${(metrics.lockWaitRate * 100).toFixed(1)}%)`);
  }
}

// Export test runner and utilities
export { ConcurrencyTestRunner };

// Convenience function to run all tests
export async function runConcurrencyTests(): Promise<TestResult[]> {
  const runner = new ConcurrencyTestRunner();
  return await runner.runAllTests();
}

// Individual test functions for targeted testing
export async function testOptimisticLocking(): Promise<boolean> {
  const runner = new ConcurrencyTestRunner();
  await runner['setupTestData']();
  await runner['testOptimisticLocking']();
  await runner['cleanupTestData']();
  return runner['results'][0]?.success || false;
}

export async function testConcurrentUpdates(): Promise<boolean> {
  const runner = new ConcurrencyTestRunner();
  await runner['setupTestData']();
  await runner['testConcurrentUpdates']();
  await runner['cleanupTestData']();
  return runner['results'][0]?.success || false;
}

// Calendar conflict tests removed

// Browser-based testing utilities
export function setupBrowserConcurrencyTests() {
  // Add global functions for browser console testing
  (window as { runConcurrencyTests?: typeof runConcurrencyTests; testOptimisticLocking?: typeof testOptimisticLocking; testConcurrentUpdates?: typeof testConcurrentUpdates }).runConcurrencyTests = runConcurrencyTests;
  (window as { runConcurrencyTests?: typeof runConcurrencyTests; testOptimisticLocking?: typeof testOptimisticLocking; testConcurrentUpdates?: typeof testConcurrentUpdates }).testOptimisticLocking = testOptimisticLocking;
  (window as { runConcurrencyTests?: typeof runConcurrencyTests; testOptimisticLocking?: typeof testOptimisticLocking; testConcurrentUpdates?: typeof testConcurrentUpdates }).testConcurrentUpdates = testConcurrentUpdates;
  // Calendar tests removed
  
  console.log('🧪 Concurrency tests available in browser console:');
  console.log('- runConcurrencyTests()');
  console.log('- testOptimisticLocking()');
  console.log('- testConcurrentUpdates()');
  // Calendar tests removed
}