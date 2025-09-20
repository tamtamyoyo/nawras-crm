import { supabase } from '../lib/supabase-client'

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

/**
 * Executes a Supabase operation with exponential backoff retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain error types
      if (isNonRetryableError(error)) {
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        console.error(`Operation failed after ${config.maxRetries + 1} attempts:`, lastError)
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      )

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
      await sleep(delay)
    }
  }

  throw lastError!
}

/**
 * Determines if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  
  // Don't retry authentication errors
  if (message.includes('invalid_grant') || 
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('invalid_credentials')) {
    return true
  }

  // Don't retry validation errors
  if (message.includes('validation') || 
      message.includes('invalid_input') ||
      message.includes('bad_request')) {
    return true
  }

  return false
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wrapper for Supabase select operations with retry logic
 */
export async function selectWithRetry<T>(
  query: () => Promise<{ data: T | null; error: Error | null }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: Error | null }> {
  return withRetry(async () => {
    const result = await query()
    if (result.error) {
      throw result.error
    }
    return result
  }, options)
}

/**
 * Wrapper for Supabase insert operations with retry logic
 */
export async function insertWithRetry<T>(
  query: () => Promise<{ data: T | null; error: Error | null }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: Error | null }> {
  return withRetry(async () => {
    const result = await query()
    if (result.error) {
      throw result.error
    }
    return result
  }, options)
}

/**
 * Wrapper for Supabase update operations with retry logic
 */
export async function updateWithRetry<T>(
  query: () => Promise<{ data: T | null; error: Error | null }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: Error | null }> {
  return withRetry(async () => {
    const result = await query()
    if (result.error) {
      throw result.error
    }
    return result
  }, options)
}

/**
 * Wrapper for Supabase delete operations with retry logic
 */
export async function deleteWithRetry<T>(
  query: () => Promise<{ data: T | null; error: Error | null }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: Error | null }> {
  return withRetry(async () => {
    const result = await query()
    if (result.error) {
      throw result.error
    }
    return result
  }, options)
}

/**
 * Health check for Supabase connection
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()
    
    // If we get a 'no rows' error, that's actually good - it means we can connect
    if (error && !error.message.includes('No rows')) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}