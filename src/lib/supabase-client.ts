import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' && (window as Record<string, unknown>).VITE_SUPABASE_URL as string)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && (window as Record<string, unknown>).VITE_SUPABASE_ANON_KEY as string)

// Check if Supabase configuration is valid
const isValidSupabaseConfig = (
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-supabase-anon-key-here' &&
  !supabaseUrl.includes('rnqjqhqhqhqhqhqhqhqh')
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

  // Create Supabase client with fallback values and optimized settings
  supabaseInstance = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
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
          // Fix browser extension interference that adds malformed 'columns=' parameter
          if (typeof url === 'string' && url.includes('columns=') && url.includes('select=')) {
            // Remove the malformed columns parameter that browser extensions might add
            const cleanUrl = url.replace(/[?&]columns=[^&]*(&|$)/g, (match, suffix) => {
              return suffix === '&' ? '&' : ''
            })
            // Only log in development mode to reduce console noise
            if (import.meta.env.DEV) {
              console.warn('🛡️ Fixed malformed URL caused by browser extension:', { original: url, fixed: cleanUrl })
            }
            url = cleanUrl
          }
          
          try {
            const response = await fetch(url, options)
            
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
export type User = Tables['users']['Row']
export type Invoice = Tables['invoices']['Row']