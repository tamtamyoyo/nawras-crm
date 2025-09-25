// Global type declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'set' | 'event' | 'get',
      targetId: string | Date | boolean,
      config?: Record<string, unknown>
    ) => void;
  }
}

interface ErrorReportConfig {
  apiEndpoint?: string
  apiKey?: string
  enableConsoleLogging?: boolean
  enableLocalStorage?: boolean
  maxStoredReports?: number
  config?: Record<string, unknown>
}

interface ErrorContext {
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  userId: string | null
  sessionId: string
  context?: string
  retryCount: number
  browserInfo: Record<string, unknown>
  performanceMetrics: Record<string, unknown>
  stored_at?: number
}

interface UserErrorReport {
  errorId: string
  userDescription: string
  error: Error
  errorInfo: Record<string, unknown>
}

class ErrorReportingService {
  private readonly maxStoredErrors = 50
  private readonly storageKey = 'crm_error_reports'

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
      errorId: `global_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: 'Global Error Handler',
      retryCount: 0,
      browserInfo: this.getBrowserInfo(),
      performanceMetrics: this.getPerformanceMetrics()
    }

    this.reportError(errorContext)
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const errorContext: ErrorContext = {
      errorId: `unhandled_rejection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: 'Unhandled Promise Rejection',
      retryCount: 0,
      browserInfo: this.getBrowserInfo(),
      performanceMetrics: this.getPerformanceMetrics()
    }

    this.reportError(errorContext)
  }

  public reportError(errorContext: ErrorContext) {
    try {
      // Store error locally for offline scenarios
      this.storeErrorLocally(errorContext)

      // Log to console in development
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.group(`📊 Error Reporting Service [${errorContext.errorId}]`)
        console.error('Error Context:', errorContext)
        console.groupEnd()
      }

      // Send to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        this.sendToMonitoringService(errorContext)
      }

      // Send to analytics if available
      this.sendToAnalytics(errorContext)

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
      // Fallback: at least log the original error
      console.error('Original error that failed to report:', errorContext)
    }
  }

  public sendUserReport(userReport: UserErrorReport) {
    try {
      const reportData = {
        ...userReport,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      // Store user report locally
      this.storeUserReportLocally(reportData)

      // Send to support system
      this.sendToSupportSystem(reportData)

      console.log('User error report submitted:', reportData)
    } catch (error) {
      console.error('Failed to send user report:', error)
    }
  }

  private storeErrorLocally(errorContext: ErrorContext) {
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
      console.warn('Failed to store error locally:', error)
    }
  }

  private storeUserReportLocally(reportData: UserErrorReport) {
    try {
      const userReports = JSON.parse(localStorage.getItem('crm_user_reports') || '[]')
      userReports.push({
        ...reportData,
        stored_at: Date.now()
      })

      // Keep only the most recent 20 user reports
      if (userReports.length > 20) {
        userReports.splice(0, userReports.length - 20)
      }

      localStorage.setItem('crm_user_reports', JSON.stringify(userReports))
    } catch (error) {
      console.warn('Failed to store user report locally:', error)
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

  private async sendToMonitoringService(errorContext: ErrorContext) {
    try {
      // In a real application, you would send to services like:
      // - Sentry
      // - LogRocket
      // - Bugsnag
      // - Custom monitoring endpoint
      
      // Example implementation for a custom endpoint:
      /*
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorContext)
      })
      */

      // For now, we'll simulate the call
      console.log('📡 Would send to monitoring service:', errorContext.errorId)
    } catch (error) {
      console.warn('Failed to send to monitoring service:', error)
    }
  }

  private sendToAnalytics(errorContext: ErrorContext) {
    try {
      // Send error metrics to analytics
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'exception', {
          description: errorContext.message,
          fatal: false,
          custom_map: {
            error_id: errorContext.errorId,
            context: errorContext.context
          }
        })
      }

      // Custom analytics tracking
      console.log('📈 Error tracked in analytics:', errorContext.errorId)
    } catch (error) {
      console.warn('Failed to send to analytics:', error)
    }
  }

  private async sendToSupportSystem(reportData: UserErrorReport) {
    try {
      // Send user reports to support system
      // This could be integrated with:
      // - Zendesk
      // - Intercom
      // - Custom support API
      
      console.log('🎫 User report sent to support system:', reportData.errorId)
    } catch (error) {
      console.warn('Failed to send to support system:', error)
    }
  }

  private getUserId(): string | null {
    try {
      return localStorage.getItem('userId') || sessionStorage.getItem('userId')
    } catch {
      return null
    }
  }

  private getSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('sessionId')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('sessionId', sessionId)
      }
      return sessionId
    } catch {
      return `session_${Date.now()}`
    }
  }

  private getBrowserInfo() {
    return {
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      }
    }
  }

  private getPerformanceMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        memoryUsage: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null
      }
    } catch {
      return null
    }
  }

  private getFirstContentfulPaint(): number | null {
    try {
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      return fcpEntry ? fcpEntry.startTime : null
    } catch {
      return null
    }
  }

  // Public methods for manual error reporting
  public reportCustomError(message: string, context?: string, additionalData?: Record<string, unknown>) {
    const errorContext: ErrorContext = {
      errorId: `custom_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: context || 'Custom Error',
      retryCount: 0,
      browserInfo: this.getBrowserInfo(),
      performanceMetrics: this.getPerformanceMetrics(),
      ...additionalData
    }

    this.reportError(errorContext)
  }

  // Get error statistics for monitoring dashboard
  public getErrorStatistics() {
    const storedErrors = this.getStoredErrors()
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    const oneDayAgo = now - (24 * 60 * 60 * 1000)

    return {
      total: storedErrors.length,
      lastHour: storedErrors.filter(error => error.stored_at > oneHourAgo).length,
      lastDay: storedErrors.filter(error => error.stored_at > oneDayAgo).length,
      byContext: this.groupErrorsByContext(storedErrors)
    }
  }

  private groupErrorsByContext(errors: ErrorContext[]) {
    return errors.reduce((acc, error) => {
      const context = error.context || 'Unknown'
      acc[context] = (acc[context] || 0) + 1
      return acc
    }, {})
  }
}

export default ErrorReportingService
export type { ErrorContext, UserErrorReport }