/**
 * Test script to verify UUID fixes for created_by fields
 * This script tests customer, lead, and invoice creation with proper UUID handling
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODczMTUsImV4cCI6MjA3MzA2MzMxNX0.SwVSA7h-QwZ3km3ms5ENUx6fl1n_EdJhx8XQNI044rg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUUIDFixes() {
  console.log('🧪 Testing UUID fixes for created_by fields...')
  
  try {
    // Test 1: Customer creation with null user (unauthenticated)
    console.log('\n1. Testing customer creation with null user...')
    const customerData = {
      name: 'Test Customer UUID Fix',
      email: 'test-uuid@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      status: 'active',
      notes: 'Testing UUID fix',
      created_by: null, // This should work now
      responsible_person: 'Mr. Ali'
    }
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()
    
    if (customerError) {
      console.error('❌ Customer creation failed:', customerError)
    } else {
      console.log('✅ Customer created successfully:', customer.id)
    }
    
    // Test 2: Lead creation with null user (unauthenticated)
    console.log('\n2. Testing lead creation with null user...')
    const leadData = {
      name: 'Test Lead UUID Fix',
      email: 'test-lead-uuid@example.com',
      phone: '+1234567891',
      company: 'Test Lead Company',
      source: 'Website',
      status: 'new',
      score: 75,
      notes: 'Testing UUID fix for leads',
      responsible_person: 'Mr. Ali',
      lifecycle_stage: 'lead',
      priority_level: 'medium',
      contact_preference: 'email',
      follow_up_date: null,
      created_by: null // This should work now
    }
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()
    
    if (leadError) {
      console.error('❌ Lead creation failed:', leadError)
    } else {
      console.log('✅ Lead created successfully:', lead.id)
    }
    
    // Test 3: Invoice creation with null user (unauthenticated)
    console.log('\n3. Testing invoice creation with null user...')
    
    // First, we need a customer for the invoice
    let customerId = customer?.id
    if (!customerId) {
      // Create a customer for the invoice test
      const { data: invoiceCustomer } = await supabase
        .from('customers')
        .insert([{
          name: 'Invoice Test Customer',
          email: 'invoice-test@example.com',
          status: 'active',
          created_by: null,
          responsible_person: 'Mr. Ali'
        }])
        .select()
        .single()
      customerId = invoiceCustomer?.id
    }
    
    if (customerId) {
      const invoiceData = {
        customer_id: customerId,
        invoice_number: `INV-TEST-${Date.now()}`,
        total_amount: 1000.00,
        status: 'draft',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tax_rate: 0.1,
        source: 'Test',
        created_by: null, // This should work now
        responsible_person: 'Mr. Ali',
        billing_address: '123 Test Street, Test City'
      }
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()
      
      if (invoiceError) {
        console.error('❌ Invoice creation failed:', invoiceError)
      } else {
        console.log('✅ Invoice created successfully:', invoice.id)
      }
    } else {
      console.error('❌ Could not create customer for invoice test')
    }
    
    console.log('\n🎉 UUID fix testing completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testUUIDFixes()