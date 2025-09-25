/**
 * Unified Error Handling Service
 * Consolidates all error handling patterns into a single, consistent service
 */

import { toast } from 'sonner'
import { PostgrestError } from '@supabase/supabase-js'

export interface ErrorContext {
  errorId: string
  message: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
  context: string
  retryCount: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'network' | 'database' | 'validation' | 'authentication' | 'unknown'
  additionalData?: Record<string, unknown>
}

export interface ErrorHandlingOptions {
  showToast?: boolean
  logToConsole?: boolean
  reportError?: boolean
  fallbackToOffline?: boolean
  retryable?: boolean
  maxRetries?: number
}

interface SuccessOptions {
  showToast?: boolean;
  callback?: () => void;
}

class ErrorHandlingService {
  private readonly maxStoredErrors = 50
  private readonly storageKey = 'crm_error_reports'
  private errorCounts: Map<string, number> = new Map()
  private retryAttempts: Map<string, number> = new Map()

  constructor() {
    this.initializeService()
  }

  private initializeService() {
    // Set up global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this))
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
    
    // Clean up old stored errors on initialization
    this.cleanupOldErrors()
  }

  private handleGlobalError(event: ErrorEvent) {
    const errorContext: ErrorContext = {
      errorId: this.generateErrorId(),
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: 'Global Error Handler',
      retryCount: 0,
      severity: 'high',
      category: 'unknown'
    }

    this.handleError(errorContext, { showToast: true, logToConsole: true, reportError: true })
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const errorContext: ErrorContext = {
      errorId: this.generateErrorId(),
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: 'Unhandled Promise Rejection',
      retryCount: 0,
      severity: 'high',
      category: 'unknown'
    }

    this.handleError(errorContext, { showToast: true, logToConsole: true, reportError: true })
  }

  /**
   * Main error handling method
   */
  public handleError(error: Error | ErrorContext | unknown, options: ErrorHandlingOptions = {}): ErrorContext {
    const defaultOptions: ErrorHandlingOptions = {
      showToast: true,
      logToConsole: true,
      reportError: true,
      fallbackToOffline: false,
      retryable: false,
      maxRetries: 3
    }

    const finalOptions = { ...defaultOptions, ...options }
    const errorContext = this.normalizeError(error)

    // Log to console if enabled
    if (finalOptions.logToConsole) {
      this.logError(errorContext)
    }

    // Show toast notification if enabled
    if (finalOptions.showToast) {
      this.showErrorToast(errorContext)
    }

    // Store error for reporting
    if (finalOptions.reportError) {
      this.storeError(errorContext)
    }

    // Track error count
    this.trackErrorCount(errorContext.context)

    return errorContext
  }

  /**
   * Handle Supabase-specific errors
   */
  public handleSupabaseError(error: PostgrestError | any, context: string = 'Database Operation'): boolean {
    const errorContext = this.normalizeError(error, context)
    errorContext.category = 'database'

    // Determine if this is a network error that should trigger offline fallback
    const isNetworkError = this.isNetworkError(error)
    
    if (isNetworkError) {
      errorContext.severity = 'medium'
      this.handleError(errorContext, {
        showToast: true,
        logToConsole: true,
        reportError: true,
        fallbackToOffline: true
      })
      
      toast.info('Connection issue detected, switching to offline mode')
      return true // Should fallback to offline
    }

    // Handle other database errors
    errorContext.severity = 'high'
    this.handleError(errorContext, {
      showToast: true,
      logToConsole: true,
      reportError: true,
      fallbackToOffline: false
    })

    return false // Don't fallback to offline
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(errors: Record<string, string>, context: string = 'Form Validation'): ErrorContext {
    const errorContext: ErrorContext = {
      errorId: this.generateErrorId(),
      message: 'Validation failed',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context,
      retryCount: 0,
      severity: 'low',
      category: 'validation',
      additionalData: { validationErrors: errors }
    }

    return this.handleError(errorContext, {
      showToast: false, // Validation errors are usually shown inline
      logToConsole: true,
      reportError: false,
      fallbackToOffline: false
    })
  }

  /**
   * Handle authentication errors
   */
  public handleAuthError(error: unknown, context: string = 'Authentication'): ErrorContext {
    const errorContext = this.normalizeError(error, context)
    errorContext.category = 'authentication'
    errorContext.severity = 'high'

    return this.handleError(errorContext, {
      showToast: true,
      logToConsole: true,
      reportError: true,
      fallbackToOffline: false
    })
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(error: unknown, context: string = 'Network Request'): ErrorContext {
    const errorContext = this.normalizeError(error, context)
    errorContext.category = 'network'
    errorContext.severity = 'medium'

    return this.handleError(errorContext, {
      showToast: true,
      logToConsole: true,
      reportError: true,
      fallbackToOffline: true
    })
  }

  /**
   * Normalize different error types into ErrorContext
   */
  private normalizeError(error: unknown, context?: string): ErrorContext {
    if (error && typeof error === 'object' && 'errorId' in error) {
      return error as ErrorContext
    }

    const baseContext: ErrorContext = {
      errorId: this.generateErrorId(),
      message: '',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: context || 'Unknown',
      retryCount: 0,
      severity: 'medium',
      category: 'unknown'
    }

    if (error instanceof Error) {
      return {
        ...baseContext,
        message: error.message,
        stack: error.stack
      }
    }

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>
      return {
        ...baseContext,
        message: (typeof errorObj.message === 'string' ? errorObj.message : String(error)),
        stack: (typeof errorObj.stack === 'string' ? errorObj.stack : undefined),
        additionalData: error
      }
    }

    return {
      ...baseContext,
      message: String(error)
    }
  }

  private isNetworkError(error: unknown): boolean {
    if (!error) return false

    const message = error.message || ''
    const code = error.code || ''

    return (
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('fetch') ||
      code === 'PGRST301' ||
      code === 'PGRST116' ||
      message.includes('network') ||
      message.includes('connection')
    )
  }

  private logError(errorContext: ErrorContext) {
    const logLevel = this.getLogLevel(errorContext.severity)
    
    console.group(`🚨 Error [${errorContext.errorId}] - ${errorContext.severity.toUpperCase()}`)
    console[logLevel]('Message:', errorContext.message)
    console[logLevel]('Context:', errorContext.context)
    console[logLevel]('Category:', errorContext.category)
    if (errorContext.stack) {
      console[logLevel]('Stack:', errorContext.stack)
    }
    if (errorContext.additionalData) {
      console[logLevel]('Additional Data:', errorContext.additionalData)
    }
    console.groupEnd()
  }

  private getLogLevel(severity: string): 'error' | 'warn' | 'info' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warn'
      default:
        return 'info'
    }
  }

  private showErrorToast(errorContext: ErrorContext) {
    const message = this.getToastMessage(errorContext)
    
    switch (errorContext.severity) {
      case 'critical':
      case 'high':
        toast.error(message)
        break
      case 'medium':
        toast.warning(message)
        break
      default:
        toast.info(message)
        break
    }
  }

  private getToastMessage(errorContext: ErrorContext): string {
    // Provide user-friendly messages based on error category
    switch (errorContext.category) {
      case 'network':
        return 'Connection issue detected. Please check your internet connection.'
      case 'database':
        return 'Database operation failed. Please try again.'
      case 'authentication':
        return 'Authentication failed. Please log in again.'
      case 'validation':
        return 'Please check your input and try again.'
      default:
        return errorContext.message || 'An unexpected error occurred.'
    }
  }

  private storeError(errorContext: ErrorContext) {
    try {
      const storedErrors = this.getStoredErrors()
      storedErrors.push({
        ...errorContext,
        stored_at: Date.now()
      })

      // Keep only the most recent errors
      if (storedErrors.length > this.maxStoredErrors) {
        storedErrors.splice(0, storedErrors.length - this.maxStoredErrors)
      }

      localStorage.setItem(this.storageKey, JSON.stringify(storedErrors))
    } catch (error) {
      console.warn('Failed to store error:', error)
    }
  }

  private getStoredErrors(): ErrorContext[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]')
    } catch {
      return []
    }
  }

  private cleanupOldErrors() {
    try {
      const storedErrors = this.getStoredErrors()
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
      
      const recentErrors = storedErrors.filter(error => 
        error.stored_at && error.stored_at > oneDayAgo
      )

      localStorage.setItem(this.storageKey, JSON.stringify(recentErrors))
    } catch (error) {
      console.warn('Failed to cleanup old errors:', error)
    }
  }

  private trackErrorCount(context: string) {
    const currentCount = this.errorCounts.get(context) || 0
    this.errorCounts.set(context, currentCount + 1)
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics() {
    const storedErrors = this.getStoredErrors()
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    const oneDayAgo = now - (24 * 60 * 60 * 1000)

    return {
      total: storedErrors.length,
      lastHour: storedErrors.filter(error => error.stored_at > oneHourAgo).length,
      lastDay: storedErrors.filter(error => error.stored_at > oneDayAgo).length,
      byCategory: this.groupErrorsByCategory(storedErrors),
      byContext: this.groupErrorsByContext(storedErrors),
      bySeverity: this.groupErrorsBySeverity(storedErrors)
    }
  }

  private groupErrorsByCategory(errors: ErrorContext[]) {
    return errors.reduce((acc, error) => {
      const category = error.category || 'unknown'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
  }

  private groupErrorsByContext(errors: ErrorContext[]) {
    return errors.reduce((acc, error) => {
      const context = error.context || 'Unknown'
      acc[context] = (acc[context] || 0) + 1
      return acc
    }, {})
  }

  private groupErrorsBySeverity(errors: ErrorContext[]) {
    return errors.reduce((acc, error) => {
      const severity = error.severity || 'unknown'
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {})
  }

  /**
   * Clear error statistics
   */
  public clearErrorStatistics(): void {
    this.errorCounts.clear()
    this.retryAttempts.clear()
    localStorage.removeItem(this.storageKey)
  }
}

// Create singleton instance
const errorHandlingService = new ErrorHandlingService()

export default errorHandlingService
export { ErrorHandlingService }