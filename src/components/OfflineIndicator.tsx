import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import offlineService from '../services/offlineService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface OfflineIndicatorProps {
  /** Show detailed status */
  detailed?: boolean
  /** Compact mode */
  compact?: boolean
  /** Position */
  position?: 'fixed' | 'relative' | 'absolute'
  /** Custom className */
  className?: string
  /** Show sync button */
  showSyncButton?: boolean
  /** Auto-hide when online */
  autoHide?: boolean
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  detailed = false,
  compact = false,
  position = 'fixed',
  className = '',
  showSyncButton = true,
  autoHide = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queuedOperations, setQueuedOperations] = useState<any[]>([])
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [syncProgress, setSyncProgress] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [storageStats, setStorageStats] = useState<any>(null)

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      if (queuedOperations.length > 0) {
        handleSync()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queuedOperations.length])

  // Update queued operations
  useEffect(() => {
    const updateQueue = () => {
      const queue = offlineService.getQueuedOperations()
      setQueuedOperations(queue)
    }

    const updateStats = () => {
      const stats = offlineService.getStorageStats()
      setStorageStats(stats)
    }

    // Initial load
    updateQueue()
    updateStats()

    // Set up polling for updates
    const interval = setInterval(() => {
      updateQueue()
      updateStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Handle sync
  const handleSync = async () => {
    if (!isOnline || syncStatus === 'syncing') return

    setSyncStatus('syncing')
    setSyncProgress(0)

    try {
      const results = await offlineService.syncQueuedOperations()

      setSyncStatus('success')
      setLastSyncTime(new Date())
      
      // Update queue after sync
      const updatedQueue = offlineService.getQueuedOperations()
      setQueuedOperations(updatedQueue)

      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000)

      console.log('Sync completed:', results)
    } catch (error) {
      setSyncStatus('error')
      console.error('Sync failed:', error)
      
      // Reset status after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000)
    }
  }

  // Clear all queued operations
  const handleClearQueue = () => {
    offlineService.clearQueue()
    setQueuedOperations([])
  }

  // Don't show if online and auto-hide is enabled
  if (autoHide && isOnline && queuedOperations.length === 0) {
    return null
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />
    if (syncStatus === 'syncing') return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
    if (queuedOperations.length > 0) return <CloudOff className="h-4 w-4 text-orange-500" />
    return <Wifi className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (syncStatus === 'syncing') return 'Syncing...'
    if (queuedOperations.length > 0) return `${queuedOperations.length} pending`
    return 'Online'
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-100 text-red-800 border-red-200'
    if (syncStatus === 'syncing') return 'bg-blue-100 text-blue-800 border-blue-200'
    if (queuedOperations.length > 0) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <Badge variant="outline" className={getStatusColor()}>
          {getStatusText()}
        </Badge>
        {showSyncButton && isOnline && queuedOperations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    )
  }

  const positionClasses = {
    fixed: 'fixed bottom-4 right-4 z-50',
    relative: 'relative',
    absolute: 'absolute bottom-4 right-4 z-50'
  }

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <Card className="w-80 shadow-lg">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
                <Badge variant="outline" className={getStatusColor()}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Connection Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Connection:</span>
                  <div className="flex items-center space-x-1">
                    {isOnline ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
                
                {lastSyncTime && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Last sync:</span>
                    <span>{lastSyncTime.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Sync Progress */}
              {syncStatus === 'syncing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Syncing operations...</span>
                    <span>{Math.round(syncProgress)}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>
              )}

              {/* Sync Status Messages */}
              {syncStatus === 'success' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All operations synced successfully!
                  </AlertDescription>
                </Alert>
              )}

              {syncStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Sync failed. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              {/* Queued Operations */}
              {queuedOperations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Operations</span>
                    <Badge variant="secondary">{queuedOperations.length}</Badge>
                  </div>
                  
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {queuedOperations.slice(0, 5).map((operation, index) => (
                      <div key={operation.id || index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span>{operation.operation}</span>
                          <span className="text-muted-foreground">{operation.table}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(operation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {queuedOperations.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{queuedOperations.length - 5} more operations
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Storage Statistics */}
              {detailed && storageStats && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Storage</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Cached items:</span>
                      <span>{storageStats.totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage used:</span>
                      <span>{(storageStats.totalSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {showSyncButton && isOnline && queuedOperations.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing'}
                    className="flex-1"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    Sync Now
                  </Button>
                )}
                
                {queuedOperations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearQueue}
                    className="flex-1"
                  >
                    Clear Queue
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}

// Hook for using offline status in components
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queuedOperations, setQueuedOperations] = useState<any[]>([])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update queued operations
    const updateQueue = () => {
      const queue = offlineService.getQueuedOperations()
      setQueuedOperations(queue)
    }

    updateQueue()
    const interval = setInterval(updateQueue, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    queuedOperations,
    hasQueuedOperations: queuedOperations.length > 0,
    queueCount: queuedOperations.length
  }
}

export default OfflineIndicator