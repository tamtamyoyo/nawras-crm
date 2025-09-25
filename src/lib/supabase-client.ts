import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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
          // Handle case where url parameter is an object instead of string
          let actualUrl: string;
          if (typeof url === 'string') {
            actualUrl = url;
          } else if (url && typeof url === 'object') {
            // If url is an object, try to extract the actual URL
            if ('url' in url) {
              actualUrl = (url as any).url;
            } else if ('href' in url) {
              actualUrl = (url as any).href;
            } else {
              console.error('🚨 Invalid URL parameter received:', url);
              actualUrl = String(url);
            }
          } else {
            console.error('🚨 Invalid URL parameter type:', typeof url, url);
            actualUrl = String(url);
          }

          // Ensure API key is included in headers
          const headers: Record<string, string> = {
            'apikey': validKey,
            'Authorization': `Bearer ${validKey}`,
            'Content-Type': 'application/json',
            ...((options as RequestInit)?.headers as Record<string, string> || {})
          }
          
          const updatedOptions: RequestInit = {
            ...options,
            headers
          }
          
          // Fix malformed URL query parameters (double question marks)
          if (typeof actualUrl === 'string' && actualUrl.includes('?')) {
            let cleanUrl = actualUrl
            
            // Fix URLs with double question marks like "?select=*?order=" -> "?select=*&order="
            // But be careful not to modify table names in the path
            const urlParts = cleanUrl.split('?')
            if (urlParts.length > 2) {
              // Reconstruct URL with proper query parameter separation
              const basePath = urlParts[0]
              const queryParts = urlParts.slice(1)
              cleanUrl = basePath + '?' + queryParts.join('&')
            }
            
            // Remove malformed columns parameter that browser extensions might add
            if (cleanUrl.includes('columns=')) {
              cleanUrl = cleanUrl.replace(/[?&]columns=[^&]*(&|$)/g, (match, suffix) => {
                return suffix === '&' ? '&' : ''
              })
            }
            
            // Ensure table names in the path are not corrupted
            // Fix any table names that got corrupted with query parameters
            cleanUrl = cleanUrl.replace(/\/rest\/v1\/([^?]+)&select=([^&?]*)/g, '/rest/v1/$1?select=$2')
            
            if (cleanUrl !== actualUrl) {
              console.warn('🛡️ Fixed malformed URL:', { original: actualUrl, fixed: cleanUrl })
              actualUrl = cleanUrl
            }
          }
          
          try {
            const response = await fetch(actualUrl, updatedOptions)
            
            // Handle specific error cases to prevent console noise
            if (!response.ok) {
              // Don't log 400 errors for auth endpoints as they're expected during invalid login attempts
              if (response.status === 400 && typeof actualUrl === 'string' && actualUrl.includes('/auth/v1/token')) {
                // Silently handle auth token errors - they're expected for invalid credentials
                return response
              }
              
              // Don't log connection errors for user profile fetches - they're expected when offline
              if (response.status >= 500 && typeof actualUrl === 'string' && actualUrl.includes('/auth/v1/user')) {
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
export const supabase: SupabaseClient<Database> = createSupabaseClient()

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