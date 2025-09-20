import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import ErrorBoundary from '../../components/ErrorBoundary'
import React from 'react'

// Mock UI components
interface MockButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  className?: string;
  [key: string]: unknown;
}

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, ...props }: MockButtonProps) => (
    <button 
      onClick={onClick} 
      className={`btn ${variant} ${className}`} 
      {...props}
    >
      {children}
    </button>
  )
}))

interface MockCardProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: MockCardProps) => (
    <div className={`card ${className}`} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: MockCardProps) => (
    <div className={`card-content ${className}`} {...props}>{children}</div>
  ),
  CardDescription: ({ children, className, ...props }: MockCardProps) => (
    <div className={`card-description ${className}`} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: MockCardProps) => (
    <div className={`card-header ${className}`} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: MockCardProps) => (
    <div className={`card-title ${className}`} {...props}>{children}</div>
  )
}))

// Mock lucide-react icons
interface MockIconProps {
  className?: string;
  [key: string]: unknown;
}

vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className, ...props }: MockIconProps) => (
    <div className={`alert-triangle-icon ${className}`} data-testid="alert-triangle" {...props} />
  ),
  RefreshCw: ({ className, ...props }: MockIconProps) => (
    <div className={`refresh-icon ${className}`} data-testid="refresh-icon" {...props} />
  )
}))

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }: { shouldThrow?: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div data-testid="working-component">Working Component</div>
}



describe('ErrorBoundary Component', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let originalLocation: typeof window.location
  let mockReload: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock console.error to avoid noise in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window.location.reload
    originalLocation = window.location
    mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        reload: mockReload,
        href: 'http://localhost:3000/test'
      },
      writable: true
    })

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Test User Agent',
      writable: true
    })

    // Mock process.env
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    window.location = originalLocation
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByTestId('working-component')).toBeInTheDocument()
    })

    it('renders multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('catches and displays error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error message" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText("We're sorry, but something unexpected happened. Please try again.")).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle')).toBeInTheDocument()
    })

    it('displays custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('logs error information to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Logging test error" />
        </ErrorBoundary>
      )
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === 'Error caught by boundary:'
      )
      expect(logCall).toBeDefined()
      expect(logCall[1]).toMatchObject({
        message: 'Logging test error',
        timestamp: expect.any(String),
        userAgent: 'Test User Agent',
        url: 'http://localhost:3000/test'
      })
    })
  })

  describe('Development vs Production', () => {
    it('shows error details in development mode', () => {
      vi.stubEnv('NODE_ENV', 'development')
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Development error details" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Error Details:')).toBeInTheDocument()
      expect(screen.getByText('Development error details')).toBeInTheDocument()
    })

    it('hides error details in production mode', () => {
      vi.stubEnv('NODE_ENV', 'production')
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Production error" />
        </ErrorBoundary>
      )
      
      expect(screen.queryByText('Error Details:')).not.toBeInTheDocument()
      expect(screen.queryByText('Production error')).not.toBeInTheDocument()
    })

    it('logs to monitoring service in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Production logging test" />
        </ErrorBoundary>
      )
      
      const logCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === 'Error logged to monitoring service:'
      )
      expect(logCall).toBeDefined()
    })
  })

  describe('User Interactions', () => {
    it('handles retry button click', async () => {
      let shouldThrow = true
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div data-testid="working-component">Working!</div>
      }
      
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      
      // Fix the error condition
      shouldThrow = false
      
      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('working-component')).toBeInTheDocument()
      })
    })

    it('handles reload button click', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const reloadButton = screen.getByText('Reload Page')
      fireEvent.click(reloadButton)
      
      expect(mockReload).toHaveBeenCalledTimes(1)
    })

    it('retry button has correct icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeInTheDocument()
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('recovers from error state when retry is clicked', () => {
      let shouldThrow = true
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Recoverable error')
        }
        return <div data-testid="recovered-component">Recovered!</div>
      }
      
      const { rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      
      // Simulate fixing the error
      shouldThrow = false
      
      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)
      
      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByTestId('recovered-component')).toBeInTheDocument()
    })

    it('clears error state completely on retry', async () => {
      let shouldThrow = true
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('State clearing test')
        }
        return <div data-testid="working-component">Working!</div>
      }
      
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      
      // Fix the error condition
      shouldThrow = false
      
      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('working-component')).toBeInTheDocument()
      })
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles errors with no message', () => {
      const ErrorWithNoMessage = () => {
        throw new Error()
      }
      
      render(
        <ErrorBoundary>
          <ErrorWithNoMessage />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('handles errors with very long messages', () => {
      const longMessage = 'A'.repeat(1000)
      
      vi.stubEnv('NODE_ENV', 'development')
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={longMessage} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Error Details:')).toBeInTheDocument()
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('handles multiple consecutive errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="First error" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      
      // Retry and throw another error
      fireEvent.click(screen.getByText('Try Again'))
      
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Second error" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('handles null children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      )
      
      // Should not crash, just render nothing
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('handles undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      )
      
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes and semantic structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const card = screen.getByText('Something went wrong').closest('.card')
      expect(card).toBeInTheDocument()
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]).toHaveTextContent('Try Again')
      expect(buttons[1]).toHaveTextContent('Reload Page')
    })

    it('maintains focus management', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      retryButton.focus()
      expect(document.activeElement).toBe(retryButton)
    })
  })

  describe('Performance', () => {
    it('renders error UI quickly', () => {
      const startTime = performance.now()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})