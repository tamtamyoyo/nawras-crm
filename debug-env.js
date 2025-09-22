// Debug script to check environment variables in production
console.log('🔍 Environment Variables Debug:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');
console.log('VITE_APP_NAME:', import.meta.env.VITE_APP_NAME || 'MISSING');
console.log('VITE_OFFLINE_MODE:', import.meta.env.VITE_OFFLINE_MODE || 'MISSING');
console.log('All env vars:', import.meta.env);

// Test Supabase client creation
import { supabase } from './src/lib/supabase-client.js';
console.log('🔧 Supabase client:', supabase);

// Test a simple query
try {
  const { data, error } = await supabase.from('leads').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('❌ Supabase query error:', error);
  } else {
    console.log('✅ Supabase query success:', data);
  }
} catch (err) {
  console.error('❌ Supabase connection error:', err);
}