import { logger } from './logger'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  context?: Record<string, unknown>
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
  element?: Element
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number
  name: string
}

interface NavigationTiming {
  pageLoadTime: number
  domContentLoadedTime: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private readonly MAX_METRICS = 1000

  constructor() {
    this.initializeObservers()
    this.measureNavigationTiming()
  }

  private initializeObservers(): void {
    // Observe paint metrics
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(entry.name, entry.startTime, 'ms', {
              entryType: entry.entryType
            })
          }
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(paintObserver)
      } catch (error) {
        logger.warn('Failed to initialize paint observer', { error })
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.recordMetric('largest-contentful-paint', lastEntry.startTime, 'ms', {
            element: (lastEntry as LargestContentfulPaintEntry).element?.tagName
          })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        logger.warn('Failed to initialize LCP observer', { error })
      }

      // Observe layout shifts
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as LayoutShiftEntry
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value
            }
          }
          this.recordMetric('cumulative-layout-shift', clsValue, 'score')
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (error) {
        logger.warn('Failed to initialize CLS observer', { error })
      }

      // Observe first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const firstInputEntry = entry as FirstInputEntry
            this.recordMetric('first-input-delay', firstInputEntry.processingStart - entry.startTime, 'ms', {
              inputType: firstInputEntry.name
            })
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        logger.warn('Failed to initialize FID observer', { error })
      }
    }
  }

  private measureNavigationTiming(): void {
    if ('performance' in window && 'timing' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing
          const navigation = performance.navigation

          const pageLoadTime = timing.loadEventEnd - timing.navigationStart
          const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart
          const dnsLookupTime = timing.domainLookupEnd - timing.domainLookupStart
          const tcpConnectTime = timing.connectEnd - timing.connectStart
          const serverResponseTime = timing.responseEnd - timing.requestStart
          const domProcessingTime = timing.domComplete - timing.domLoading

          this.recordMetric('page-load-time', pageLoadTime, 'ms', {
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount
          })

          this.recordMetric('dom-content-loaded-time', domContentLoadedTime, 'ms')
          this.recordMetric('dns-lookup-time', dnsLookupTime, 'ms')
          this.recordMetric('tcp-connect-time', tcpConnectTime, 'ms')
          this.recordMetric('server-response-time', serverResponseTime, 'ms')
          this.recordMetric('dom-processing-time', domProcessingTime, 'ms')

          logger.logPerformance('page-load-time', pageLoadTime)
          logger.logPerformance('dom-content-loaded-time', domContentLoadedTime)
        }, 0)
      })
    }
  }

  recordMetric(name: string, value: number, unit: string = 'ms', context?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context
    }

    this.metrics.push(metric)

    // Limit metrics array size
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    logger.logPerformance(name, value, unit)

    // Alert on poor performance
    this.checkPerformanceThresholds(metric)
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds: Record<string, number> = {
      'page-load-time': 3000, // 3 seconds
      'first-contentful-paint': 1800, // 1.8 seconds
      'largest-contentful-paint': 2500, // 2.5 seconds
      'first-input-delay': 100, // 100ms
      'cumulative-layout-shift': 0.1 // CLS score
    }

    const threshold = thresholds[metric.name]
    if (threshold && metric.value > threshold) {
      logger.warn(`Performance threshold exceeded for ${metric.name}`, {
        metric: metric.name,
        value: metric.value,
        threshold,
        unit: metric.unit
      })
    }
  }

  // Measure API call performance
  measureApiCall<T>(promise: Promise<T>, endpoint: string, method: string = 'GET'): Promise<T> {
    const startTime = performance.now()
    
    return promise
      .then((result) => {
        const duration = performance.now() - startTime
        this.recordMetric(`api-call-${method.toLowerCase()}`, duration, 'ms', {
          endpoint,
          method,
          status: 'success'
        })
        logger.logApiCall(method, endpoint, duration, 200)
        return result
      })
      .catch((error) => {
        const duration = performance.now() - startTime
        this.recordMetric(`api-call-${method.toLowerCase()}`, duration, 'ms', {
          endpoint,
          method,
          status: 'error',
          error: error.message
        })
        logger.logApiCall(method, endpoint, duration, 500)
        throw error
      })
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now()
    renderFn()
    const duration = performance.now() - startTime
    
    this.recordMetric('component-render', duration, 'ms', {
      component: componentName
    })
  }

  // Get performance summary
  getPerformanceSummary(): {
    metrics: PerformanceMetric[]
    averages: Record<string, number>
    navigationTiming?: NavigationTiming
  } {
    const averages: Record<string, number> = {}
    const metricGroups: Record<string, number[]> = {}

    // Group metrics by name
    this.metrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = []
      }
      metricGroups[metric.name].push(metric.value)
    })

    // Calculate averages
    Object.keys(metricGroups).forEach(name => {
      const values = metricGroups[name]
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length
    })

    return {
      metrics: this.metrics,
      averages,
      navigationTiming: this.getNavigationTiming()
    }
  }

  private getNavigationTiming(): NavigationTiming | undefined {
    if (!('performance' in window) || !('timing' in performance)) {
      return undefined
    }

    const timing = performance.timing
    return {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart
    }
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = []
  }

  // Export metrics
  exportMetrics(): string {
    return JSON.stringify(this.getPerformanceSummary(), null, 2)
  }

  // Cleanup observers
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Create global performance monitor instance
const performanceMonitor = new PerformanceMonitor()

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.destroy()
})

export { performanceMonitor, PerformanceMonitor }
export type { PerformanceMetric, NavigationTiming }