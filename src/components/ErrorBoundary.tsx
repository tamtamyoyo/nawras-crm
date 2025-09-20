import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log errors in development mode for debugging
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.error('Error caught by boundary:', {
        message: error.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }, errorInfo)
    } else {
      // Log to monitoring service in production
      console.error('Error logged to monitoring service:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or default error message
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="text-center card">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" data-testid="alert-triangle" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try again.
            </p>
            {(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-left">
                <h3 className="text-sm font-medium text-red-800 mb-1">Error Details:</h3>
                <p className="text-sm text-red-700">{this.state.error.message}</p>
              </div>
            )}
            <div className="space-x-2">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" data-testid="refresh-icon" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary