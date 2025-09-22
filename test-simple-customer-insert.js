import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSimpleInsert() {
  try {
    console.log('🧪 Testing simple customer insert without created_by...')
    
    const customerData = {
      name: 'Simple Test Customer ' + Date.now(),
      status: 'prospect'
    }
    
    console.log('📝 Inserting customer:', customerData)
    
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Simple insert failed:')
      console.error('Code:', error.code)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
    } else {
      console.log('✅ Simple insert successful:', data.id)
      
      // Clean up
      await supabase.from('customers').delete().eq('id', data.id)
      console.log('🧹 Cleanup completed')
    }
    
    console.log('\n🧪 Testing insert with NULL created_by...')
    
    const customerDataWithNull = {
      name: 'Null Test Customer ' + Date.now(),
      status: 'prospect',
      created_by: null
    }
    
    console.log('📝 Inserting customer with null created_by:', customerDataWithNull)
    
    const { data: data2, error: error2 } = await supabase
      .from('customers')
      .insert(customerDataWithNull)
      .select()
      .single()
    
    if (error2) {
      console.error('❌ Null insert failed:')
      console.error('Code:', error2.code)
      console.error('Message:', error2.message)
      console.error('Details:', error2.details)
      console.error('Hint:', error2.hint)
    } else {
      console.log('✅ Null insert successful:', data2.id)
      
      // Clean up
      await supabase.from('customers').delete().eq('id', data2.id)
      console.log('🧹 Cleanup completed')
    }
    
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