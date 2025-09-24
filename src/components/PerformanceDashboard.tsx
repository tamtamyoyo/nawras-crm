import React, { useState, useEffect } from 'react'
import { Activity, Zap, Clock, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Gauge } from 'lucide-react'
import performanceMonitoringService from '../services/performanceMonitoringService'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface PerformanceDashboardProps {
  /** Show in compact mode */
  compact?: boolean
  /** Auto-refresh interval in ms */
  refreshInterval?: number
  /** Show performance alerts */
  showAlerts?: boolean
  /** Custom className */
  className?: string
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error'
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: Date
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  compact = false,
  refreshInterval = 5000,
  showAlerts = true,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<any>(null)
  const [webVitals, setWebVitals] = useState<any>({})
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Performance thresholds
  const thresholds = {
    lcp: 2500, // Largest Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1,  // Cumulative Layout Shift
    fcp: 1800, // First Contentful Paint
    ttfb: 800, // Time to First Byte
    memory: 50 * 1024 * 1024, // 50MB
    loadTime: 3000
  }

  // Update metrics
  const updateMetrics = async () => {
    try {
      const report = performanceMonitoringService.generateReport()
      const summary = performanceMonitoringService.getPerformanceSummary()
      
      setMetrics({
        ...report,
        summary
      })

      // Get Web Vitals from report
      const vitals = report.vitals || {}
      setWebVitals(vitals)

      // Check for performance issues and create alerts
      checkPerformanceAlerts(report, vitals)
      
      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to update performance metrics:', error)
      setIsLoading(false)
    }
  }

  // Check for performance alerts
  const checkPerformanceAlerts = (report: any, vitals: any) => {
    const newAlerts: PerformanceAlert[] = []
    const now = new Date()

    // Check Web Vitals
    if (vitals.lcp && vitals.lcp > thresholds.lcp) {
      newAlerts.push({
        id: `lcp-${now.getTime()}`,
        type: vitals.lcp > thresholds.lcp * 1.5 ? 'error' : 'warning',
        message: 'Largest Contentful Paint is slow',
        metric: 'LCP',
        value: vitals.lcp,
        threshold: thresholds.lcp,
        timestamp: now
      })
    }

    if (vitals.fid && vitals.fid > thresholds.fid) {
      newAlerts.push({
        id: `fid-${now.getTime()}`,
        type: vitals.fid > thresholds.fid * 2 ? 'error' : 'warning',
        message: 'First Input Delay is high',
        metric: 'FID',
        value: vitals.fid,
        threshold: thresholds.fid,
        timestamp: now
      })
    }

    if (vitals.cls && vitals.cls > thresholds.cls) {
      newAlerts.push({
        id: `cls-${now.getTime()}`,
        type: vitals.cls > thresholds.cls * 2 ? 'error' : 'warning',
        message: 'Cumulative Layout Shift is high',
        metric: 'CLS',
        value: vitals.cls,
        threshold: thresholds.cls,
        timestamp: now
      })
    }

    // Check memory usage
    if (report.memory && report.memory.usedJSHeapSize > thresholds.memory) {
      newAlerts.push({
        id: `memory-${now.getTime()}`,
        type: 'warning',
        message: 'High memory usage detected',
        metric: 'Memory',
        value: report.memory.usedJSHeapSize,
        threshold: thresholds.memory,
        timestamp: now
      })
    }

    // Update alerts (keep only recent ones)
    setAlerts(prev => {
      const recentAlerts = prev.filter(alert => 
        now.getTime() - alert.timestamp.getTime() < 300000 // 5 minutes
      )
      return [...recentAlerts, ...newAlerts].slice(-10) // Keep last 10 alerts
    })
  }

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Get performance score
  const getPerformanceScore = () => {
    if (!webVitals.lcp && !webVitals.fid && !webVitals.cls) return null
    
    let score = 100
    
    if (webVitals.lcp) {
      if (webVitals.lcp > thresholds.lcp * 1.5) score -= 30
      else if (webVitals.lcp > thresholds.lcp) score -= 15
    }
    
    if (webVitals.fid) {
      if (webVitals.fid > thresholds.fid * 2) score -= 25
      else if (webVitals.fid > thresholds.fid) score -= 10
    }
    
    if (webVitals.cls) {
      if (webVitals.cls > thresholds.cls * 2) score -= 25
      else if (webVitals.cls > thresholds.cls) score -= 10
    }
    
    return Math.max(0, score)
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Clear alerts
  const clearAlerts = () => {
    setAlerts([])
  }

  // Setup auto-refresh
  useEffect(() => {
    updateMetrics()
    
    const interval = setInterval(updateMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Loading performance data...</span>
        </div>
      </div>
    )
  }

  const performanceScore = getPerformanceScore()

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        
        {performanceScore !== null && (
          <Badge variant="outline" className={getScoreColor(performanceScore)}>
            {performanceScore}/100
          </Badge>
        )}
        
        {alerts.length > 0 && (
          <Badge variant="destructive">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </Badge>
        )}
        
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Performance Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={updateMetrics}>
            Refresh
          </Button>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Performance Score */}
      {performanceScore !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Gauge className="h-4 w-4" />
              <span>Overall Performance Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </div>
              <Progress value={performanceScore} className="flex-1" />
              <div className="flex items-center space-x-1">
                {performanceScore >= 90 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Performance Alerts</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearAlerts}>
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(alert => (
              <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <div className="flex items-center space-x-2 text-xs">
                      <Badge variant="outline">
                        {alert.metric}: {formatDuration(alert.value)}
                      </Badge>
                      <span className="text-muted-foreground">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metrics Tabs */}
      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>

        {/* Web Vitals */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">LCP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {webVitals.lcp ? formatDuration(webVitals.lcp) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Largest Contentful Paint</p>
                {webVitals.lcp && (
                  <Progress 
                    value={Math.min(100, (webVitals.lcp / thresholds.lcp) * 100)} 
                    className="mt-2" 
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">FID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {webVitals.fid ? formatDuration(webVitals.fid) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">First Input Delay</p>
                {webVitals.fid && (
                  <Progress 
                    value={Math.min(100, (webVitals.fid / thresholds.fid) * 100)} 
                    className="mt-2" 
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CLS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {webVitals.cls ? webVitals.cls.toFixed(3) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Cumulative Layout Shift</p>
                {webVitals.cls && (
                  <Progress 
                    value={Math.min(100, (webVitals.cls / thresholds.cls) * 100)} 
                    className="mt-2" 
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">FCP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {webVitals.fcp ? formatDuration(webVitals.fcp) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">First Contentful Paint</p>
                {webVitals.fcp && (
                  <Progress 
                    value={Math.min(100, (webVitals.fcp / thresholds.fcp) * 100)} 
                    className="mt-2" 
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Navigation Timing */}
        <TabsContent value="timing" className="space-y-4">
          {metrics?.navigation && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>DNS Lookup</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatDuration(metrics.navigation.domainLookupEnd - metrics.navigation.domainLookupStart)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Connection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatDuration(metrics.navigation.connectEnd - metrics.navigation.connectStart)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Response</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatDuration(metrics.navigation.responseEnd - metrics.navigation.responseStart)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="space-y-4">
          {metrics?.resources && (
            <Card>
              <CardHeader>
                <CardTitle>Resource Loading</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {metrics.resources.slice(0, 10).map((resource: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div className="flex-1 truncate">
                        <span className="font-medium">{resource.name.split('/').pop()}</span>
                        <span className="text-muted-foreground ml-2">{resource.initiatorType}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {formatDuration(resource.duration)}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatBytes(resource.transferSize || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Memory */}
        <TabsContent value="memory" className="space-y-4">
          {metrics?.memory && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Used Heap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatBytes(metrics.memory.usedJSHeapSize)}
                  </div>
                  <Progress 
                    value={(metrics.memory.usedJSHeapSize / metrics.memory.totalJSHeapSize) * 100} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Heap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatBytes(metrics.memory.totalJSHeapSize)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Heap Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatBytes(metrics.memory.jsHeapSizeLimit)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Hook for using performance metrics in components
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const report = performanceMonitoringService.generateReport()
        const summary = performanceMonitoringService.getPerformanceSummary()
        setMetrics({ ...report, summary })
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to get performance metrics:', error)
        setIsLoading(false)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return { metrics, isLoading }
}

export default PerformanceDashboard