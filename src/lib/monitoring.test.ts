import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { collectPerformanceMetrics, checkSystemHealth, checkDatabaseHealth, checkApplicationHealth } from './monitoring'

// Mock Sentry
vi.mock('./sentry', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  initSentry: vi.fn()
}))

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [{ count: 1 }], error: null }))
      }))
    }))
  }
}))

// Mock alerting service
vi.mock('./alerting', () => ({
  checkAlerts: vi.fn().mockReturnValue([]),
  alertingService: {
    checkThresholds: vi.fn().mockReturnValue([])
  }
}))

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => 1000),
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 50000000,
      totalJSHeapSize: 100000000,
      jsHeapSizeLimit: 200000000
    }
  },
  writable: true
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    },
    hardwareConcurrency: 8,
    userAgent: 'test-agent',
    onLine: true
  },
  writable: true
})

describe('Monitoring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('collectPerformanceMetrics', () => {
    it('should collect basic performance metrics', async () => {
      const metrics = await collectPerformanceMetrics()

      expect(metrics).toHaveProperty('timestamp')
      expect(metrics).toHaveProperty('responseTime')
      expect(metrics).toHaveProperty('memoryUsage')
      expect(metrics).toHaveProperty('errorRate')
      expect(metrics).toHaveProperty('performanceScore')
      expect(metrics).toHaveProperty('dbConnectionTime')
      expect(typeof metrics.responseTime).toBe('number')
      expect(typeof metrics.memoryUsage).toBe('number')
      expect(typeof metrics.performanceScore).toBe('number')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockSupabase = await import('./supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Connection failed' } }))
        }))
      } as { select: () => { limit: () => Promise<{ data: null; error: { message: string } }> } })

      const metrics = await collectPerformanceMetrics()

      expect(metrics.errorRate).toBe(100)
      expect(metrics.performanceScore).toBeLessThan(100)
    })
  })

  describe('checkDatabaseHealth', () => {
    it('should return healthy status for successful connection', async () => {
      const health = await checkDatabaseHealth()

      expect(health.service).toBe('database')
      expect(health.status).toBe('healthy')
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('responseTime')
      expect(typeof health.responseTime).toBe('number')
    })

    it('should return unhealthy status for failed connection', async () => {
      // Mock database error
      const mockSupabase = await import('./supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Connection failed' } }))
        }))
      } as { select: () => { limit: () => Promise<{ data: null; error: { message: string } }> } })

      const health = await checkDatabaseHealth()

      expect(health.service).toBe('database')
      expect(health.status).toBe('unhealthy')
      expect(health.error).toBe('Connection failed')
    })
  })

  describe('checkApplicationHealth', () => {
    it('should return healthy application status', async () => {
      const health = await checkApplicationHealth()

      expect(health.service).toBe('application')
      expect(health.status).toBe('healthy')
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('responseTime')
      expect(health.details).toHaveProperty('memoryUsage')
      expect(health.details).toHaveProperty('userAgent')
      expect(health.details).toHaveProperty('online')
    })
  })

  describe('checkSystemHealth', () => {
    it('should return overall system health', async () => {
      const systemHealth = await checkSystemHealth()

      expect(systemHealth).toHaveProperty('overall')
      expect(systemHealth).toHaveProperty('services')
      expect(systemHealth).toHaveProperty('timestamp')
      expect(systemHealth.services).toHaveLength(2)
      expect(systemHealth.services[0].service).toBe('database')
      expect(systemHealth.services[1].service).toBe('application')
    })

    it('should determine overall status based on service health', async () => {
      // Mock database error to test degraded status
      const mockSupabase = await import('./supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Connection failed' } }))
        }))
      } as { select: () => { limit: () => Promise<{ data: null; error: { message: string } }> } })

      const systemHealth = await checkSystemHealth()

      expect(systemHealth.overall).toBe('unhealthy')
      expect(systemHealth.services.some(s => s.status === 'unhealthy')).toBe(true)
    })
  })
})