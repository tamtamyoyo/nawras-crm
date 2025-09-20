import { createClient } from '@supabase/supabase-js'

// Use the values directly from .env file
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

console.log('🔧 Testing Supabase connection...')
console.log('URL:', supabaseUrl ? 'Present' : 'Missing')
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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