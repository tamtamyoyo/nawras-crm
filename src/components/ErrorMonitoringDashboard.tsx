import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Download, Search, X, Bug, Zap, Globe, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import errorReportingService from '../services/errorReportingService'
import performanceMonitoringService from '../services/performanceMonitoringService'

interface ErrorSummary {
  id: string
  message: string
  type: 'javascript' | 'network' | 'database' | 'validation' | 'performance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
  firstSeen: Date
  lastSeen: Date
  stack?: string
  url?: string
  userAgent?: string
  userId?: string
  sessionId?: string
  context?: Record<string, any>
  resolved?: boolean
  tags?: string[]
}

interface ErrorTrend {
  date: string
  count: number
  type: string
}

interface ErrorMonitoringDashboardProps {
  /** Auto-refresh interval in ms */
  refreshInterval?: number
  /** Maximum errors to display */
  maxErrors?: number
  /** Show performance metrics */
  showPerformance?: boolean
  /** Show user context */
  showUserContext?: boolean
  /** Custom className */
  className?: string
  /** Compact mode */
  compact?: boolean
}

const ErrorMonitoringDashboard: React.FC<ErrorMonitoringDashboardProps> = ({
  refreshInterval = 30000,
  maxErrors = 100,
  showPerformance = true,
  showUserContext = true,
  className = '',
  compact = false
}) => {
  const [errors, setErrors] = useState<ErrorSummary[]>([])
  const [filteredErrors, setFilteredErrors] = useState<ErrorSummary[]>([])
  const [errorTrends, setErrorTrends] = useState<ErrorTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [resolvedFilter, setResolvedFilter] = useState<string>('all')
  const [selectedError, setSelectedError] = useState<ErrorSummary | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)

  // Load errors from localStorage (simulated)
  const loadErrors = useCallback(async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from your error reporting service
      const storedErrors = localStorage.getItem('error_reports')
      if (storedErrors) {
        const parsedErrors = JSON.parse(storedErrors)
        const errorSummaries = aggregateErrors(parsedErrors)
        setErrors(errorSummaries)
        generateTrends(errorSummaries)
      }

      // Load performance metrics if enabled
      if (showPerformance) {
        const metrics = performanceMonitoringService.getPerformanceSummary()
        setPerformanceMetrics(metrics)
      }
    } catch (error) {
      console.error('Failed to load errors:', error)
    } finally {
      setLoading(false)
    }
  }, [showPerformance])

  // Aggregate similar errors
  const aggregateErrors = (rawErrors: any[]): ErrorSummary[] => {
    const errorMap = new Map<string, ErrorSummary>()

    rawErrors.forEach(error => {
      const key = `${error.message}-${error.stack?.split('\n')[0] || ''}`
      
      if (errorMap.has(key)) {
        const existing = errorMap.get(key)!
        existing.count++
        existing.lastSeen = new Date(error.timestamp)
        if (error.userId && !existing.userId) {
          existing.userId = error.userId
        }
      } else {
        errorMap.set(key, {
          id: error.id || `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          message: error.message,
          type: determineErrorType(error),
          severity: determineSeverity(error),
          count: 1,
          firstSeen: new Date(error.timestamp),
          lastSeen: new Date(error.timestamp),
          stack: error.stack,
          url: error.url,
          userAgent: error.userAgent,
          userId: error.userId,
          sessionId: error.sessionId,
          context: error.context,
          resolved: false,
          tags: generateTags(error)
        })
      }
    })

    return Array.from(errorMap.values())
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, maxErrors)
  }

  // Determine error type
  const determineErrorType = (error: any): ErrorSummary['type'] => {
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return 'network'
    }
    if (error.message?.includes('database') || error.message?.includes('SQL')) {
      return 'database'
    }
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return 'validation'
    }
    if (error.message?.includes('performance') || error.message?.includes('slow')) {
      return 'performance'
    }
    return 'javascript'
  }

  // Determine error severity
  const determineSeverity = (error: any): ErrorSummary['severity'] => {
    if (error.message?.includes('critical') || error.message?.includes('fatal')) {
      return 'critical'
    }
    if (error.message?.includes('error') || error.stack) {
      return 'high'
    }
    if (error.message?.includes('warning')) {
      return 'medium'
    }
    return 'low'
  }

  // Generate error tags
  const generateTags = (error: any): string[] => {
    const tags: string[] = []
    
    if (error.url) {
      const path = new URL(error.url).pathname
      tags.push(`page:${path}`)
    }
    
    if (error.userAgent) {
      if (error.userAgent.includes('Chrome')) tags.push('browser:chrome')
      if (error.userAgent.includes('Firefox')) tags.push('browser:firefox')
      if (error.userAgent.includes('Safari')) tags.push('browser:safari')
      if (error.userAgent.includes('Mobile')) tags.push('device:mobile')
    }
    
    if (error.userId) {
      tags.push('user:authenticated')
    } else {
      tags.push('user:anonymous')
    }
    
    return tags
  }

  // Generate error trends
  const generateTrends = (errors: ErrorSummary[]) => {
    const trends: { [key: string]: { [type: string]: number } } = {}
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    // Initialize trends
    last7Days.forEach(date => {
      trends[date] = {
        javascript: 0,
        network: 0,
        database: 0,
        validation: 0,
        performance: 0
      }
    })

    // Count errors by date and type
    errors.forEach(error => {
      const errorDate = error.lastSeen.toISOString().split('T')[0]
      if (trends[errorDate]) {
        trends[errorDate][error.type] += error.count
      }
    })

    // Convert to array format
    const trendData: ErrorTrend[] = []
    Object.entries(trends).forEach(([date, counts]) => {
      Object.entries(counts).forEach(([type, count]) => {
        trendData.push({ date, type, count })
      })
    })

    setErrorTrends(trendData)
  }

  // Filter errors
  useEffect(() => {
    let filtered = errors

    if (searchTerm) {
      filtered = filtered.filter(error => 
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.stack?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(error => error.type === typeFilter)
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(error => error.severity === severityFilter)
    }

    if (resolvedFilter !== 'all') {
      const isResolved = resolvedFilter === 'resolved'
      filtered = filtered.filter(error => !!error.resolved === isResolved)
    }

    setFilteredErrors(filtered)
  }, [errors, searchTerm, typeFilter, severityFilter, resolvedFilter])

  // Auto-refresh
  useEffect(() => {
    loadErrors()
    
    if (refreshInterval > 0) {
      const interval = setInterval(loadErrors, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadErrors, refreshInterval])

  // Mark error as resolved
  const markAsResolved = useCallback((errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    ))
  }, [])

  // Export errors
  const exportErrors = useCallback(() => {
    const dataStr = JSON.stringify(filteredErrors, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `error-report-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [filteredErrors])

  // Get error type icon
  const getErrorTypeIcon = (type: ErrorSummary['type']) => {
    switch (type) {
      case 'javascript':
        return <Bug className="h-4 w-4" />
      case 'network':
        return <Globe className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'validation':
        return <AlertTriangle className="h-4 w-4" />
      case 'performance':
        return <Zap className="h-4 w-4" />
      default:
        return <Bug className="h-4 w-4" />
    }
  }

  // Get severity color
  const getSeverityColor = (severity: ErrorSummary['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Calculate error statistics
  const totalErrors = errors.reduce((sum, error) => sum + error.count, 0)
  const criticalErrors = errors.filter(error => error.severity === 'critical').length
  const resolvedErrors = errors.filter(error => error.resolved).length
  const errorRate = errors.length > 0 ? (resolvedErrors / errors.length) * 100 : 0

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">{totalErrors} errors</span>
        </div>
        
        {criticalErrors > 0 && (
          <Badge variant="destructive">
            {criticalErrors} critical
          </Badge>
        )}
        
        <div className="text-sm text-muted-foreground">
          {errorRate.toFixed(1)}% resolved
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Error Monitoring</h2>
          <p className="text-muted-foreground">
            Track and manage application errors
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadErrors}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportErrors}
            disabled={filteredErrors.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{totalErrors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalErrors}</p>
              </div>
              <Bug className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedErrors}</p>
              </div>
              <div className="flex items-center">
                {errorRate > 50 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">{errorRate.toFixed(1)}%</p>
              </div>
              <div className="w-16">
                <Progress value={errorRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search errors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="validation">Validation</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            {(searchTerm || typeFilter !== 'all' || severityFilter !== 'all' || resolvedFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                  setSeverityFilter('all')
                  setResolvedFilter('all')
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Error Details ({filteredErrors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading errors...</span>
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No errors found matching your criteria
            </div>
          ) : (
            <div className="space-y-2">
              {filteredErrors.map(error => (
                <Collapsible key={error.id}>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getErrorTypeIcon(error.type)}
                          <div>
                            <p className="font-medium truncate max-w-96">
                              {error.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className={getSeverityColor(error.severity)}>
                                {error.severity}
                              </Badge>
                              <Badge variant="outline">
                                {error.type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {error.count} occurrence{error.count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {error.resolved && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Resolved
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {error.lastSeen.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {/* Error Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">First Seen:</span>
                          <span className="ml-2">{error.firstSeen.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">Last Seen:</span>
                          <span className="ml-2">{error.lastSeen.toLocaleString()}</span>
                        </div>
                        {error.url && (
                          <div className="md:col-span-2">
                            <span className="font-medium">URL:</span>
                            <span className="ml-2 break-all">{error.url}</span>
                          </div>
                        )}
                        {showUserContext && error.userId && (
                          <div>
                            <span className="font-medium">User ID:</span>
                            <span className="ml-2">{error.userId}</span>
                          </div>
                        )}
                        {error.sessionId && (
                          <div>
                            <span className="font-medium">Session ID:</span>
                            <span className="ml-2">{error.sessionId}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {error.tags && error.tags.length > 0 && (
                        <div>
                          <span className="font-medium text-sm">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {error.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Stack Trace */}
                      {error.stack && (
                        <div>
                          <span className="font-medium text-sm">Stack Trace:</span>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      
                      {/* Context */}
                      {error.context && Object.keys(error.context).length > 0 && (
                        <div>
                          <span className="font-medium text-sm">Context:</span>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        {!error.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsResolved(error.id)}
                          >
                            Mark as Resolved
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedError(error)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ErrorMonitoringDashboard