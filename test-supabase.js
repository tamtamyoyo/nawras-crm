import { supabase, supabaseUrl, supabaseAnonKey } from './test-config.js'

console.log('🔧 Testing Supabase connection...')
console.log('URL:', supabaseUrl ? 'Present' : 'Missing')
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

async function testConnection() {
  try {
    console.log('📡 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase error:', error)
    } else {
      console.log('✅ Supabase connection successful')
      console.log('📊 Response:', data)
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error)
  }
}

testConnection()