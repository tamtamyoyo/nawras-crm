import { supabase } from './supabase-client';
import { checkAlerts } from './alerting';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: string;
}

// Database health check
export const checkDatabaseHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        error: error.message,
      };
    }
    
    return {
      service: 'database',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        query: 'SELECT count from customers LIMIT 1',
      },
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Application health check
export const checkApplicationHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  
  try {
    // Check if essential services are available
    const memoryUsage = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'application',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        memoryUsage: memoryUsage ? {
          used: memoryUsage.usedJSHeapSize,
          total: memoryUsage.totalJSHeapSize,
          limit: memoryUsage.jsHeapSizeLimit,
        } : 'unavailable',
        userAgent: navigator.userAgent,
        online: navigator.onLine,
      },
    };
  } catch (error) {
    return {
      service: 'application',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Comprehensive system health check
export const checkSystemHealth = async (): Promise<SystemHealth> => {
  const [databaseHealth, applicationHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkApplicationHealth(),
  ]);
  
  const services = [databaseHealth, applicationHealth];
  
  // Determine overall health
  const hasUnhealthy = services.some(s => s.status === 'unhealthy');
  const hasDegraded = services.some(s => s.status === 'degraded');
  
  let overall: 'healthy' | 'unhealthy' | 'degraded';
  if (hasUnhealthy) {
    overall = 'unhealthy';
  } else if (hasDegraded) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  return {
    overall,
    services,
    timestamp: new Date().toISOString(),
  };
};

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  errorRate: number;
  performanceScore: number;
  timestamp: Date;
  dbConnectionTime: number;
  totalCollectionTime: number;
}

// Performance metrics collection
export const collectPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  const startTime = performance.now()
  
  try {
    // Test database connectivity
    const dbStart = performance.now()
    const { error } = await supabase.from('customers').select('count').limit(1)
    const dbTime = performance.now() - dbStart
    
    const dbHealthy = !error
    
    // Get memory usage (approximation)
    const performanceWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } };
    const memoryUsage = performanceWithMemory.memory ? 
      Math.round((performanceWithMemory.memory.usedJSHeapSize / performanceWithMemory.memory.totalJSHeapSize) * 100) : 
      Math.random() * 30 + 40 // Fallback simulation
    
    // Calculate performance score
    let performanceScore = 100
    if (dbTime > 1000) performanceScore -= 30
    else if (dbTime > 500) performanceScore -= 15
    
    if (memoryUsage > 80) performanceScore -= 20
    else if (memoryUsage > 60) performanceScore -= 10
    
    const totalTime = performance.now() - startTime
    
    const metrics: PerformanceMetrics = {
      responseTime: Math.round(dbTime),
      memoryUsage,
      errorRate: dbHealthy ? 0 : 100,
      performanceScore: Math.max(0, performanceScore),
      timestamp: new Date(),
      dbConnectionTime: Math.round(dbTime),
      totalCollectionTime: Math.round(totalTime)
    }
    
    // Check alert thresholds
    const alertMetrics = {
      response_time: metrics.responseTime,
      memory_usage: metrics.memoryUsage,
      error_rate: metrics.errorRate,
      performance_score: metrics.performanceScore,
      db_connection_failures: dbHealthy ? 0 : 1
    }
    
    const triggeredAlerts = checkAlerts(alertMetrics)
    if (triggeredAlerts.length > 0) {
      console.log(`🚨 ${triggeredAlerts.length} alert(s) triggered:`, triggeredAlerts.map(a => a.message))
    }
    
    // Performance metrics collected successfully
    
    return metrics
  } catch (error) {
    console.error('Error collecting performance metrics:', error)
    
    // Check alerts for critical failure
    checkAlerts({
      response_time: 5000,
      memory_usage: 0,
      error_rate: 100,
      performance_score: 0,
      db_connection_failures: 1
    })
    
    // Return degraded metrics on error
    return {
      responseTime: 5000,
      memoryUsage: 0,
      errorRate: 100,
      performanceScore: 0,
      timestamp: new Date(),
      dbConnectionTime: 5000,
      totalCollectionTime: performance.now() - startTime
    }
  }
};

// Alert thresholds
export const ALERT_THRESHOLDS = {
  DATABASE_RESPONSE_TIME: 2000, // 2 seconds
  MEMORY_USAGE_PERCENT: 90,
  ERROR_RATE_PERCENT: 5,
  AVAILABILITY_PERCENT: 99,
} as const;

// Check if metrics exceed thresholds
export const checkAlertThresholds = (metrics: PerformanceMetrics) => {
  const alerts: string[] = [];
  
  if (metrics.memoryUsage > ALERT_THRESHOLDS.MEMORY_USAGE_PERCENT) {
    alerts.push(`High memory usage: ${metrics.memoryUsage.toFixed(1)}%`);
  }
  
  return alerts;
};