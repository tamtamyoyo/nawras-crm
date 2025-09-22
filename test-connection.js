import { createClient } from '@supabase/supabase-js'

// Test Supabase connection
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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