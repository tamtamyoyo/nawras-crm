import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Use anon key like the frontend does
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertOperations() {
  console.log('=== Testing INSERT Operations (Anonymous User) ===\n');
  
  // Test customer insert
  console.log('1. Testing Customer Insert:');
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        company: 'Test Company',
        status: 'active'
      })
      .select();
    
    if (error) {
      console.log('❌ Customer insert failed:', error.message);
      console.log('   Error details:', error);
    } else {
      console.log('✅ Customer insert successful:', data);
    }
  } catch (err) {
    console.log('❌ Customer insert exception:', err.message);
  }
  
  console.log('\n2. Testing Lead Insert:');
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: 'Test Lead',
        email: 'lead@example.com',
        phone: '1234567890',
        company: 'Test Lead Company',
        status: 'new',
        source: 'website'
      })
      .select();
    
    if (error) {
      console.log('❌ Lead insert failed:', error.message);
      console.log('   Error details:', error);
    } else {
      console.log('✅ Lead insert successful:', data);
    }
  } catch (err) {
    console.log('❌ Lead insert exception:', err.message);
  }
  
  console.log('\n3. Testing Invoice Insert:');
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: 'TEST-001',
        customer_id: '00000000-0000-0000-0000-000000000001', // dummy UUID
        amount: 100.00,
        status: 'draft',
        due_date: new Date().toISOString().split('T')[0]
      })
      .select();
    
    if (error) {
      console.log('❌ Invoice insert failed:', error.message);
      console.log('   Error details:', error);
    } else {
      console.log('✅ Invoice insert successful:', data);
    }
  } catch (err) {
    console.log('❌ Invoice insert exception:', err.message);
  }
  
  // Test with authentication
  console.log('\n=== Testing with Authentication ===');
  
  // Try to sign in (this will likely fail but let's see)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword'
  });
  
  if (authError) {
    console.log('❌ Authentication failed (expected):', authError.message);
  } else {
    console.log('✅ Authentication successful:', authData.user?.email);
    
    // Retry lead insert with authentication
    console.log('\n4. Testing Lead Insert (Authenticated):');
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: 'Authenticated Test Lead',
          email: 'auth-lead@example.com',
          phone: '1234567890',
          company: 'Auth Test Company',
          status: 'new',
          source: 'website'
        })
        .select();
      
      if (error) {
        console.log('❌ Authenticated lead insert failed:', error.message);
      } else {
        console.log('✅ Authenticated lead insert successful:', data);
      }
    } catch (err) {
      console.log('❌ Authenticated lead insert exception:', err.message);
    }
  }
}

testInsertOperations();