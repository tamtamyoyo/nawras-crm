interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface NavigationTiming {
  dns: number
  tcp: number
  request: number
  response: number
  dom: number
  load: number
  total: number
}

interface ResourceTiming {
  name: string
  type: string
  size: number
  duration: number
  startTime: number
}

interface UserTiming {
  name: string
  duration: number
  startTime: number
  type: 'measure' | 'mark'
}

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceReport {
  navigation: NavigationTiming | null
  resources: ResourceTiming[]
  userTimings: UserTiming[]
  memory: MemoryInfo | null
  vitals: {
    fcp?: number // First Contentful Paint
    lcp?: number // Largest Contentful Paint
    fid?: number // First Input Delay
    cls?: number // Cumulative Layout Shift
    ttfb?: number // Time to First Byte
  }
  customMetrics: PerformanceMetric[]
}

interface PerformanceConfig {
  enableResourceTiming?: boolean
  enableUserTiming?: boolean
  enableMemoryMonitoring?: boolean
  enableVitalsMonitoring?: boolean
  reportingInterval?: number
  maxMetricsHistory?: number
  thresholds?: {
    slowPageLoad?: number
    slowApiCall?: number
    highMemoryUsage?: number
  }
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = []
  private config: Required<PerformanceConfig>
  private observers: Map<string, PerformanceObserver> = new Map()
  private vitalsData: PerformanceReport['vitals'] = {}
  private reportingInterval: NodeJS.Timeout | null = null
  private listeners: Set<(report: PerformanceReport) => void> = new Set()

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableResourceTiming: true,
      enableUserTiming: true,
      enableMemoryMonitoring: true,
      enableVitalsMonitoring: true,
      reportingInterval: 30000, // 30 seconds
      maxMetricsHistory: 1000,
      thresholds: {
        slowPageLoad: 3000, // 3 seconds
        slowApiCall: 2000, // 2 seconds
        highMemoryUsage: 100 * 1024 * 1024 // 100MB
      },
      ...config
    }

    this.initialize()
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    if (typeof window === 'undefined') return

    // Monitor navigation timing
    this.setupNavigationTiming()

    // Monitor resource timing
    if (this.config.enableResourceTiming) {
      this.setupResourceTiming()
    }

    // Monitor user timing
    if (this.config.enableUserTiming) {
      this.setupUserTiming()
    }

    // Monitor Web Vitals
    if (this.config.enableVitalsMonitoring) {
      this.setupVitalsMonitoring()
    }

    // Start periodic reporting
    this.startPeriodicReporting()

    // Monitor memory usage
    if (this.config.enableMemoryMonitoring) {
      this.startMemoryMonitoring()
    }
  }

  /**
   * Setup navigation timing monitoring
   */
  private setupNavigationTiming(): void {
    if (!('performance' in window) || !('getEntriesByType' in performance)) return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          this.recordMetric('navigation.dns', navigation.domainLookupEnd - navigation.domainLookupStart)
          this.recordMetric('navigation.tcp', navigation.connectEnd - navigation.connectStart)
          this.recordMetric('navigation.request', navigation.responseStart - navigation.requestStart)
          this.recordMetric('navigation.response', navigation.responseEnd - navigation.responseStart)
          this.recordMetric('navigation.dom', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart)
          this.recordMetric('navigation.load', navigation.loadEventEnd - navigation.loadEventStart)
          this.recordMetric('navigation.total', navigation.loadEventEnd - navigation.fetchStart)

          // Check for slow page load
          const totalTime = navigation.loadEventEnd - navigation.fetchStart
          if (totalTime > this.config.thresholds.slowPageLoad) {
            this.recordMetric('performance.slow_page_load', totalTime, { threshold: String(this.config.thresholds.slowPageLoad) })
          }
        }
      }, 0)
    })
  }

  /**
   * Setup resource timing monitoring
   */
  private setupResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const resource = entry as PerformanceResourceTiming
          this.recordMetric('resource.duration', resource.duration, {
            name: resource.name,
            type: this.getResourceType(resource.name)
          })

          // Check for slow resources
          if (resource.duration > 1000) { // 1 second
            this.recordMetric('performance.slow_resource', resource.duration, {
              name: resource.name,
              type: this.getResourceType(resource.name)
            })
          }
        })
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', observer)
    } catch (error) {
      console.warn('Failed to setup resource timing observer:', error)
    }
  }

  /**
   * Setup user timing monitoring
   */
  private setupUserTiming(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric(`user.${entry.name}`, entry.duration || 0, {
            type: entry.entryType
          })
        })
      })

      observer.observe({ entryTypes: ['measure', 'mark'] })
      this.observers.set('user', observer)
    } catch (error) {
      console.warn('Failed to setup user timing observer:', error)
    }
  }

  /**
   * Setup Web Vitals monitoring
   */
  private setupVitalsMonitoring(): void {
    if (!('PerformanceObserver' in window)) return

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.vitalsData.fcp = entry.startTime
            this.recordMetric('vitals.fcp', entry.startTime)
          }
        })
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
      this.observers.set('fcp', fcpObserver)
    } catch (error) {
      console.warn('Failed to setup FCP observer:', error)
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.vitalsData.lcp = entry.startTime
          this.recordMetric('vitals.lcp', entry.startTime)
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)
    } catch (error) {
      console.warn('Failed to setup LCP observer:', error)
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const fid = (entry as any).processingStart - entry.startTime
          this.vitalsData.fid = fid
          this.recordMetric('vitals.fid', fid)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)
    } catch (error) {
      console.warn('Failed to setup FID observer:', error)
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        })
        this.vitalsData.cls = clsValue
        this.recordMetric('vitals.cls', clsValue)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    } catch (error) {
      console.warn('Failed to setup CLS observer:', error)
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return

    setInterval(() => {
      const memory = (performance as any).memory
      if (memory) {
        this.recordMetric('memory.used', memory.usedJSHeapSize)
        this.recordMetric('memory.total', memory.totalJSHeapSize)
        this.recordMetric('memory.limit', memory.jsHeapSizeLimit)

        // Check for high memory usage
        if (memory.usedJSHeapSize > this.config.thresholds.highMemoryUsage) {
          this.recordMetric('performance.high_memory_usage', memory.usedJSHeapSize, {
            threshold: String(this.config.thresholds.highMemoryUsage)
          })
        }
      }
    }, 10000) // Every 10 seconds
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    this.reportingInterval = setInterval(() => {
      const report = this.generateReport()
      this.notifyListeners(report)
    }, this.config.reportingInterval)
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)

    // Limit metrics history
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsHistory)
    }
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(name: string, fn: () => Promise<T> | T, tags?: Record<string, string>): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, tags)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetric(`${name}.error`, duration, tags)
      throw error
    }
  }

  /**
   * Time an API call
   */
  async timeApiCall<T>(name: string, apiCall: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      this.recordMetric(`api.${name}`, duration, { ...tags, status: 'success' })
      
      // Check for slow API calls
      if (duration > this.config.thresholds.slowApiCall) {
        this.recordMetric('performance.slow_api_call', duration, {
          ...tags,
          name,
          threshold: String(this.config.thresholds.slowApiCall)
        })
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetric(`api.${name}`, duration, { ...tags, status: 'error' })
      throw error
    }
  }

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name)
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): void {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark)
      } catch (error) {
        console.warn('Failed to measure performance:', error)
      }
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      navigation: this.getNavigationTiming(),
      resources: this.getResourceTiming(),
      userTimings: this.getUserTiming(),
      memory: this.getMemoryInfo(),
      vitals: { ...this.vitalsData },
      customMetrics: [...this.metrics]
    }

    return report
  }

  /**
   * Get navigation timing data
   */
  private getNavigationTiming(): NavigationTiming | null {
    if (!('performance' in window) || !('getEntriesByType' in performance)) return null

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) return null

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart
    }
  }

  /**
   * Get resource timing data
   */
  private getResourceTiming(): ResourceTiming[] {
    if (!('performance' in window) || !('getEntriesByType' in performance)) return []

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return resources.map(resource => ({
      name: resource.name,
      type: this.getResourceType(resource.name),
      size: resource.transferSize || 0,
      duration: resource.duration,
      startTime: resource.startTime
    }))
  }

  /**
   * Get user timing data
   */
  private getUserTiming(): UserTiming[] {
    if (!('performance' in window) || !('getEntriesByType' in performance)) return []

    const marks = performance.getEntriesByType('mark')
    const measures = performance.getEntriesByType('measure')
    
    const userTimings: UserTiming[] = []
    
    marks.forEach(mark => {
      userTimings.push({
        name: mark.name,
        duration: 0,
        startTime: mark.startTime,
        type: 'mark'
      })
    })
    
    measures.forEach(measure => {
      userTimings.push({
        name: measure.name,
        duration: measure.duration,
        startTime: measure.startTime,
        type: 'measure'
      })
    })
    
    return userTimings
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): MemoryInfo | null {
    if (!('memory' in performance)) return null

    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (url.includes('.woff') || url.includes('.ttf')) return 'font'
    if (url.includes('/api/')) return 'api'
    return 'other'
  }

  /**
   * Add performance report listener
   */
  addReportListener(listener: (report: PerformanceReport) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(report: PerformanceReport): void {
    this.listeners.forEach(listener => {
      try {
        listener(report)
      } catch (error) {
        console.error('Error in performance report listener:', error)
      }
    })
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averagePageLoad: number
    averageApiCall: number
    memoryUsage: number
    slowOperations: number
    totalMetrics: number
  } {
    const pageLoadMetrics = this.metrics.filter(m => m.name === 'navigation.total')
    const apiCallMetrics = this.metrics.filter(m => m.name.startsWith('api.'))
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory.used')
    const slowOperations = this.metrics.filter(m => m.name.startsWith('performance.slow'))

    return {
      averagePageLoad: pageLoadMetrics.length > 0 
        ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length 
        : 0,
      averageApiCall: apiCallMetrics.length > 0 
        ? apiCallMetrics.reduce((sum, m) => sum + m.value, 0) / apiCallMetrics.length 
        : 0,
      memoryUsage: memoryMetrics.length > 0 
        ? memoryMetrics[memoryMetrics.length - 1].value 
        : 0,
      slowOperations: slowOperations.length,
      totalMetrics: this.metrics.length
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval)
    }

    this.observers.forEach(observer => {
      observer.disconnect()
    })
    this.observers.clear()
    this.listeners.clear()
  }
}

// Create a singleton instance
const performanceMonitoringService = new PerformanceMonitoringService()

export default performanceMonitoringService
export { PerformanceMonitoringService }
export type { PerformanceMetric, PerformanceReport, PerformanceConfig, NavigationTiming, ResourceTiming, UserTiming, MemoryInfo }