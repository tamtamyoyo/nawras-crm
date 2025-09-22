import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity, Database, Zap, Bell, Clock } from 'lucide-react';
import { checkSystemHealth, collectPerformanceMetrics, PerformanceMetrics } from '../lib/monitoring';
import { captureException } from '../lib/sentry';
import { getActiveAlerts, getAlertStats, acknowledgeAlert } from '../lib/alerting';

interface HealthCheckProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const HealthCheck: React.FC<HealthCheckProps> = ({ autoRefresh: propAutoRefresh = true, refreshInterval = 30000 }) => {
  const [healthData, setHealthData] = useState<{ overall: 'healthy' | 'unhealthy' | 'degraded'; services: { service: string; status: 'healthy' | 'unhealthy' | 'degraded'; timestamp: string; responseTime?: number; error?: string; details?: Record<string, unknown> }[]; timestamp: string } | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(propAutoRefresh);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<{ id: string; severity: string; message: string; value: number; threshold: number; timestamp: Date }[]>([]);
  const [alertStats, setAlertStats] = useState<{ total: number; active: number; bySeverity: Record<'low' | 'medium' | 'high' | 'critical', number>; last24Hours: number } | null>(null);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const [health, performance, activeAlerts, stats] = await Promise.all([
        checkSystemHealth(),
        collectPerformanceMetrics(),
        Promise.resolve(getActiveAlerts()),
        Promise.resolve(getAlertStats())
      ]);
      
      setHealthData(health);
      setPerformanceData(performance);
      setAlerts(activeAlerts);
      setAlertStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      captureException(error as Error);
    } finally {
      setLoading(false);
    }
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-600" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Value: {alert.value} | Threshold: {alert.threshold} | {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">System Health</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-600' : 'text-gray-600'}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealthData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {healthData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.overall)}
                  <Badge className={getStatusColor(healthData.overall)}>
                    {healthData.overall.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {healthData.services.map((service) => {
                  const getServiceIcon = (serviceName: string) => {
                    switch (serviceName) {
                      case 'database': return <Database className="h-4 w-4 text-blue-600" />;
                      case 'application': return <Activity className="h-4 w-4 text-green-600" />;
                      default: return <Zap className="h-4 w-4 text-purple-600" />;
                    }
                  };
                  
                  return (
                    <div key={service.service} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(service.service)}
                        <span className="text-sm font-medium capitalize">{service.service}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                      {service.responseTime && (
                        <p className="text-xs text-gray-600">
                          Response: {service.responseTime}ms
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading health data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {performanceData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className={`text-2xl font-bold ${getPerformanceColor(performanceData.responseTime, { good: 500, warning: 1000 })}`}>
                  {performanceData.responseTime}ms
                </p>
                <p className="text-sm text-gray-600">Response Time</p>
              </div>
              
              <div className="text-center">
                <p className={`text-2xl font-bold ${getPerformanceColor(performanceData.memoryUsage, { good: 60, warning: 80 })}`}>
                  {performanceData.memoryUsage}%
                </p>
                <p className="text-sm text-gray-600">Memory Usage</p>
              </div>
              
              <div className="text-center">
                <p className={`text-2xl font-bold ${performanceData.errorRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {performanceData.errorRate}%
                </p>
                <p className="text-sm text-gray-600">Error Rate</p>
              </div>
              
              <div className="text-center">
                <p className={`text-2xl font-bold ${getPerformanceColor(100 - performanceData.performanceScore, { good: 20, warning: 40 })}`}>
                  {performanceData.performanceScore}
                </p>
                <p className="text-sm text-gray-600">Performance Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Statistics */}
      {alertStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Alert Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{alertStats.total}</p>
                <p className="text-sm text-gray-600">Total Alerts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{alertStats.active}</p>
                <p className="text-sm text-gray-600">Active Alerts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{alertStats.bySeverity.critical + alertStats.bySeverity.high}</p>
                <p className="text-sm text-gray-600">High/Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{alertStats.last24Hours}</p>
                <p className="text-sm text-gray-600">Last 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
};