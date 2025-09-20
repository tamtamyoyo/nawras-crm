// Development configuration
export const devConfig = {
  // Authentication settings
  skipAuth: import.meta.env.VITE_SKIP_AUTH === 'true',
  
  // Data settings
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  
  // Debug settings
  enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  
  // Timeout settings
  authTimeout: parseInt(import.meta.env.VITE_AUTH_TIMEOUT || '5000'),
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  
  // Offline mode
  offlineMode: import.meta.env.VITE_OFFLINE_MODE === 'true',
  
  // Mock data delay (for testing)
  mockDataDelay: parseInt(import.meta.env.VITE_MOCK_DATA_DELAY || '500'),
  
  // Log level
  logLevel: 'debug' as const
};

// Debug logging function
export const logDev = (message: string, data?: unknown) => {
  if (devConfig.enableDebugLogs) {
    console.log(`[DEV] ${message}`, data || '');
  }
};

export default devConfig;