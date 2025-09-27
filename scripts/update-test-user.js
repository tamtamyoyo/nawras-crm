// Script to update test user password in Supabase Auth
import { supabase } from './test-config.js';

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