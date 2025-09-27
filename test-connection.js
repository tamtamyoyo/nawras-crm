import { supabase } from './test-config.js'

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error)
      return false
    }
    
    console.log('✅ Connection successful!')
    return true
  } catch (err) {
    console.error('❌ Connection error:', err)
    return false
  }
}

testConnection()