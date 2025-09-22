import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' && (window as Record<string, string>).VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && (window as Record<string, string>).VITE_SUPABASE_ANON_KEY)

// Check if Supabase configuration is valid
const isValidSupabaseConfig = (
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your-supabase-anon-key-here' &&
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  !supabaseUrl.includes('rnqjqhqhqhqhqhqhqhqh') &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
)

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Application will run in offline mode.')
} else if (!isValidSupabaseConfig) {
  console.warn('Invalid Supabase configuration detected. Please update your .env file with valid Supabase credentials.')
} else {
  console.log('🔧 Supabase config:', {
    url: `${supabaseUrl.substring(0, 30)}...`,
    key: `${supabaseAnonKey.substring(0, 20)}...`
  })
}

// Singleton pattern to prevent multiple GoTrueClient instances
let supabaseInstance: SupabaseClient<Database> | null = null

function createSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Validate URLs before creating client to prevent validation errors
  const validUrl = (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) 
    ? supabaseUrl 
    : 'https://demo-project.supabase.co'
  
  const validKey = (supabaseAnonKey && supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('your_')) 
    ? supabaseAnonKey 
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

  // Create Supabase client with validated values and optimized settings
  supabaseInstance = createClient<Database>(
    validUrl,
    validKey,
    {
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
        },
        fetch: async (url, options = {}) => {
          // Ensure API key is included in headers
          const headers = {
            'apikey': validKey,
            'Authorization': `Bearer ${validKey}`,
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {})
          }
          
          const updatedOptions = {
            ...options,
            headers
          }
          
          // Remove malformed columns parameter that browser extensions might add
          if (typeof url === 'string' && url.includes('columns=') && url.includes('select=')) {
            let cleanUrl = url.replace(/[?&]columns=[^&]*(&|$)/g, (match, suffix) => {
              return suffix === '&' ? '&' : ''
            })
            
            if (cleanUrl !== url) {
              console.warn('🛡️ Removed malformed columns parameter:', { original: url, fixed: cleanUrl })
              url = cleanUrl
            }
          }
          
          try {
            const response = await fetch(url, updatedOptions)
            
            // Handle specific error cases to prevent console noise
            if (!response.ok) {
              // Don't log 400 errors for auth endpoints as they're expected during invalid login attempts
              if (response.status === 400 && typeof url === 'string' && url.includes('/auth/v1/token')) {
                // Silently handle auth token errors - they're expected for invalid credentials
                return response
              }
              
              // Don't log connection errors for user profile fetches - they're handled by retry logic
              if (typeof url === 'string' && url.includes('/rest/v1/users')) {
                // Let the retry logic handle these errors without console noise
                return response
              }
            }
            
            return response
          } catch (error) {
            // Handle network errors gracefully
            if (error instanceof Error) {
              // Don't log connection errors for expected endpoints
              if (typeof url === 'string' && (url.includes('/rest/v1/users') || url.includes('/auth/v1/token'))) {
                // These errors are handled by application retry logic
                throw error
              }
            }
            throw error
          }
        }
      }
    }
  )

  return supabaseInstance
}

// Export typed client using singleton pattern
export const supabase = createSupabaseClient()

// Export configuration status for use in components
export const isSupabaseConfigured = isValidSupabaseConfig

// Export table types for convenience
export type Tables = Database['public']['Tables']
export type Proposal = Tables['proposals']['Row']
export type ProposalInsert = Tables['proposals']['Insert']
export type ProposalUpdate = Tables['proposals']['Update']
export type Deal = Tables['deals']['Row']
export type Customer = Tables['customers']['Row']
export type Lead = Tables['leads']['Row']
// Removed User type export since we don't have a users table
export type Invoice = Tables['invoices']['Row']