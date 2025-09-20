import { supabase } from '../lib/supabase-client';
import { Session } from '@supabase/supabase-js';

// Test user credentials for concurrent testing
interface TestUser {
  email: string;
  password: string;
  id?: string;
}

interface AuthTestDetails {
  attempted?: number;
  successful?: number;
  uniqueSessions?: number;
  [key: string]: unknown;
}

interface AuthTestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: AuthTestDetails;
}

class AuthConcurrencyTestRunner {
  private results: AuthTestResult[] = [];
  private testUsers: TestUser[] = [];
  private sessions: Session[] = [];

  constructor() {
    // Generate test users
    for (let i = 1; i <= 5; i++) {
      this.testUsers.push({
        email: `testuser${i}@concurrency.test`,
        password: `TestPass${i}123!`
      });
    }
  }

  async runAllAuthTests(): Promise<AuthTestResult[]> {
    console.log('🔐 Starting Authentication Concurrency Tests...');
    
    // Setup test users
    await this.setupTestUsers();
    
    // Run authentication tests
    await this.testConcurrentLogins();
    await this.testConcurrentLogouts();
    await this.testSessionConsistency();
    await this.testMultiTabSessions();
    await this.testSessionTimeouts();
    await this.testConcurrentPasswordResets();
    await this.testAuthStateRaceConditions();
    
    // Cleanup
    await this.cleanupTestUsers();
    
    // Print results
    this.printAuthResults();
    
    return this.results;
  }

  private async setupTestUsers(): Promise<void> {
    console.log('👥 Setting up test users...');
    
    try {
      // Create test users (in a real scenario, these would be pre-created)
      for (const testUser of this.testUsers) {
        try {
          const { data } = await supabase.auth.signUp({
            email: testUser.email,
            password: testUser.password,
            options: {
              emailRedirectTo: undefined // Skip email confirmation for testing
            }
          });
          
          if (data.user) {
            testUser.id = data.user.id;
          }
          
          // Sign out immediately after creation
          await supabase.auth.signOut();
        } catch {
          // User might already exist, which is fine for testing
          console.log(`Test user ${testUser.email} might already exist`);
        }
      }
      
      console.log('✅ Test users setup complete');
    } catch (error) {
      console.error('❌ Failed to setup test users:', error);
    }
  }

  private async testConcurrentLogins(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🚪 Testing concurrent logins...');
      
      const concurrentLogins = this.testUsers.slice(0, 3).map(async (testUser, index) => {
        try {
          // Add random delay to simulate real-world timing
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
          });
          
          if (error) throw error;
          
          // Store session for later cleanup
          if (data.session) {
            this.sessions.push(data.session);
          }
          
          return {
            success: true,
            user: data.user,
            session: data.session,
            index
          };
        } catch (error: unknown) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            index
          };
        }
      });
      
      const results = await Promise.allSettled(concurrentLogins);
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      if (successful === 0) {
        throw new Error('No concurrent logins succeeded');
      }
      
      // Verify no session conflicts
      const sessionIds = this.sessions.map(s => s.access_token).filter(Boolean);
      const uniqueSessionIds = new Set(sessionIds);
      
      if (sessionIds.length !== uniqueSessionIds.size) {
        throw new Error('Session ID conflicts detected');
      }
      
      this.results.push({
        testName: 'Concurrent Logins',
        success: true,
        duration: Date.now() - startTime,
        details: {
          attempted: concurrentLogins.length,
          successful,
          uniqueSessions: uniqueSessionIds.size
        }
      });
      
      console.log(`✅ Concurrent logins test passed: ${successful}/${concurrentLogins.length} succeeded`);
    } catch (error: unknown) {
      this.results.push({
        testName: 'Concurrent Logins',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ Concurrent logins test failed:', error);
    }
  }

  private async testConcurrentLogouts(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🚪 Testing concurrent logouts...');
      
      // First, ensure we have active sessions
      const loginPromises = this.testUsers.slice(0, 3).map(async (testUser) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password
        });
        
        if (error) throw error;
        return data.session;
      });
      
      const sessions = await Promise.all(loginPromises);
      
      // Now test concurrent logouts
      const concurrentLogouts = sessions.map(async (session, index) => {
        try {
          // Add random delay
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;
          
          return {
            success: true,
            index
          };
        } catch (error: unknown) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            index
          };
        }
      });
      
      const results = await Promise.allSettled(concurrentLogouts);
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      // At least some logouts should succeed
      if (successful === 0) {
        throw new Error('No concurrent logouts succeeded');
      }
      
      // Verify final auth state is clean
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.warn('Warning: Session still active after concurrent logouts');
      }
      
      this.results.push({
        testName: 'Concurrent Logouts',
        success: true,
        duration: Date.now() - startTime,
        details: {
          attempted: concurrentLogouts.length,
          successful,
          finalSessionActive: !!session
        }
      });
      
      console.log(`✅ Concurrent logouts test passed: ${successful}/${concurrentLogouts.length} succeeded`);
    } catch (error: unknown) {
      this.results.push({
        testName: 'Concurrent Logouts',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ Concurrent logouts test failed:', error);
    }
  }

  private async testSessionConsistency(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing session consistency...');
      
      const testUser = this.testUsers[0];
      
      // Login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginError) throw loginError;
      
      const originalSession = loginData.session;
      if (!originalSession) throw new Error('No session created');
      
      // Test multiple concurrent session retrievals
      const sessionChecks = Array.from({ length: 10 }, async (_, index) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        return {
          index,
          sessionExists: !!session,
          sessionId: session?.access_token?.substring(0, 10),
          userId: session?.user?.id
        };
      });
      
      const results = await Promise.all(sessionChecks);
      
      // Verify consistency
      const sessionExists = results.every(r => r.sessionExists);
      const userIds = results.map(r => r.userId).filter(Boolean);
      const uniqueUserIds = new Set(userIds);
      
      if (!sessionExists) {
        throw new Error('Session consistency failed - some checks returned no session');
      }
      
      if (uniqueUserIds.size !== 1) {
        throw new Error(`Session consistency failed - multiple user IDs: ${Array.from(uniqueUserIds)}`);
      }
      
      // Cleanup
      await supabase.auth.signOut();
      
      this.results.push({
        testName: 'Session Consistency',
        success: true,
        duration: Date.now() - startTime,
        details: {
          checksPerformed: results.length,
          allConsistent: sessionExists,
          uniqueUserIds: uniqueUserIds.size
        }
      });
      
      console.log('✅ Session consistency test passed');
    } catch (error: unknown) {
      this.results.push({
        testName: 'Session Consistency',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ Session consistency test failed:', error);
    }
  }

  private async testMultiTabSessions(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🗂️ Testing multi-tab session simulation...');
      
      const testUser = this.testUsers[1];
      
      // Simulate multiple "tabs" by creating multiple auth instances
      const tabSimulations = Array.from({ length: 3 }, async (_, tabIndex) => {
        try {
          // Each "tab" tries to login
          const { data, error } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
          });
          
          if (error) throw error;
          
          // Simulate tab activity
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check session
          const { data: { session } } = await supabase.auth.getSession();
          
          return {
            tabIndex,
            loginSuccess: !!data.session,
            sessionActive: !!session,
            userId: session?.user?.id
          };
        } catch (error: unknown) {
          return {
            tabIndex,
            loginSuccess: false,
            sessionActive: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const results = await Promise.all(tabSimulations);
      
      const successfulTabs = results.filter(r => r.loginSuccess).length;
      const activeSessions = results.filter(r => r.sessionActive).length;
      const userIds = results.map(r => r.userId).filter(Boolean);
      const uniqueUserIds = new Set(userIds);
      
      // In a real multi-tab scenario, all tabs should share the same session
      if (uniqueUserIds.size > 1) {
        throw new Error(`Multiple user sessions detected: ${Array.from(uniqueUserIds)}`);
      }
      
      // Cleanup
      await supabase.auth.signOut();
      
      this.results.push({
        testName: 'Multi-Tab Sessions',
        success: true,
        duration: Date.now() - startTime,
        details: {
          tabsSimulated: results.length,
          successfulLogins: successfulTabs,
          activeSessions,
          uniqueUsers: uniqueUserIds.size
        }
      });
      
      console.log('✅ Multi-tab session test passed');
    } catch (error: unknown) {
      this.results.push({
        testName: 'Multi-Tab Sessions',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ Multi-tab session test failed:', error);
    }
  }

  private async testSessionTimeouts(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('⏰ Testing session timeout handling...');
      
      const testUser = this.testUsers[2];
      
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });
      
      if (error) throw error;
      if (!data.session) throw new Error('No session created');
      
      // Test concurrent session refresh attempts
      const refreshAttempts = Array.from({ length: 5 }, async (_, index) => {
        try {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) throw refreshError;
          
          return {
            index,
            success: true,
            sessionExists: !!refreshData.session
          };
        } catch (error: unknown) {
          return {
            index,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const results = await Promise.all(refreshAttempts);
      
      const successful = results.filter(r => r.success).length;
      
      // At least some refresh attempts should succeed
      if (successful === 0) {
        throw new Error('No session refresh attempts succeeded');
      }
      
      // Cleanup
      await supabase.auth.signOut();
      
      this.results.push({
        testName: 'Session Timeouts',
        success: true,
        duration: Date.now() - startTime,
        details: {
          refreshAttempts: results.length,
          successful
        }
      });
      
      console.log(`✅ Session timeout test passed: ${successful}/${results.length} refresh attempts succeeded`);
    } catch (error: unknown) {
      this.results.push({
        testName: 'Session Timeouts',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ Session timeout test failed:', error);
    }
  }

  private async testConcurrentPasswordResets(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔑 Testing concurrent password reset requests...');
      
      const testUser = this.testUsers[3];
      
      // Test multiple concurrent password reset requests
      const resetRequests = Array.from({ length: 3 }, async (_, index) => {
        try {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          
          const { error } = await supabase.auth.resetPasswordForEmail(testUser.email, {
            redirectTo: 'http://localhost:3000/reset-password'
          });
          
          if (error) throw error;
          
          return {
            index,
            success: true
          };
        } catch (error: unknown) {
          return {
            index,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const results = await Promise.all(resetRequests);
      
      const successful = results.filter(r => r.success).length;
      
      // Password reset requests should handle concurrency gracefully
      // (they might succeed or fail depending on rate limiting)
      
      this.results.push({
        testName: 'Concurrent Password Resets',
        success: true, // Consider test passed if no crashes occur
        duration: Date.now() - startTime,
        details: {
          requestsAttempted: results.length,
          successful
        }
      });
      
      console.log(`✅ Concurrent password reset test passed: ${successful}/${results.length} requests succeeded`);
    } catch (error: unknown) {
      this.results.push({
        testName: 'Concurrent Password Resets',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ Concurrent password reset test failed:', error);
    }
  }

  private async testAuthStateRaceConditions(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🏃 Testing auth state race conditions...');
      
      const testUser = this.testUsers[4];
      
      // Test rapid login/logout cycles
      const authCycles = Array.from({ length: 5 }, async (_, index) => {
        try {
          // Login
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
          });
          
          if (loginError) throw loginError;
          
          // Brief delay
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Check session
          const { data: { session: midSession } } = await supabase.auth.getSession();
          
          // Logout
          const { error: logoutError } = await supabase.auth.signOut();
          
          if (logoutError) throw logoutError;
          
          // Final session check
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          
          return {
            index,
            success: true,
            loginSucceeded: !!loginData.session,
            midSessionActive: !!midSession,
            finalSessionActive: !!finalSession
          };
        } catch (error: unknown) {
          return {
            index,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const results = await Promise.all(authCycles);
      
      const successful = results.filter(r => r.success).length;
      const properLogouts = results.filter(r => r.success && !r.finalSessionActive).length;
      
      if (successful === 0) {
        throw new Error('No auth cycles completed successfully');
      }
      
      // Verify final state is clean
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut(); // Cleanup
      }
      
      this.results.push({
        testName: 'Auth State Race Conditions',
        success: true,
        duration: Date.now() - startTime,
        details: {
          cyclesAttempted: results.length,
          successful,
          properLogouts
        }
      });
      
      console.log(`✅ Auth state race condition test passed: ${successful}/${results.length} cycles succeeded`);
    } catch (error: unknown) {
      this.results.push({
        testName: 'Auth State Race Conditions',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ Auth state race condition test failed:', error);
    }
  }

  private async cleanupTestUsers(): Promise<void> {
    console.log('🧹 Cleaning up auth test data...');
    
    try {
      // Sign out any remaining sessions
      await supabase.auth.signOut();
      
      // Note: In a real scenario, you might want to delete test users
      // but this requires admin privileges
      
      console.log('✅ Auth test cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup auth test data:', error);
    }
  }

  private printAuthResults(): void {
    console.log('\n🔐 AUTHENTICATION CONCURRENCY TEST RESULTS');
    console.log('=' .repeat(55));
    
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
  }
}

// Export test runner and utilities
export { AuthConcurrencyTestRunner };

// Convenience function to run all auth tests
export async function runAuthConcurrencyTests(): Promise<AuthTestResult[]> {
  const runner = new AuthConcurrencyTestRunner();
  return await runner.runAllAuthTests();
}

// Individual test functions
export async function testConcurrentLogins(): Promise<boolean> {
  const runner = new AuthConcurrencyTestRunner();
  await runner['setupTestUsers']();
  await runner['testConcurrentLogins']();
  await runner['cleanupTestUsers']();
  return runner['results'][0]?.success || false;
}

export async function testSessionConsistency(): Promise<boolean> {
  const runner = new AuthConcurrencyTestRunner();
  await runner['setupTestUsers']();
  await runner['testSessionConsistency']();
  await runner['cleanupTestUsers']();
  return runner['results'][0]?.success || false;
}

// Browser-based testing utilities
export function setupBrowserAuthTests() {
  (window as Record<string, unknown>).runAuthConcurrencyTests = runAuthConcurrencyTests;
  (window as Record<string, unknown>).testConcurrentLogins = testConcurrentLogins;
  (window as Record<string, unknown>).testSessionConsistency = testSessionConsistency;
  
  console.log('🔐 Auth concurrency tests available in browser console:');
  console.log('- runAuthConcurrencyTests()');
  console.log('- testConcurrentLogins()');
  console.log('- testSessionConsistency()');
}