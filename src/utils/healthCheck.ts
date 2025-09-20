interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  checks: {
    database: HealthStatus
    storage: HealthStatus
    auth: HealthStatus
    api: HealthStatus
  }
  uptime: number
  version: string
}

interface HealthStatus {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  error?: string
  lastChecked: string
}

class HealthCheckService {
  private startTime = Date.now()

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkAuth(),
      this.checkAPI()
    ])

    const [database, storage, auth, api] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : this.createErrorStatus()
    )

    const overallStatus = this.determineOverallStatus([database, storage, auth, api])

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: { database, storage, auth, api },
      uptime: Date.now() - this.startTime,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    }
  }

  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now()
    try {
      // Check Supabase connection
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      )

      const { error } = await supabase.from('customers').select('count').limit(1)
      
      if (error) throw error

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private async checkStorage(): Promise<HealthStatus> {
    const startTime = Date.now()
    try {
      // Check localStorage availability
      const testKey = '__health_check_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Storage unavailable',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private async checkAuth(): Promise<HealthStatus> {
    const startTime = Date.now()
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      )

      const { error } = await supabase.auth.getSession()
      
      if (error) throw error

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Auth service unavailable',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private async checkAPI(): Promise<HealthStatus> {
    const startTime = Date.now()
    try {
      // Check if the app is responsive
      const response = await fetch(window.location.origin, { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'API unavailable',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private createErrorStatus(): HealthStatus {
    return {
      status: 'down',
      error: 'Health check failed',
      lastChecked: new Date().toISOString()
    }
  }

  private determineOverallStatus(checks: HealthStatus[]): 'healthy' | 'unhealthy' | 'degraded' {
    const downCount = checks.filter(check => check.status === 'down').length
    const degradedCount = checks.filter(check => check.status === 'degraded').length

    if (downCount === 0 && degradedCount === 0) {
      return 'healthy'
    } else if (downCount > checks.length / 2) {
      return 'unhealthy'
    } else {
      return 'degraded'
    }
  }

  // Expose health check endpoint
  async getHealthStatus(): Promise<HealthCheckResult> {
    return this.performHealthCheck()
  }

  // Start periodic health checks
  startPeriodicChecks(intervalMs: number = 60000): () => void {
    const interval = setInterval(async () => {
      const health = await this.performHealthCheck()
      
      // Log health status
      console.log('Health Check:', health)
      
      // Trigger alerts if unhealthy
      if (health.status === 'unhealthy') {
        this.triggerAlert(health)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }

  private triggerAlert(health: HealthCheckResult): void {
    // In production, integrate with alerting service
    console.error('ALERT: Application is unhealthy', health)
    
    // Example: Send to monitoring service
    if (import.meta.env.MODE === 'production') {
      // Integration with services like Sentry, DataDog, etc.
    }
  }
}

export const healthCheckService = new HealthCheckService()
export type { HealthCheckResult, HealthStatus }