import React from 'react'
import { Loader2, X, AlertCircle } from 'lucide-react'
import { useLoadingStore } from '../services/loadingStateService'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LoadingIndicatorProps {
  /** Show only specific operation */
  operationId?: string
  /** Show only high priority operations */
  highPriorityOnly?: boolean
  /** Compact mode for smaller spaces */
  compact?: boolean
  /** Position of the indicator */
  position?: 'fixed' | 'relative' | 'absolute'
  /** Custom className */
  className?: string
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  operationId,
  highPriorityOnly = false,
  compact = false,
  position = 'fixed',
  className = ''
}) => {
  const {
    operations,
    globalLoading,
    globalMessage,
    cancelLoading,
    getLoadingOperations,
    getHighPriorityOperations
  } = useLoadingStore()

  // Get operations to display
  const getOperationsToShow = () => {
    if (operationId) {
      const operation = operations.get(operationId)
      return operation ? [operation] : []
    }
    
    if (highPriorityOnly) {
      return getHighPriorityOperations()
    }
    
    return getLoadingOperations()
  }

  const operationsToShow = getOperationsToShow()

  // Don't render if no operations
  if (!globalLoading && operationsToShow.length === 0) {
    return null
  }

  const handleCancel = (id: string) => {
    cancelLoading(id)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api': return '🌐'
      case 'database': return '🗄️'
      case 'file': return '📁'
      case 'computation': return '⚙️'
      case 'navigation': return '🧭'
      default: return '⏳'
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          {globalMessage || `${operationsToShow.length} operation${operationsToShow.length !== 1 ? 's' : ''} running`}
        </span>
      </div>
    )
  }

  const positionClasses = {
    fixed: 'fixed top-4 right-4 z-50',
    relative: 'relative',
    absolute: 'absolute top-4 right-4 z-50'
  }

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      {operationsToShow.length > 0 && (
        <Card className="w-80 shadow-lg">
          <CardContent className="p-4">
            <div className="space-y-3">
              {operationsToShow.map((operation) => (
                <div key={operation.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {operation.showSpinner && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span className="text-sm">{getTypeIcon(operation.type)}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPriorityColor(operation.priority)} text-white`}
                      >
                        {operation.priority}
                      </Badge>
                    </div>
                    {operation.allowCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(operation.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{operation.description}</p>
                    {operation.message && operation.message !== operation.description && (
                      <p className="text-xs text-muted-foreground">{operation.message}</p>
                    )}
                  </div>
                  
                  {operation.showProgress && operation.progress !== undefined && (
                    <div className="space-y-1">
                      <Progress value={operation.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {Math.round(operation.progress)}%
                      </p>
                    </div>
                  )}
                  
                  {operation.error && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-xs">{operation.error}</p>
                    </div>
                  )}
                  
                  {operation.estimatedDuration && operation.startTime && (
                    <div className="text-xs text-muted-foreground">
                      Estimated: {Math.round((operation.estimatedDuration - (Date.now() - operation.startTime)) / 1000)}s remaining
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Hook for using loading state in components
export const useLoading = () => {
  const store = useLoadingStore()
  
  return {
    isLoading: store.globalLoading,
    operations: store.getLoadingOperations(),
    highPriorityOperations: store.getHighPriorityOperations(),
    startLoading: store.startLoading,
    updateLoading: store.updateLoading,
    finishLoading: store.finishLoading,
    cancelLoading: store.cancelLoading
  }
}

// Higher-order component for automatic loading states
export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { isLoading } = useLoading()
    
    if (isLoading) {
      return <LoadingIndicator />
    }
    
    return (
      <WrappedComponent {...(props as any)} ref={ref} />
    )
  })
}

export default LoadingIndicator