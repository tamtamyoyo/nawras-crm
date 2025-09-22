import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔧 Using Supabase config from .env:', {
  url: `${supabaseUrl.substring(0, 30)}...`,
  key: `${supabaseAnonKey.substring(0, 20)}...`
});

// Create Supabase client exactly like the frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'nawras-crm@1.0.0'
    }
  }
});

async function testCustomerSave() {
  console.log('🧪 Testing customer save operation (mimicking frontend)...');
  
  try {
    // Test data - exactly like frontend would send
    const testCustomer = {
      name: 'Frontend Test Customer',
      email: 'frontend-test@example.com',
      status: 'prospect',
      created_by: '550e8400-e29b-41d4-a716-446655440001' // Use existing user ID
    };

    console.log('📝 Attempting to create customer:', testCustomer);

    // Use the same approach as the frontend - simple insert
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...testCustomer })
      .select();

    if (error) {
      console.error('❌ Error creating customer:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      console.error('Error details:', error);
    } else {
      console.log('✅ Customer created successfully:', data);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  // Test reading customers
  try {
    console.log('\n📖 Testing customer read operation...');
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error reading customers:', error);
    } else {
      console.log(`✅ Customers read successfully. Count: ${customers.length}`);
      if (customers.length > 0) {
        console.log('Sample customer:', customers[0]);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error reading customers:', error);
  }
}

testCustomerSave();