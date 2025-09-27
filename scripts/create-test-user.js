// Script to create test user in Supabase Auth
import { supabase } from './test-config.js';

async function createTestUser() {
  try {
    console.log('🔐 Creating test user in Supabase Auth...');
    
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'TestPass1123!',
      user_metadata: {
        full_name: 'Test User'
      },
      email_confirm: true // Skip email confirmation for testing
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Test user already exists in auth, updating password...');
        
        // Get existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.users.find(u => u.email === 'test@example.com');
        if (existingUser) {
          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: 'TestPass1123!' }
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
          
          if (profileError) throw profileError;
          console.log('✅ Test user profile updated successfully');
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Test user created successfully in auth');
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'admin'
        });
      
      if (profileError) throw profileError;
      console.log('✅ Test user profile created successfully');
    }
    
    console.log('🎉 Test user setup complete!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: TestPass1123!');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestUser();