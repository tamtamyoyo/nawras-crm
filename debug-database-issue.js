import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugDatabaseIssue() {
  try {
    console.log('🔍 Debugging database issue...')
    
    // Test 1: Try to insert a customer with minimal data
    console.log('\n📝 Test 1: Simple customer insert')
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: 'Debug Test Customer ' + Date.now(),
        status: 'prospect'
      })
      .select()
      .single()
    
    if (customerError) {
      console.error('❌ Customer insert error:', customerError)
      console.error('Error details:', {
        code: customerError.code,
        message: customerError.message,
        details: customerError.details,
        hint: customerError.hint
      })
    } else {
      console.log('✅ Customer created successfully:', customer)
    }
    
    // Test 2: Try to insert a lead
    console.log('\n📝 Test 2: Simple lead insert')
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: 'Debug Test Lead ' + Date.now(),
        status: 'new'
      })
      .select()
      .single()
    
    if (leadError) {
      console.error('❌ Lead insert error:', leadError)
      console.error('Error details:', {
        code: leadError.code,
        message: leadError.message,
        details: leadError.details,
        hint: leadError.hint
      })
    } else {
      console.log('✅ Lead created successfully:', lead)
    }
    
    // Test 3: Try to insert an invoice
    console.log('\n📝 Test 3: Simple invoice insert')
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: 'DEBUG-' + Date.now(),
        customer_id: customer?.id || '550e8400-e29b-41d4-a716-446655440000',
        amount: 100.00,
        due_date: '2024-12-31',
        items: []
      })
      .select()
      .single()
    
    if (invoiceError) {
      console.error('❌ Invoice insert error:', invoiceError)
      console.error('Error details:', {
        code: invoiceError.code,
        message: invoiceError.message,
        details: invoiceError.details,
        hint: invoiceError.hint
      })
    } else {
      console.log('✅ Invoice created successfully:', invoice)
    }
    
    // Test 4: Check if there are any triggers or functions causing issues
    console.log('\n🔍 Test 4: Checking database schema')
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            trigger_name, 
            event_manipulation, 
            event_object_table,
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_schema = 'public' 
          AND event_object_table IN ('customers', 'leads', 'invoices')
          ORDER BY event_object_table, trigger_name;
        `
      })
    
    if (triggerError) {
      console.log('⚠️ Could not check triggers:', triggerError.message)
    } else {
      console.log('📋 Database triggers:', triggers)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

debugDatabaseIssue()