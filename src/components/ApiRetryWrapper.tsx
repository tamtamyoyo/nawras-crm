import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react'
import apiRetryService from '../services/apiRetryService'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ApiOperation {
  id: string
  name: string
  status: 'pending' | 'loading' | 'success' | 'error' | 'retrying'
  attempt: number
  maxAttempts: number
  error?: string
  startTime: Date
  endTime?: Date
  duration?: number
}

interface ApiRetryWrapperProps {
  /** Show operations history */
  showHistory?: boolean
  /** Maximum operations to show in history */
  maxHistoryItems?: number
  /** Auto-clear successful operations after delay */
  autoClearSuccess?: boolean
  /** Auto-clear delay in ms */
  autoClearDelay?: number
  /** Show retry statistics */
  showStats?: boolean
  /** Compact mode */
  compact?: boolean
  /** Custom className */
  className?: string
  /** Position */
  position?: 'fixed' | 'relative' | 'absolute'
  /** Children render function */
  children?: (props: {
    executeWithRetry: <T>(operation: () => Promise<T>, options?: {
      name?: string
      maxAttempts?: number
      baseDelay?: number
      maxDelay?: number
    }) => Promise<T>
    operations: ApiOperation[]
    isOnline: boolean
    retryStats: any
  }) => React.ReactNode
}

const ApiRetryWrapper: React.FC<ApiRetryWrapperProps> = ({
  showHistory = true,
  maxHistoryItems = 10,
  autoClearSuccess = true,
  autoClearDelay = 5000,
  showStats = false,
  compact = false,
  className = '',
  position = 'fixed',
  children
}) => {
  const [operations, setOperations] = useState<ApiOperation[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryStats, setRetryStats] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update retry statistics
  useEffect(() => {
    if (showStats) {
      const updateStats = () => {
        const stats = apiRetryService.getRetryStatistics()
        setRetryStats(stats)
      }

      updateStats()
      const interval = setInterval(updateStats, 10000) // Update every 10 seconds

      return () => clearInterval(interval)
    }
  }, [showStats])

  // Auto-clear successful operations
  useEffect(() => {
    if (autoClearSuccess) {
      const timer = setTimeout(() => {
        setOperations(prev => 
          prev.filter(op => op.status !== 'success' || 
            (Date.now() - (op.endTime?.getTime() || 0)) < autoClearDelay
          )
        )
      }, autoClearDelay)

      return () => clearTimeout(timer)
    }
  }, [operations, autoClearSuccess, autoClearDelay])

  // Execute operation with retry
  const executeWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: {
      name?: string
      maxAttempts?: number
      baseDelay?: number
      maxDelay?: number
    } = {}
  ): Promise<T> => {
    const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const operationName = options.name || 'API Operation'
    const maxAttempts = options.maxAttempts || 3

    // Add operation to list
    const newOperation: ApiOperation = {
      id: operationId,
      name: operationName,
      status: 'loading',
      attempt: 1,
      maxAttempts,
      startTime: new Date()
    }

    setOperations(prev => [newOperation, ...prev.slice(0, maxHistoryItems - 1)])

    try {
      // Execute with retry using the service
      const result = await apiRetryService.executeWithRetry(
        operation,
        {  maxRetries: maxAttempts,
          baseDelay: options.baseDelay || 1000,
          maxDelay: options.maxDelay || 10000,
          onRetry: (attempt, error) => {
            // Update operation status
            setOperations(prev => prev.map(op => 
              op.id === operationId
                ? {
                    ...op,
                    status: 'retrying' as const,
                    attempt,
                    error: error.message
                  }
                : op
            ))
          }
        }
      )

      // Mark as successful
      setOperations(prev => prev.map(op => 
        op.id === operationId
          ? {
              ...op,
              status: 'success' as const,
              endTime: new Date(),
              duration: Date.now() - op.startTime.getTime()
            }
          : op
      ))

      return result
    } catch (error) {
      // Mark as failed
      setOperations(prev => prev.map(op => 
        op.id === operationId
          ? {
              ...op,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Unknown error',
              endTime: new Date(),
              duration: Date.now() - op.startTime.getTime()
            }
          : op
      ))

      throw error
    }
  }, [maxHistoryItems])

  // Retry failed operation
  const retryOperation = useCallback(async (operationId: string) => {
    const operation = operations.find(op => op.id === operationId)
    if (!operation) return

    // Reset operation status
    setOperations(prev => prev.map(op => 
      op.id === operationId
        ? {
            ...op,
            status: 'loading' as const,
            attempt: 1,
            error: undefined,
            startTime: new Date(),
            endTime: undefined,
            duration: undefined
          }
        : op
    ))

    // Note: In a real implementation, you'd need to store the original operation function
    // For now, we'll just show that retry was attempted
    setTimeout(() => {
      setOperations(prev => prev.map(op => 
        op.id === operationId
          ? {
              ...op,
              status: 'error' as const,
              error: 'Retry not implemented - original operation function not stored',
              endTime: new Date(),
              duration: 1000
            }
          : op
      ))
    }, 1000)
  }, [operations])

  // Clear all operations
  const clearOperations = useCallback(() => {
    setOperations([])
  }, [])

  // Clear specific operation
  const clearOperation = useCallback((operationId: string) => {
    setOperations(prev => prev.filter(op => op.id !== operationId))
  }, [])

  // Get status icon
  const getStatusIcon = (status: ApiOperation['status']) => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'retrying':
        return <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // Get status color
  const getStatusColor = (status: ApiOperation['status']) => {
    switch (status) {
      case 'loading':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'retrying':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Get active operations count
  const activeOperations = operations.filter(op => 
    op.status === 'loading' || op.status === 'retrying'
  ).length

  const failedOperations = operations.filter(op => op.status === 'error').length

  if (children) {
    return (
      <div className={className}>
        {children({
          executeWithRetry,
          operations,
          isOnline,
          retryStats
        })}
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        {activeOperations > 0 && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {activeOperations} active
          </Badge>
        )}
        
        {failedOperations > 0 && (
          <Badge variant="destructive">
            {failedOperations} failed
          </Badge>
        )}
      </div>
    )
  }

  if (!showHistory && operations.length === 0) {
    return null
  }

  const positionClasses = {
    fixed: 'fixed bottom-4 left-4 z-50',
    relative: 'relative',
    absolute: 'absolute bottom-4 left-4 z-50'
  }

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <Card className="w-96 shadow-lg">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>API Operations</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!isOnline && (
                    <Badge variant="destructive">Offline</Badge>
                  )}
                  
                  {activeOperations > 0 && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {activeOperations}
                    </Badge>
                  )}
                  
                  {failedOperations > 0 && (
                    <Badge variant="destructive">
                      {failedOperations}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between text-sm">
                <span>Connection:</span>
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-500" />
                      <span className="text-red-600">Offline</span>
                    </>
                  )}
                </div>
              </div>

              {/* Retry Statistics */}
              {showStats && retryStats && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Statistics</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Total requests:</span>
                      <span>{retryStats.totalRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success rate:</span>
                      <span>{retryStats.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg retries:</span>
                      <span>{retryStats.averageRetries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg duration:</span>
                      <span>{retryStats.averageDuration}ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Operations List */}
              {operations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recent Operations</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearOperations}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {operations.map(operation => (
                      <div key={operation.id} className="p-2 bg-gray-50 rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(operation.status)}
                            <span className="text-sm font-medium truncate">
                              {operation.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className={getStatusColor(operation.status)}>
                              {operation.status}
                            </Badge>
                            
                            {operation.status === 'error' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => retryOperation(operation.id)}
                                className="h-5 w-5 p-0"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearOperation(operation.id)}
                              className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Attempt {operation.attempt}/{operation.maxAttempts}
                          </span>
                          
                          {operation.duration && (
                            <span>{formatDuration(operation.duration)}</span>
                          )}
                        </div>
                        
                        {operation.status === 'retrying' && (
                          <Progress 
                            value={(operation.attempt / operation.maxAttempts) * 100} 
                            className="h-1" 
                          />
                        )}
                        
                        {operation.error && (
                          <p className="text-xs text-red-600 truncate" title={operation.error}>
                            {operation.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Operations Message */}
              {operations.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No recent API operations
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}

// Hook for using API retry functionality
export const useApiRetry = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryStats, setRetryStats] = useState<any>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update retry statistics
    const updateStats = () => {
      const stats = apiRetryService.getRetryStatistics()
      setRetryStats(stats)
    }

    updateStats()
    const interval = setInterval(updateStats, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const executeWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: {
      maxAttempts?: number
      baseDelay?: number
      maxDelay?: number
    }
  ): Promise<T> => {
    return apiRetryService.executeWithRetry(operation, options)
  }, [])

  return {
    executeWithRetry,
    isOnline,
    retryStats
  }
}

export default ApiRetryWrapper