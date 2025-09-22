import { createClient } from '@supabase/supabase-js'

// Test simple customer insert without any complex fields
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSimpleInsert() {
  try {
    console.log('🧪 Testing simple customer insert...')
    
    // Test with minimal required fields only
    const minimalCustomer = {
      name: 'Test Customer ' + Date.now(),
      status: 'prospect'
    }
    
    console.log('📝 Inserting minimal customer:', minimalCustomer)
    
    const { data, error } = await supabase
      .from('customers')
      .insert(minimalCustomer)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Minimal insert failed:')
      console.error('Code:', error.code)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
      return
    }
    
    console.log('✅ Minimal insert successful:', data.id)
    
    // Clean up
    await supabase.from('customers').delete().eq('id', data.id)
    console.log('🧹 Cleanup completed')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSimpleInsert()
  .then(() => {
    console.log('✅ Test completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })