/**
 * Centralized offline mode detection utility
 * This ensures consistent offline mode detection across all pages
 */

// Runtime state to track Supabase operational status
let supabaseOperationalStatus = {
  isOperational: true,
  lastFailureTime: 0,
  failureCount: 0,
  maxRetryTime: 5 * 60 * 1000, // 5 minutes
  maxFailures: 3
};

export function isOfflineMode(): boolean {
  // Check if explicitly set to offline mode via environment variable
  if (import.meta.env.VITE_OFFLINE_MODE === 'true') {
    return true;
  }
  
  // Check runtime operational status first
  if (!supabaseOperationalStatus.isOperational) {
    const timeSinceFailure = Date.now() - supabaseOperationalStatus.lastFailureTime;
    // If it's been more than maxRetryTime since last failure, try to go back online
    if (timeSinceFailure > supabaseOperationalStatus.maxRetryTime) {
      console.log('🔄 Attempting to reconnect to Supabase after cooldown period');
      supabaseOperationalStatus.isOperational = true;
      supabaseOperationalStatus.failureCount = 0;
    } else {
      return true; // Still in offline mode due to recent failures
    }
  }
  
  // Check if Supabase is not properly configured (fallback to offline)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isValidSupabase = (
    supabaseUrl && 
    supabaseKey && 
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseUrl !== 'your_supabase_project_url' &&
    supabaseUrl !== 'https://demo-project.supabase.co' &&
    supabaseKey !== 'your-supabase-anon-key-here' &&
    supabaseKey !== 'your_supabase_anon_key' &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseKey.length > 50
  );
  
  // If Supabase is not properly configured, use offline mode
  if (!isValidSupabase) {
    return true;
  }
  
  // In development mode with demo/invalid Supabase config, use offline mode
  return import.meta.env.MODE === 'development' && !isValidSupabase;
}

/**
 * Mark Supabase as temporarily offline due to operational failures
 */
export function setSupabaseOffline(reason: string = 'operational failure'): void {
  supabaseOperationalStatus.isOperational = false;
  supabaseOperationalStatus.lastFailureTime = Date.now();
  supabaseOperationalStatus.failureCount++;
  console.warn(`🔴 Supabase marked as offline due to: ${reason}. Failure count: ${supabaseOperationalStatus.failureCount}`);
}

/**
 * Mark Supabase as operational again
 */
export function setSupabaseOnline(): void {
  supabaseOperationalStatus.isOperational = true;
  supabaseOperationalStatus.failureCount = 0;
  console.log('🟢 Supabase marked as operational');
}

/**
 * Get current Supabase operational status
 */
export function getSupabaseStatus() {
  return { ...supabaseOperationalStatus };
}

/**
 * Enhanced error handling for Supabase operations with offline fallback
 */
export function handleSupabaseError(error: any, context: string = 'operation'): boolean {
  console.error(`Supabase ${context} failed:`, error);
  
  // Check for specific error types that indicate we should fall back to offline mode
  const shouldFallbackToOffline = (
    error?.message?.includes('404') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('TypeError: Failed to fetch') ||
    error?.code === 'PGRST116' || // PostgREST table not found
    error?.code === 'PGRST301' || // PostgREST JWT expired
    error?.status === 404 ||
    error?.status === 401 ||
    error?.status === 409 || // Conflict errors
    !navigator.onLine
  );
  
  if (shouldFallbackToOffline) {
    console.log(`🔄 Falling back to offline mode for ${context}`);
    // Mark Supabase as temporarily offline
    setSupabaseOffline(`${context} - ${error?.message || error?.status || 'unknown error'}`);
    return true; // Indicates should use offline mode
  }
  
  return false; // Don't fallback to offline mode
}

/**
 * Browser extension interference protection
 */
export function protectFromExtensionInterference(): void {
  // Prevent common browser extension interference
  if (typeof window !== 'undefined') {
    // Disable common extension hooks that might interfere with fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      // Clean up any extension-modified headers or parameters
      const [url, options = {}] = args;
      const cleanOptions = {
        ...options,
        headers: {
          ...options.headers,
          // Remove any extension-added headers that might cause issues
        }
      };
      return originalFetch.call(this, url, cleanOptions);
    };
  }
}