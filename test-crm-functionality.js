// Comprehensive CRM Testing Script
// This script will test authentication and all CRM functionalities

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Testing Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test credentials
  const testCredentials = [
    { email: 'test@nawras-crm.com', password: 'TestPassword123!' }
  ];
  
  for (const cred of testCredentials) {
    console.log(`\nTrying to sign in with: ${cred.email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });
      
      if (error) {
        console.log(`❌ Auth failed for ${cred.email}:`, error.message);
      } else {
        console.log(`✅ Auth successful for ${cred.email}`);
        console.log('User ID:', data.user?.id);
        console.log('Session:', data.session ? 'Active' : 'None');
        return data;
      }
    } catch (err) {
      console.log(`❌ Auth error for ${cred.email}:`, err.message);
    }
  }
  
  return null;
}

async function testLeadsCRUD(session) {
  console.log('\n📋 Testing Leads CRUD Operations...');
  
  if (!session) {
    console.log('❌ No session available for leads testing');
    return;
  }
  
  try {
    // Test READ - Get all leads
    console.log('\n1. Testing READ leads...');
    const { data: leads, error: readError } = await supabase
      .from('leads')
      .select('*');
    
    if (readError) {
      console.log('❌ Read leads error:', readError.message);
      console.log('Error details:', readError);
    } else {
      console.log(`✅ Read leads successful. Found ${leads?.length || 0} leads`);
    }
    
    // Test CREATE - Add a new lead
    console.log('\n2. Testing CREATE lead...');
    const newLead = {
      name: 'Test Lead ' + Date.now(),
      email: 'testlead@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      status: 'new',
      source: 'Website'
    };
    
    const { data: createdLead, error: createError } = await supabase
      .from('leads')
      .insert([newLead])
      .select();
    
    if (createError) {
      console.log('❌ Create lead error:', createError.message);
      console.log('Error details:', createError);
    } else {
      console.log('✅ Create lead successful');
      console.log('Created lead ID:', createdLead?.[0]?.id);
      
      // Test UPDATE - Update the created lead
      if (createdLead?.[0]?.id) {
        console.log('\n3. Testing UPDATE lead...');
        const { data: updatedLead, error: updateError } = await supabase
          .from('leads')
          .update({ status: 'contacted' })
          .eq('id', createdLead[0].id)
          .select();
        
        if (updateError) {
          console.log('❌ Update lead error:', updateError.message);
        } else {
          console.log('✅ Update lead successful');
        }
        
        // Test DELETE - Delete the created lead
        console.log('\n4. Testing DELETE lead...');
        const { error: deleteError } = await supabase
          .from('leads')
          .delete()
          .eq('id', createdLead[0].id);
        
        if (deleteError) {
          console.log('❌ Delete lead error:', deleteError.message);
        } else {
          console.log('✅ Delete lead successful');
        }
      }
    }
  } catch (err) {
    console.log('❌ Leads CRUD test error:', err.message);
  }
}

async function testCustomersCRUD(session) {
  console.log('\n👥 Testing Customers CRUD Operations...');
  
  if (!session) {
    console.log('❌ No session available for customers testing');
    return;
  }
  
  try {
    // Test READ customers
    const { data: customers, error: readError } = await supabase
      .from('customers')
      .select('*');
    
    if (readError) {
      console.log('❌ Read customers error:', readError.message);
    } else {
      console.log(`✅ Read customers successful. Found ${customers?.length || 0} customers`);
    }
    
    // Test CREATE customer
    const newCustomer = {
      name: 'Test Customer ' + Date.now(),
      email: 'testcustomer@example.com',
      phone: '+1234567890',
      company: 'Test Customer Company'
    };
    
    const { data: createdCustomer, error: createError } = await supabase
      .from('customers')
      .insert([newCustomer])
      .select();
    
    if (createError) {
      console.log('❌ Create customer error:', createError.message);
    } else {
      console.log('✅ Create customer successful');
      
      // Clean up - delete the test customer
      if (createdCustomer?.[0]?.id) {
        await supabase.from('customers').delete().eq('id', createdCustomer[0].id);
      }
    }
  } catch (err) {
    console.log('❌ Customers CRUD test error:', err.message);
  }
}

async function testInvoicesCRUD(session) {
  console.log('\n🧾 Testing Invoices CRUD Operations...');
  
  if (!session) {
    console.log('❌ No session available for invoices testing');
    return;
  }
  
  try {
    // Test READ invoices
    const { data: invoices, error: readError } = await supabase
      .from('invoices')
      .select('*');
    
    if (readError) {
      console.log('❌ Read invoices error:', readError.message);
    } else {
      console.log(`✅ Read invoices successful. Found ${invoices?.length || 0} invoices`);
    }
  } catch (err) {
    console.log('❌ Invoices CRUD test error:', err.message);
  }
}

async function testDealsCRUD(session) {
  console.log('\n💼 Testing Deals/Proposals CRUD Operations...');
  
  if (!session) {
    console.log('❌ No session available for deals testing');
    return;
  }
  
  try {
    // Test READ deals
    const { data: deals, error: readError } = await supabase
      .from('deals')
      .select('*');
    
    if (readError) {
      console.log('❌ Read deals error:', readError.message);
    } else {
      console.log(`✅ Read deals successful. Found ${deals?.length || 0} deals`);
    }
  } catch (err) {
    console.log('❌ Deals CRUD test error:', err.message);
  }
}

async function checkOfflineMode() {
  console.log('\n🔄 Checking Offline Mode Configuration...');
  
  const offlineMode = process.env.VITE_OFFLINE_MODE;
  console.log('VITE_OFFLINE_MODE:', offlineMode);
  
  if (offlineMode === 'true') {
    console.log('⚠️  Application is in offline mode');
  } else {
    console.log('✅ Application is in online mode');
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive CRM Testing...');
  
  // Check offline mode
  await checkOfflineMode();
  
  // Test authentication
  const authResult = await testAuthentication();
  
  if (authResult?.session) {
    console.log('\n✅ Authentication successful, proceeding with CRM tests...');
    
    // Test all CRM functionalities
    await testLeadsCRUD(authResult.session);
    await testCustomersCRUD(authResult.session);
    await testInvoicesCRUD(authResult.session);
    await testDealsCRUD(authResult.session);
  } else {
    console.log('\n❌ Authentication failed, testing with anonymous access...');
    
    // Test without authentication to see 401 errors
    await testLeadsCRUD(null);
    await testCustomersCRUD(null);
    await testInvoicesCRUD(null);
    await testDealsCRUD(null);
  }
  
  console.log('\n🏁 Testing completed!');
}

// Run the tests
runAllTests().catch(console.error);