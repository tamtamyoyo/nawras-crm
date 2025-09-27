import { PostgrestError } from '@supabase/supabase-js'
import apiRetryService from './apiRetryService'
import offlineService from './offlineService'

interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
  originalError?: unknown
}

interface DatabaseOperation {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  data?: unknown
  filters?: Record<string, unknown>
  options?: Record<string, unknown>
}

interface FallbackStrategy {
  useCache?: boolean
  useOfflineQueue?: boolean
  useDefaultValue?: unknown
  retryCount?: number
  customFallback?: (error: DatabaseError, operation: DatabaseOperation) => Promise<any>
}

interface DatabaseErrorHandlingConfig {
  enableRetry?: boolean
  enableOfflineQueue?: boolean
  enableCaching?: boolean
  maxRetries?: number
  retryDelay?: number
  cacheTimeout?: number
  logErrors?: boolean
}

class DatabaseErrorHandlingService {
  private config: Required<DatabaseErrorHandlingConfig>
  private errorCounts: Map<string, number> = new Map()
  private lastErrors: Map<string, DatabaseError> = new Map()
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map()

  constructor(config: DatabaseErrorHandlingConfig = {}) {
    this.config = {
      enableRetry: true,
      enableOfflineQueue: true,
      enableCaching: true,
      maxRetries: 3,
      retryDelay: 1000,
      cacheTimeout: 300000, // 5 minutes
      logErrors: true,
      ...config
    }

    this.setupDefaultFallbackStrategies()
  }

  /**
   * Setup default fallback strategies for common operations
   */
  private setupDefaultFallbackStrategies(): void {
    // Read operations - use cache as fallback
    this.fallbackStrategies.set('select', {
      useCache: true,
      useDefaultValue: [],
      retryCount: 2
    })

    // Write operations - use offline queue
    this.fallbackStrategies.set('insert', {
      useOfflineQueue: true,
      retryCount: 3
    })

    this.fallbackStrategies.set('update', {
      useOfflineQueue: true,
      retryCount: 3
    })

    this.fallbackStrategies.set('delete', {
      useOfflineQueue: true,
      retryCount: 2
    })

    this.fallbackStrategies.set('upsert', {
      useOfflineQueue: true,
      retryCount: 3
    })
  }

  /**
   * Execute database operation with error handling
   */
  async executeWithErrorHandling<T>(
    operation: DatabaseOperation,
    databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    fallbackStrategy?: FallbackStrategy
  ): Promise<T> {
    const strategy = fallbackStrategy || this.fallbackStrategies.get(operation.operation) || {}
    const operationKey = `${operation.table}.${operation.operation}`

    try {
      // Try to get from cache first for read operations
      if (operation.operation === 'select' && strategy.useCache && this.config.enableCaching) {
        const cached = offlineService.getCachedData<T>(operationKey, this.config.cacheTimeout)
        if (cached) {
          return cached
        }
      }

      // Execute the database operation with retry logic
      const result = await this.executeWithRetry(databaseCall, strategy.retryCount || this.config.maxRetries)
      
      if (result.error) {
        throw this.createDatabaseError(result.error)
      }

      if (result.data === null) {
        throw this.createDatabaseError({ message: 'No data returned', code: 'NO_DATA' } as PostgrestError)
      }

      // Cache successful read operations
      if (operation.operation === 'select' && this.config.enableCaching) {
        offlineService.setCachedData(operationKey, result.data)
      }

      // Reset error count on success
      this.errorCounts.delete(operationKey)
      
      return result.data
    } catch (error) {
      return this.handleDatabaseError(error, operation, strategy)
    }
  }

  /**
   * Execute database call with retry logic
   */
  private async executeWithRetry<T>(
    databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    maxRetries: number
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    if (!this.config.enableRetry) {
      return databaseCall()
    }

    return apiRetryService.executeWithRetry(databaseCall, {
      maxRetries,
      baseDelay: this.config.retryDelay,
      retryCondition: (error: unknown) => {
        // Retry on network errors and specific database errors
        if (!error || typeof error !== 'object' || !('error' in error)) return false
        const errorObj = error as { error: PostgrestError }
        const dbError = errorObj.error
        
        // Don't retry on client errors (4xx)
        if (dbError.code && dbError.code.startsWith('4')) return false
        
        // Retry on server errors, connection issues, timeouts
        return (
          dbError.code === 'PGRST301' || // Connection error
          dbError.code === 'PGRST116' || // Connection timeout
          dbError.message?.includes('network') ||
          dbError.message?.includes('timeout') ||
          dbError.message?.includes('connection')
        )
      }
    })
  }

  /**
   * Handle database errors with fallback strategies
   */
  private async handleDatabaseError<T>(
    error: unknown,
    operation: DatabaseOperation,
    strategy: FallbackStrategy
  ): Promise<T> {
    const dbError = this.createDatabaseError(error)
    const operationKey = `${operation.table}.${operation.operation}`

    // Log error
    if (this.config.logErrors) {
      console.error(`Database error in ${operationKey}:`, dbError)
    }

    // Track error count
    const currentCount = this.errorCounts.get(operationKey) || 0
    this.errorCounts.set(operationKey, currentCount + 1)
    this.lastErrors.set(operationKey, dbError)

    // Try custom fallback first
    if (strategy.customFallback) {
      try {
        return await strategy.customFallback(dbError, operation)
      } catch (fallbackError) {
        console.error('Custom fallback failed:', fallbackError)
      }
    }

    // Handle write operations with offline queue
    if (this.isWriteOperation(operation.operation) && strategy.useOfflineQueue && this.config.enableOfflineQueue) {
      let queueOperationType: 'CREATE' | 'UPDATE' | 'DELETE'
      if (operation.operation === 'insert') {
        queueOperationType = 'CREATE'
      } else if (operation.operation === 'upsert') {
        queueOperationType = 'UPDATE'
      } else {
        queueOperationType = operation.operation as 'UPDATE' | 'DELETE'
      }
      
      const queueId = offlineService.queueOperation(
        queueOperationType,
        operation.table,
        operation.data
      )
      
      console.log(`Queued ${operation.operation} operation for offline sync:`, queueId)
      
      // Return a success indicator for queued operations
      return { id: queueId, queued: true } as any
    }

    // Handle read operations with cache fallback
    if (operation.operation === 'select' && strategy.useCache && this.config.enableCaching) {
      const cached = offlineService.getCachedData<T>(operationKey)
      if (cached) {
        console.log(`Using cached data for ${operationKey}`)
        return cached
      }
    }

    // Use default value if provided
    if (strategy.useDefaultValue !== undefined) {
      console.log(`Using default value for ${operationKey}`)
      return strategy.useDefaultValue as T
    }

    // If no fallback worked, throw the original error
    throw dbError
  }

  /**
   * Create standardized database error
   */
  private createDatabaseError(error: unknown): DatabaseError {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const errorObj = error as { code: string; message: string; details?: string; hint?: string }
      // Already a PostgrestError
      return {
        code: errorObj.code,
        message: errorObj.message,
        details: errorObj.details,
        hint: errorObj.hint,
        originalError: error
      }
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        originalError: error
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      originalError: error
    }
  }

  /**
   * Check if operation is a write operation
   */
  private isWriteOperation(operation: string): boolean {
    return ['insert', 'update', 'delete', 'upsert'].includes(operation)
  }

  /**
   * Register custom fallback strategy
   */
  registerFallbackStrategy(operation: string, strategy: FallbackStrategy): void {
    this.fallbackStrategies.set(operation, strategy)
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number
    errorsByOperation: Record<string, number>
    recentErrors: Record<string, DatabaseError>
    mostFailedOperation: string | null
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0)
    const errorsByOperation: Record<string, number> = {}
    const recentErrors: Record<string, DatabaseError> = {}
    
    this.errorCounts.forEach((count, operation) => {
      errorsByOperation[operation] = count
    })
    
    this.lastErrors.forEach((error, operation) => {
      recentErrors[operation] = error
    })
    
    const mostFailedOperation = Array.from(this.errorCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null

    return {
      totalErrors,
      errorsByOperation,
      recentErrors,
      mostFailedOperation
    }
  }

  /**
   * Clear error statistics
   */
  clearErrorStatistics(): void {
    this.errorCounts.clear()
    this.lastErrors.clear()
  }

  /**
   * Check if operation is currently failing
   */
  isOperationFailing(table: string, operation: string): boolean {
    const operationKey = `${table}.${operation}`
    const errorCount = this.errorCounts.get(operationKey) || 0
    return errorCount >= this.config.maxRetries
  }

  /**
   * Get last error for operation
   */
  getLastError(table: string, operation: string): DatabaseError | null {
    const operationKey = `${table}.${operation}`
    return this.lastErrors.get(operationKey) || null
  }

  /**
   * Wrapper methods for common database operations
   */
  async safeSelect<T>(
    table: string,
    databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    fallbackStrategy?: FallbackStrategy
  ): Promise<T> {
    return this.executeWithErrorHandling(
      { table, operation: 'select' },
      databaseCall,
      fallbackStrategy
    )
  }

  async safeInsert<T>(
    table: string,
    data: unknown,
    databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    fallbackStrategy?: FallbackStrategy
  ): Promise<T> {
    return this.executeWithErrorHandling(
      { table, operation: 'insert', data },
      databaseCall,
      fallbackStrategy
    )
  }

  async safeUpdate<T>(
    table: string,
    data: unknown,
    databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    fallbackStrategy?: FallbackStrategy
  ): Promise<T> {
    return this.executeWithErrorHandling(
      { table, operation: 'update', data },
      databaseCall,
      fallbackStrategy
    )
  }

  async safeDelete<T>(
    table: string,
    databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    fallbackStrategy?: FallbackStrategy
  ): Promise<T> {
    return this.executeWithErrorHandling(
      { table, operation: 'delete' },
      databaseCall,
      fallbackStrategy
    )
  }

  async safeUpsert<T>(
    table: string,
    data: unknown,
    databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    fallbackStrategy?: FallbackStrategy
  ): Promise<T> {
    return this.executeWithErrorHandling(
      { table, operation: 'upsert', data },
      databaseCall,
      fallbackStrategy
    )
  }

  /**
   * Batch operation with error handling
   */
  async safeBatch<T>(
    operations: Array<{
      table: string
      operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
      data?: unknown
      databaseCall: () => Promise<{ data: T | null; error: PostgrestError | null }>
      fallbackStrategy?: FallbackStrategy
    }>
  ): Promise<T[]> {
    const results: T[] = []
    const errors: DatabaseError[] = []

    for (const op of operations) {
      try {
        const result = await this.executeWithErrorHandling(
          { table: op.table, operation: op.operation, data: op.data },
          op.databaseCall,
          op.fallbackStrategy
        )
        results.push(result)
      } catch (error) {
        errors.push(this.createDatabaseError(error))
      }
    }

    if (errors.length > 0) {
      console.warn(`Batch operation completed with ${errors.length} errors:`, errors)
    }

    return results
  }

  /**
   * Health check for database connectivity
   */
  async healthCheck(
    testCall: () => Promise<{ data: unknown; error: PostgrestError | null }>
  ): Promise<{
    healthy: boolean
    latency: number
    error?: DatabaseError
  }> {
    const startTime = performance.now()
    
    try {
      const result = await testCall()
      const latency = performance.now() - startTime
      
      if (result.error) {
        return {
          healthy: false,
          latency,
          error: this.createDatabaseError(result.error)
        }
      }
      
      return {
        healthy: true,
        latency
      }
    } catch (error) {
      const latency = performance.now() - startTime
      return {
        healthy: false,
        latency,
        error: this.createDatabaseError(error)
      }
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): Required<DatabaseErrorHandlingConfig> {
    return { ...this.config }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<DatabaseErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Create a singleton instance
const databaseErrorHandlingService = new DatabaseErrorHandlingService()

export default databaseErrorHandlingService
export { DatabaseErrorHandlingService }
export type { DatabaseError, DatabaseOperation, FallbackStrategy, DatabaseErrorHandlingConfig }