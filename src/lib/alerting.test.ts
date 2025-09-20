import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AlertingService, checkAlerts, getActiveAlerts, getAlertStats, acknowledgeAlert } from './alerting'
import { toast } from 'sonner'
import * as Sentry from '@sentry/react'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('@sentry/react', () => ({
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn()
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Alerting Service', () => {
  let alertingService: AlertingService

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    alertingService = new AlertingService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AlertingService', () => {
    describe('checkThresholds', () => {
      it('should detect memory usage threshold breach', () => {
        const metrics = {
          memory: { used: 90000000, total: 100000000 }, // 90% usage
          network: { rtt: 50 },
          system: { cores: 4 },
          timestamp: Date.now()
        }

        const alerts = alertingService.checkThresholds(metrics)
        
        expect(alerts).toHaveLength(1)
        expect(alerts[0]).toMatchObject({
          type: 'memory_high',
          severity: 'warning',
          message: expect.stringContaining('Memory usage is high')
        })
      })

      it('should detect critical memory usage', () => {
        const metrics = {
          memory: { used: 96000000, total: 100000000 }, // 96% usage
          network: { rtt: 50 },
          system: { cores: 4 },
          timestamp: Date.now()
        }

        const alerts = alertingService.checkThresholds(metrics)
        
        expect(alerts).toHaveLength(1)
        expect(alerts[0]).toMatchObject({
          type: 'memory_critical',
          severity: 'critical',
          message: expect.stringContaining('Memory usage is critically high')
        })
      })

      it('should detect network latency issues', () => {
        const metrics = {
          memory: { used: 50000000, total: 100000000 },
          network: { rtt: 1200 }, // High latency
          system: { cores: 4 },
          timestamp: Date.now()
        }

        const alerts = alertingService.checkThresholds(metrics)
        
        expect(alerts).toHaveLength(1)
        expect(alerts[0]).toMatchObject({
          type: 'network_slow',
          severity: 'warning',
          message: expect.stringContaining('Network latency is high')
        })
      })

      it('should not create alerts for normal metrics', () => {
        const metrics = {
          memory: { used: 50000000, total: 100000000 }, // 50% usage
          network: { rtt: 100 }, // Normal latency
          system: { cores: 4 },
          timestamp: Date.now()
        }

        const alerts = alertingService.checkThresholds(metrics)
        
        expect(alerts).toHaveLength(0)
      })

      it('should handle missing metrics gracefully', () => {
        const metrics = {
          timestamp: Date.now()
        }

        const alerts = alertingService.checkThresholds(metrics)
        
        expect(alerts).toHaveLength(0)
      })
    })

    describe('sendNotification', () => {
      it('should send toast notification for warning alerts', () => {
        const alert = {
          id: '1',
          type: 'memory_high',
          severity: 'warning' as const,
          message: 'Memory usage is high',
          timestamp: Date.now(),
          acknowledged: false
        }

        alertingService.sendNotification(alert)

        expect(toast.warning).toHaveBeenCalledWith(
          'Memory usage is high',
          expect.objectContaining({
            description: expect.stringContaining('Warning')
          })
        )
      })

      it('should send toast notification for critical alerts', () => {
        const alert = {
          id: '1',
          type: 'memory_critical',
          severity: 'critical' as const,
          message: 'Memory usage is critically high',
          timestamp: Date.now(),
          acknowledged: false
        }

        alertingService.sendNotification(alert)

        expect(toast.error).toHaveBeenCalledWith(
          'Memory usage is critically high',
          expect.objectContaining({
            description: expect.stringContaining('Critical')
          })
        )
      })

      it('should send Sentry message for critical alerts', () => {
        const alert = {
          id: '1',
          type: 'memory_critical',
          severity: 'critical' as const,
          message: 'Memory usage is critically high',
          timestamp: Date.now(),
          acknowledged: false
        }

        alertingService.sendNotification(alert)

        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          'Memory usage is critically high',
          'error'
        )
      })
    })

    describe('acknowledgeAlert', () => {
      it('should mark alert as acknowledged', () => {
        const alert = {
          id: '1',
          type: 'memory_high',
          severity: 'warning' as const,
          message: 'Memory usage is high',
          timestamp: Date.now(),
          acknowledged: false
        }

        alertingService.alerts = [alert]
        alertingService.acknowledgeAlert('1')

        expect(alertingService.alerts[0].acknowledged).toBe(true)
      })

      it('should save acknowledged alerts to localStorage', () => {
        const alert = {
          id: '1',
          type: 'memory_high',
          severity: 'warning' as const,
          message: 'Memory usage is high',
          timestamp: Date.now(),
          acknowledged: false
        }

        alertingService.alerts = [alert]
        alertingService.acknowledgeAlert('1')

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'crm_alerts',
          expect.stringContaining('"acknowledged":true')
        )
      })
    })

    describe('getStats', () => {
      it('should return correct alert statistics', () => {
        alertingService.alerts = [
          {
            id: '1',
            type: 'memory_high',
            severity: 'warning',
            message: 'Test 1',
            timestamp: Date.now(),
            acknowledged: false
          },
          {
            id: '2',
            type: 'memory_critical',
            severity: 'critical',
            message: 'Test 2',
            timestamp: Date.now(),
            acknowledged: true
          },
          {
            id: '3',
            type: 'network_slow',
            severity: 'warning',
            message: 'Test 3',
            timestamp: Date.now(),
            acknowledged: false
          }
        ]

        const stats = alertingService.getStats()

        expect(stats).toEqual({
          total: 3,
          active: 2,
          acknowledged: 1,
          critical: 1,
          warning: 2,
          info: 0
        })
      })
    })
  })

  describe('Utility Functions', () => {
    describe('checkAlerts', () => {
      it('should check thresholds and return triggered alerts', () => {
        const metrics = {
          memory: { used: 90000000, total: 100000000 },
          network: { rtt: 50 },
          system: { cores: 4 },
          timestamp: Date.now()
        }

        const alerts = checkAlerts(metrics)
        
        expect(alerts).toHaveLength(1)
        expect(alerts[0].type).toBe('memory_high')
      })
    })

    describe('getActiveAlerts', () => {
      it('should return only unacknowledged alerts', () => {
        // Mock localStorage to return alerts
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
          {
            id: '1',
            type: 'memory_high',
            severity: 'warning',
            message: 'Test 1',
            timestamp: Date.now(),
            acknowledged: false
          },
          {
            id: '2',
            type: 'memory_critical',
            severity: 'critical',
            message: 'Test 2',
            timestamp: Date.now(),
            acknowledged: true
          }
        ]))

        const activeAlerts = getActiveAlerts()
        
        expect(activeAlerts).toHaveLength(1)
        expect(activeAlerts[0].id).toBe('1')
        expect(activeAlerts[0].acknowledged).toBe(false)
      })
    })

    describe('getAlertStats', () => {
      it('should return alert statistics', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
          {
            id: '1',
            type: 'memory_high',
            severity: 'warning',
            message: 'Test 1',
            timestamp: Date.now(),
            acknowledged: false
          },
          {
            id: '2',
            type: 'memory_critical',
            severity: 'critical',
            message: 'Test 2',
            timestamp: Date.now(),
            acknowledged: true
          }
        ]))

        const stats = getAlertStats()
        
        expect(stats).toEqual({
          total: 2,
          active: 1,
          acknowledged: 1,
          critical: 1,
          warning: 1,
          info: 0
        })
      })
    })

    describe('acknowledgeAlert', () => {
      it('should acknowledge alert by ID', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
          {
            id: '1',
            type: 'memory_high',
            severity: 'warning',
            message: 'Test 1',
            timestamp: Date.now(),
            acknowledged: false
          }
        ]))

        acknowledgeAlert('1')

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'crm_alerts',
          expect.stringContaining('"acknowledged":true')
        )
      })
    })
  })
})