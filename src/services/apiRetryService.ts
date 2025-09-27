interface RetryConfig {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: unknown) => boolean
  onRetry?: (attempt: number, error: unknown) => void
}

interface ApiCallOptions extends RetryConfig {
  timeout?: number
  headers?: Record<string, string>
  signal?: AbortSignal
}

class ApiRetryService {
  private defaultConfig: Required<RetryConfig> = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    retryCondition: (error: unknown) => {
      // Retry on network errors, 5xx errors, and specific 4xx errors
      if (!(error as any)?.response) return true // Network error
      const status = (error as any)?.response?.status || (error as any)?.status
      return status >= 500 || status === 408 || status === 429 // Server errors, timeout, rate limit
    },
    onRetry: () => {}
  }

  constructor(private config: Partial<RetryConfig> = {}) {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }

  /**
   * Execute an API call with retry logic
   */
  async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultConfig, ...options }
    let lastError: unknown

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Add timeout wrapper if specified
        if (options.timeout) {
          return await this.withTimeout(apiCall(), options.timeout)
        }
        return await apiCall()
      } catch (error) {
        lastError = error
        
        // Don't retry if it's the last attempt
        if (attempt === config.maxRetries) {
          break
        }

        // Check if we should retry this error
        if (!config.retryCondition(error)) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        )

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000

        console.warn(`API call failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${Math.round(jitteredDelay)}ms:`, error)
        
        // Call retry callback
        config.onRetry(attempt + 1, error)

        // Wait before retrying
        await this.delay(jitteredDelay)
      }
    }

    throw lastError
  }

  /**
   * Fetch wrapper with retry logic
   */
  async fetchWithRetry(
    url: string,
    init: RequestInit = {},
    options: ApiCallOptions = {}
  ): Promise<Response> {
    const config = { ...this.defaultConfig, ...options }
    
    return this.executeWithRetry(async () => {
      const controller = new AbortController()
      const timeoutId = options.timeout ? setTimeout(() => controller.abort(), options.timeout) : null
      
      try {
        const response = await fetch(url, {
          ...init,
          signal: options.signal || controller.signal,
          headers: {
            ...init.headers,
            ...options.headers
          }
        })

        if (timeoutId) clearTimeout(timeoutId)

        // Check if response is ok
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          ;(error as any).response = response
          ;(error as any).status = response.status
          throw error
        }

        return response
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId)
        throw error
      }
    }, config)
  }

  /**
   * JSON API call with retry logic
   */
  async jsonWithRetry<T>(
    url: string,
    init: RequestInit = {},
    options: ApiCallOptions = {}
  ): Promise<T> {
    const response = await this.fetchWithRetry(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers
      }
    }, options)

    return response.json()
  }

  /**
   * POST request with retry logic
   */
  async postWithRetry<T>(
    url: string,
    data: unknown,
    options: ApiCallOptions = {}
  ): Promise<T> {
    return this.jsonWithRetry<T>(url, {
      method: 'POST',
      body: JSON.stringify(data)
    }, options)
  }

  /**
   * PUT request with retry logic
   */
  async putWithRetry<T>(
    url: string,
    data: unknown,
    options: ApiCallOptions = {}
  ): Promise<T> {
    return this.jsonWithRetry<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, options)
  }

  /**
   * DELETE request with retry logic
   */
  async deleteWithRetry<T>(
    url: string,
    options: ApiCallOptions = {}
  ): Promise<T> {
    return this.jsonWithRetry<T>(url, {
      method: 'DELETE'
    }, options)
  }

  /**
   * GET request with retry logic
   */
  async getWithRetry<T>(
    url: string,
    options: ApiCallOptions = {}
  ): Promise<T> {
    return this.jsonWithRetry<T>(url, {
      method: 'GET'
    }, options)
  }

  /**
   * Supabase-specific retry wrapper
   */
  async supabaseWithRetry<T>(
    supabaseCall: () => Promise<{ data: T | null; error: unknown }>,
    options: ApiCallOptions = {}
  ): Promise<T> {
    const config = {
      ...this.defaultConfig,
      ...options,
      retryCondition: (error: unknown) => {
        // Retry on network errors and specific Supabase errors
        if (!error) return false
        if ((error as any)?.code === 'PGRST301') return true // Connection error
        if ((error as any)?.code === 'PGRST116') return true // Connection timeout
        if ((error as any)?.message?.includes('network')) return true
        if ((error as any)?.message?.includes('timeout')) return true
        return false
      }
    }

    return this.executeWithRetry(async () => {
      const { data, error } = await supabaseCall()
      
      if (error) {
        throw error
      }
      
      if (data === null) {
        throw new Error('No data returned from Supabase')
      }
      
      return data
    }, config)
  }

  /**
   * Batch API calls with retry logic
   */
  async batchWithRetry<T>(
    apiCalls: (() => Promise<T>)[],
    options: ApiCallOptions & { concurrency?: number } = {}
  ): Promise<T[]> {
    const concurrency = options.concurrency || 5
    const results: T[] = []
    
    for (let i = 0; i < apiCalls.length; i += concurrency) {
      const batch = apiCalls.slice(i, i + concurrency)
      const batchPromises = batch.map(call => 
        this.executeWithRetry(call, options)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  /**
   * Circuit breaker pattern for failing services
   */
  createCircuitBreaker<T>(
    apiCall: () => Promise<T>,
    options: {
      failureThreshold?: number
      resetTimeout?: number
      monitoringPeriod?: number
    } = {}
  ) {
    const config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      ...options
    }

    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
    let failureCount = 0
    let lastFailureTime = 0
    let successCount = 0

    return async (): Promise<T> => {
      const now = Date.now()

      // Reset failure count after monitoring period
      if (now - lastFailureTime > config.monitoringPeriod) {
        failureCount = 0
      }

      // Check if circuit should be half-open
      if (state === 'OPEN' && now - lastFailureTime > config.resetTimeout) {
        state = 'HALF_OPEN'
        successCount = 0
      }

      // Reject immediately if circuit is open
      if (state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable')
      }

      try {
        const result = await this.executeWithRetry(apiCall)
        
        // Success in half-open state
        if (state === 'HALF_OPEN') {
          successCount++
          if (successCount >= 3) {
            state = 'CLOSED'
            failureCount = 0
          }
        }
        
        return result
      } catch (error) {
        failureCount++
        lastFailureTime = now
        
        // Open circuit if failure threshold reached
        if (failureCount >= config.failureThreshold) {
          state = 'OPEN'
          console.warn(`Circuit breaker opened after ${failureCount} failures`)
        }
        
        throw error
      }
    }
  }

  /**
   * Add timeout to any promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      })
    ])
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get retry statistics
   */
  getRetryStatistics() {
    // This would be implemented with actual tracking in a real application
    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryDelay: 0
    }
  }
}

// Create a singleton instance
const apiRetryService = new ApiRetryService()

export default apiRetryService
export { ApiRetryService }
export type { RetryConfig, ApiCallOptions }