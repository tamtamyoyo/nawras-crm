// Test configuration - uses environment variables for security
import { createClient } from '@supabase/supabase-js'

// Use environment variables or fallback to test-specific values
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.TEST_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.TEST_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please set environment variables:')
  console.error('- VITE_SUPABASE_URL or TEST_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY or TEST_SUPABASE_ANON_KEY')
  process.exit(1)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export { supabaseUrl, supabaseAnonKey }