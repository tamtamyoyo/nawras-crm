import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug, Send } from 'lucide-react'
import ErrorReportingService from '../services/errorReportingService'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRetry?: boolean
  maxRetries?: number
  context?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
  errorId: string
}

class ErrorBoundary extends Component<Props, State> {
  private errorReportingService: ErrorReportingService

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      retryCount: 0,
      errorId: ''
    }
    this.errorReportingService = new ErrorReportingService()
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // Collect comprehensive error context
    const errorContext = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: this.props.context,
      retryCount: this.state.retryCount,
      browserInfo: this.getBrowserInfo(),
      performanceMetrics: this.getPerformanceMetrics()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Context:', errorContext)
      console.groupEnd()
    }

    // Report to monitoring service
    this.errorReportingService.reportError(errorContext)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
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
      }
    }
  }

  private getPerformanceMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
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

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  private handleReportError = () => {
    if (this.state.error && this.state.errorInfo) {
      this.errorReportingService.sendUserReport({
        errorId: this.state.errorId,
        userDescription: 'User manually reported this error',
        error: this.state.error,
        errorInfo: {
          componentStack: this.state.errorInfo?.componentStack || ''
        }
      })
      alert('Error report sent. Thank you for helping us improve!')
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const canRetry = this.props.enableRetry !== false && this.state.retryCount < (this.props.maxRetries || 3)

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200">
              <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" data-testid="alert-triangle" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 mb-4">
                We encountered an unexpected error. Our team has been notified.
              </p>
              
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                {this.state.retryCount > 0 && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Retry attempts:</strong> {this.state.retryCount}
                  </p>
                )}
              </div>

              {(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && this.state.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                    <Bug className="mr-1 h-4 w-4" />
                    Development Error Details:
                  </h3>
                  <p className="text-sm text-red-700 font-mono break-all">{this.state.error.message}</p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-sm text-red-800 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-red-600 mt-1 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" data-testid="refresh-icon" />
                    Try Again ({(this.props.maxRetries || 3) - this.state.retryCount} left)
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={this.handleReportError}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors inline-flex items-center justify-center"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary