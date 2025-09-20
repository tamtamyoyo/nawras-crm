import { captureException, captureMessage } from './sentry'
import { toast } from 'sonner'

export interface AlertConfig {
  id: string
  name: string
  description: string
  threshold: number
  metric: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  cooldownMs: number // Minimum time between alerts
}

export interface Alert {
  id: string
  configId: string
  timestamp: Date
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  acknowledged: boolean
}

class AlertingService {
  private alerts: Alert[] = []
  private lastAlertTime: Map<string, number> = new Map()
  private configs: AlertConfig[] = [
    {
      id: 'response-time-high',
      name: 'High Response Time',
      description: 'API response time exceeds threshold',
      threshold: 2000, // 2 seconds
      metric: 'response_time',
      severity: 'medium',
      enabled: true,
      cooldownMs: 60000 // 1 minute
    },
    {
      id: 'error-rate-high',
      name: 'High Error Rate',
      description: 'Error rate exceeds acceptable threshold',
      threshold: 5, // 5%
      metric: 'error_rate',
      severity: 'high',
      enabled: true,
      cooldownMs: 30000 // 30 seconds
    },
    {
      id: 'memory-usage-critical',
      name: 'Critical Memory Usage',
      description: 'Memory usage is critically high',
      threshold: 90, // 90%
      metric: 'memory_usage',
      severity: 'critical',
      enabled: true,
      cooldownMs: 120000 // 2 minutes
    },
    {
      id: 'database-connection-failed',
      name: 'Database Connection Failed',
      description: 'Unable to connect to database',
      threshold: 1, // Any failure
      metric: 'db_connection_failures',
      severity: 'critical',
      enabled: true,
      cooldownMs: 60000 // 1 minute
    },
    {
      id: 'performance-score-low',
      name: 'Low Performance Score',
      description: 'Application performance score is below threshold',
      threshold: 70, // 70%
      metric: 'performance_score',
      severity: 'medium',
      enabled: true,
      cooldownMs: 300000 // 5 minutes
    }
  ]

  checkThresholds(metrics: Record<string, number>): Alert[] {
    const triggeredAlerts: Alert[] = []
    const now = Date.now()

    for (const config of this.configs) {
      if (!config.enabled) continue

      const value = metrics[config.metric]
      if (value === undefined) continue

      // Check if threshold is exceeded
      const isThresholdExceeded = value > config.threshold
      if (!isThresholdExceeded) continue

      // Check cooldown period
      const lastAlert = this.lastAlertTime.get(config.id) || 0
      if (now - lastAlert < config.cooldownMs) continue

      // Create alert
      const alert: Alert = {
        id: `alert-${config.id}-${now}`,
        configId: config.id,
        timestamp: new Date(),
        value,
        threshold: config.threshold,
        severity: config.severity,
        message: `${config.name}: ${config.description} (${value} > ${config.threshold})`,
        acknowledged: false
      }

      this.alerts.push(alert)
      triggeredAlerts.push(alert)
      this.lastAlertTime.set(config.id, now)

      // Send alert notifications
      this.sendAlert(alert)
    }

    return triggeredAlerts
  }

  private sendAlert(alert: Alert): void {
    // Send toast notification
    toast(alert.message, {
      description: `Severity: ${alert.severity.toUpperCase()}`,
      duration: this.getToastDuration(alert.severity)
    })

    // Log to Sentry based on severity
    if (alert.severity === 'critical' || alert.severity === 'high') {
      captureException(new Error(alert.message), {
        tags: {
          alert_id: alert.id,
          severity: alert.severity,
          metric: alert.configId
        },
        extra: {
          value: alert.value,
          threshold: alert.threshold,
          timestamp: alert.timestamp
        }
      })
    } else {
      captureMessage(alert.message, {
        level: alert.severity === 'medium' ? 'warning' : 'info',
        tags: {
          alert_id: alert.id,
          severity: alert.severity,
          metric: alert.configId
        }
      })
    }

    // Console logging for development
    const logMethod = this.getLogMethod(alert.severity)
    logMethod(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, {
      alertId: alert.id,
      value: alert.value,
      threshold: alert.threshold,
      timestamp: alert.timestamp
    })
  }

  private getToastVariant(severity: Alert['severity']): 'default' | 'destructive' {
    return severity === 'critical' || severity === 'high' ? 'destructive' : 'default'
  }

  private getToastDuration(severity: Alert['severity']): number {
    switch (severity) {
      case 'critical': return 10000 // 10 seconds
      case 'high': return 8000 // 8 seconds
      case 'medium': return 6000 // 6 seconds
      case 'low': return 4000 // 4 seconds
      default: return 5000
    }
  }

  private getLogMethod(severity: Alert['severity']): typeof console.log {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error
      case 'medium':
        return console.warn
      case 'low':
      default:
        return console.info
    }
  }

  getAlerts(): Alert[] {
    return [...this.alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged)
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  clearOldAlerts(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const cutoff = Date.now() - maxAge
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > cutoff)
  }

  getAlertConfigs(): AlertConfig[] {
    return [...this.configs]
  }

  updateAlertConfig(configId: string, updates: Partial<AlertConfig>): boolean {
    const configIndex = this.configs.findIndex(c => c.id === configId)
    if (configIndex >= 0) {
      this.configs[configIndex] = { ...this.configs[configIndex], ...updates }
      return true
    }
    return false
  }

  getAlertStats(): {
    total: number
    active: number
    bySeverity: Record<Alert['severity'], number>
    last24Hours: number
  } {
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)
    
    const bySeverity: Record<Alert['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    let last24HoursCount = 0

    for (const alert of this.alerts) {
      bySeverity[alert.severity]++
      if (alert.timestamp.getTime() > last24Hours) {
        last24HoursCount++
      }
    }

    return {
      total: this.alerts.length,
      active: this.getActiveAlerts().length,
      bySeverity,
      last24Hours: last24HoursCount
    }
  }
}

// Export singleton instance
export const alertingService = new AlertingService()

// Export helper functions
export const checkAlerts = (metrics: Record<string, number>) => {
  return alertingService.checkThresholds(metrics)
}

export const getActiveAlerts = () => {
  return alertingService.getActiveAlerts()
}

export const acknowledgeAlert = (alertId: string) => {
  return alertingService.acknowledgeAlert(alertId)
}

export const getAlertStats = () => {
  return alertingService.getAlertStats()
}