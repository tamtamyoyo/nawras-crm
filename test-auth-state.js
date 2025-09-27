import { supabase } from './test-config.js'

async function testAuthState() {
  console.log('Testing current authentication state...')
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return
    }
    
    console.log('Current session:', session ? 'Authenticated' : 'Not authenticated')
    if (session) {
      console.log('User ID:', session.user.id)
      console.log('User email:', session.user.email)
    }
    
    // Test creating a customer with current auth state
    console.log('\nTesting customer creation...')
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer Auth',
        email: 'test-auth@example.com',
        phone: '123-456-7890',
        company: 'Test Company',
        status: 'prospect',
        source: 'Other',
        created_by: session?.user?.id || 'anonymous'
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Customer creation failed:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ Customer created successfully:', data)
      
      // Clean up - delete the test customer
      await supabase
        .from('customers')
        .delete()
        .eq('id', data.id)
      console.log('🧹 Test customer cleaned up')
    }
    
  } catch (err) {
    console.error('❌ Test error:', err)
  }
}

testAuthState()