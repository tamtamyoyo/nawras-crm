import { createClient } from '@supabase/supabase-js'

// Test Supabase connection with detailed logging
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

console.log('🔧 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseAnonKey.length)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...')
    
    // Test 1: Basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('customers')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Health check failed:', healthError)
      return
    }
    
    console.log('✅ Basic connection successful')
    
    // Test 2: Try to create a customer
    console.log('\n2. Testing customer creation...')
    
    const testCustomer = {
      name: 'Debug Test Customer',
      email: 'debug@test.com',
      phone: '+1-555-DEBUG',
      company: 'Debug Corp',
      address: '123 Debug St',
      status: 'prospect',
      source: 'Other',
      responsible_person: 'Mr. Ali',
      created_by: null // This should work with null
    }
    
    const { data: createData, error: createError } = await supabase
      .from('customers')
      .insert(testCustomer)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Customer creation failed:')
      console.error('Error code:', createError.code)
      console.error('Error message:', createError.message)
      console.error('Error details:', createError.details)
      console.error('Error hint:', createError.hint)
      
      // Try to understand the specific error
      if (createError.code === '42P10') {
        console.log('\n🔍 Error 42P10 indicates a column reference issue')
        console.log('This usually means a column name is ambiguous or doesn\'t exist')
      }
      
      return
    }
    
    console.log('✅ Customer created successfully:', createData.id)
    
    // Clean up - delete the test customer
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', createData.id)
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test customer:', deleteError.message)
    } else {
      console.log('✅ Test customer cleaned up')
    }
    
    console.log('\n🎉 All tests passed!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testConnection()
  .then(() => {
    console.log('\n✅ Connection test completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Connection test failed:', error)
    process.exit(1)
  })