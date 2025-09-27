import { supabase } from './test-config.js'

async function testAuthAndInsert() {
  try {
    console.log('🔍 Checking authentication status...')
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
    } else if (session) {
      console.log('✅ User is authenticated:', session.user.id)
      console.log('📧 User email:', session.user.email)
    } else {
      console.log('❌ No active session - user not authenticated')
    }
    
    // Try to get a valid user ID from the users table
    console.log('\n🔍 Getting valid user ID from users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    if (users && users.length > 0) {
      const validUser = users[0]
      console.log('✅ Found valid user:', validUser.id, validUser.email)
      
      // Now try to create a customer with this valid user ID
      console.log('\n🧪 Testing customer creation with valid created_by...')
      
      const customerData = {
        name: 'Test Customer ' + Date.now(),
        status: 'prospect',
        created_by: validUser.id // Use valid user ID
      }
      
      console.log('📝 Inserting customer:', customerData)
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Customer insert failed:')
        console.error('Code:', error.code)
        console.error('Message:', error.message)
        console.error('Details:', error.details)
        console.error('Hint:', error.hint)
      } else {
        console.log('✅ Customer created successfully:', data.id)
        
        // Clean up
        await supabase.from('customers').delete().eq('id', data.id)
        console.log('🧹 Cleanup completed')
      }
    } else {
      console.log('❌ No users found in users table')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAuthAndInsert()
  .then(() => {
    console.log('✅ Test completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })