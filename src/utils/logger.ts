type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, string | number | boolean | null | undefined>

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  stack?: string
  userId?: string
  sessionId?: string
}

interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableStorage: boolean
  maxStorageEntries: number
  enableRemoteLogging: boolean
  remoteEndpoint?: string
}

class Logger {
  private config: LoggerConfig
  private sessionId: string
  private logBuffer: LogEntry[] = []
  private readonly STORAGE_KEY = 'crm_logs'

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      enableRemoteLogging: false,
      ...config
    }
    
    this.sessionId = this.generateSessionId()
    this.loadStoredLogs()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.config.level)
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      stack: error?.stack,
      sessionId: this.sessionId,
      userId: this.getCurrentUserId()
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user ID from auth context or localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.id
    } catch {
      return undefined
    }
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context)
        break
      case 'info':
        console.info(message, entry.context)
        break
      case 'warn':
        console.warn(message, entry.context)
        break
      case 'error':
        console.error(message, entry.context, entry.stack)
        break
    }
  }

  private writeToStorage(entry: LogEntry): void {
    if (!this.config.enableStorage) return

    try {
      this.logBuffer.push(entry)
      
      // Limit buffer size
      if (this.logBuffer.length > this.config.maxStorageEntries) {
        this.logBuffer = this.logBuffer.slice(-this.config.maxStorageEntries)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logBuffer))
    } catch (error) {
      console.warn('Failed to write log to storage:', error)
    }
  }

  private async writeToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemoteLogging || !this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      console.warn('Failed to send log to remote endpoint:', error)
    }
  }

  private loadStoredLogs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.logBuffer = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error)
      this.logBuffer = []
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, context, error)
    
    this.writeToConsole(entry)
    this.writeToStorage(entry)
    
    if (this.config.enableRemoteLogging) {
      this.writeToRemote(entry).catch(() => {
        // Silently fail remote logging to avoid infinite loops
      })
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error)
  }

  // Utility methods for common logging scenarios
  logUserAction(action: string, details?: LogContext): void {
    this.info(`User action: ${action}`, { action, ...details })
  }

  logApiCall(method: string, url: string, duration?: number, status?: number): void {
    this.info(`API call: ${method} ${url}`, { method, url, duration, status })
  }

  logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, { metric, value, unit })
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, error, context)
  }

  // Get logs for debugging or export
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let logs = this.logBuffer
    
    if (level) {
      logs = logs.filter(entry => entry.level === level)
    }
    
    if (limit) {
      logs = logs.slice(-limit)
    }
    
    return logs
  }

  // Clear stored logs
  clearLogs(): void {
    this.logBuffer = []
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2)
  }

  // Update configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Create default logger instance
const logger = new Logger({
  level: import.meta.env.MODE === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  enableRemoteLogging: import.meta.env.MODE === 'production'
})

export { logger, Logger }
export type { LogLevel, LogEntry, LoggerConfig, LogContext }