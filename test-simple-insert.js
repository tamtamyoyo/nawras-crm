import { supabase } from './test-config.js'

// Test simple customer insert without any complex fields

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