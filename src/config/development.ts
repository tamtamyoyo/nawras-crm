// Development configuration for offline/local development
export const isDevelopment = import.meta.env.MODE === 'development'
export const isOfflineMode = import.meta.env.VITE_OFFLINE_MODE === 'true'

// Mock user data for development
export const mockUser = {
  id: 'dev-user-123',
  email: 'dev@nawras-crm.com',
  user_metadata: {
    full_name: 'Development User'
  }
}

export const mockProfile = {
  id: 'dev-user-123',
  email: 'dev@nawras-crm.com',
  full_name: 'Development User',
  avatar_url: null,
  phone: '+1234567890',
  company: 'Nawras CRM',
  bio: 'Development user for testing',
  role: 'admin' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Development mode settings
export const devConfig = {
  // Authentication is always required - no bypasses
  skipAuth: false,
  
  // Use real API calls for proper testing
  useMockData: false,
  
  // Offline mode for complete local development
  OFFLINE_MODE: isOfflineMode, // Use environment variable setting
  offlineMode: isOfflineMode,
  
  // Timeout settings for development
  authTimeout: 5000, // Reduced timeout for faster feedback
  apiTimeout: 5000,
  
  // Enable debug logging
  enableDebugLogs: true,
  enableAuthLogs: true // Enable authentication logging
}

export const logDev = (...args: unknown[]) => {
  if (devConfig.enableDebugLogs) {
    console.log('🔧 [DEV]', ...args)
  }
}