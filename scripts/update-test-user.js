// Script to update test user password in Supabase Auth
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ayxrdxjwyjhthkimtdja.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eHJkeGp3eWpodGhraW10ZGphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ4NzMxNSwiZXhwIjoyMDczMDYzMzE1fQ.TMGlYTFnaYdheM1cj7Sk9me1MvjrFDkfRhayBUaHsEg';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateTestUser() {
  try {
    console.log('🔐 Finding and updating test user...');
    
    // Get existing user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const existingUser = users.users.find(u => u.email === 'test@example.com');
    if (!existingUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Found test user:', existingUser.id);
    
    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { 
        password: 'TestPass1123!',
        email_confirm: true
      }
    );
    
    if (updateError) throw updateError;
    console.log('✅ Test user password updated successfully');
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: existingUser.id,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin'
      });
    
    if (profileError) {
      console.log('⚠️ Profile update error (might be expected):', profileError.message);
    } else {
      console.log('✅ Test user profile updated successfully');
    }
    
    console.log('🎉 Test user update complete!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: TestPass1123!');
    
  } catch (error) {
    console.error('❌ Error updating test user:', error.message);
    process.exit(1);
  }
}

// Run the script
updateTestUser();