// Script to create a test user for CRM testing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🔧 Creating test user...');
  
  const testUser = {
    email: 'test@nawras-crm.com',
    password: 'TestPassword123!'
  };
  
  try {
    // Try to sign up the test user
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        emailRedirectTo: undefined // Skip email confirmation
      }
    });
    
    if (error) {
      console.log('❌ User creation error:', error.message);
      
      // If user already exists, try to sign in
      if (error.message.includes('already registered')) {
        console.log('🔄 User already exists, trying to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password
        });
        
        if (signInError) {
          console.log('❌ Sign in error:', signInError.message);
        } else {
          console.log('✅ Successfully signed in existing user');
          console.log('User ID:', signInData.user?.id);
          return signInData;
        }
      }
    } else {
      console.log('✅ Test user created successfully');
      console.log('User ID:', data.user?.id);
      console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
      return data;
    }
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
  
  return null;
}

// Run the user creation
createTestUser().then((result) => {
  if (result) {
    console.log('\n🎉 Test user is ready for CRM testing!');
    console.log('Email:', 'test@nawras-crm.com');
    console.log('Password:', 'TestPassword123!');
  } else {
    console.log('\n❌ Failed to create/access test user');
  }
}).catch(console.error);