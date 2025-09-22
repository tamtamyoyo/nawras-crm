import { logger } from './logger'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of items
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
}

class Cache<T = unknown> {
  private cache = new Map<string, CacheItem<T>>()
  private readonly defaultTTL: number
  private readonly maxSize: number
  private readonly storage: 'memory' | 'localStorage' | 'sessionStorage'
  private readonly storageKey: string

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // 5 minutes default
    this.maxSize = options.maxSize || 100
    this.storage = options.storage || 'memory'
    this.storageKey = 'crm_cache'

    // Load from persistent storage if not memory
    if (this.storage !== 'memory') {
      this.loadFromStorage()
    }

    // Cleanup expired items periodically
    setInterval(() => this.cleanup(), 60000) // Every minute
  }

  private loadFromStorage(): void {
    try {
      const storage = this.storage === 'localStorage' ? localStorage : sessionStorage
      const stored = storage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([key, item]) => {
          this.cache.set(key, item as CacheItem<T>)
        })
      }
    } catch (error) {
      logger.warn('Failed to load cache from storage', { error })
    }
  }

  private saveToStorage(): void {
    if (this.storage === 'memory') return

    try {
      const storage = this.storage === 'localStorage' ? localStorage : sessionStorage
      const data = Object.fromEntries(this.cache.entries())
      storage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      logger.warn('Failed to save cache to storage', { error })
    }
  }

  set(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key
    }

    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, item)
    this.saveToStorage()

    logger.debug('Cache item set', { key, ttl: item.ttl })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      logger.debug('Cache miss', { key })
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.saveToStorage()
      logger.debug('Cache item expired', { key })
      return null
    }

    logger.debug('Cache hit', { key })
    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.saveToStorage()
      return false
    }

    return true
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.saveToStorage()
      logger.debug('Cache item deleted', { key })
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.saveToStorage()
    logger.debug('Cache cleared')
  }

  private cleanup(): void {
    const now = Date.now()
    let expiredCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        expiredCount++
      }
    }

    if (expiredCount > 0) {
      this.saveToStorage()
      logger.debug('Cache cleanup completed', { expiredCount })
    }
  }

  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    items: Array<{ key: string; age: number; ttl: number }>
  } {
    const now = Date.now()
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      age: now - item.timestamp,
      ttl: item.ttl
    }))

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      items
    }
  }
}

// API Cache wrapper
class ApiCache {
  private cache: Cache<unknown>
  private pendingRequests = new Map<string, Promise<unknown>>()

  constructor(options: CacheOptions = {}) {
    this.cache = new Cache({
      ttl: 5 * 60 * 1000, // 5 minutes for API responses
      maxSize: 200,
      storage: 'sessionStorage',
      ...options
    })
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    // Return cached data if available and not forcing refresh
    if (!options.forceRefresh) {
      const cached = this.cache.get(key)
      if (cached !== null) {
        return cached as T
      }
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending) {
      logger.debug('Returning pending request', { key })
      return pending as Promise<T>
    }

    // Make new request
    const request = fetcher()
      .then((data) => {
        this.cache.set(key, data, options.ttl)
        this.pendingRequests.delete(key)
        return data
      })
      .catch((error) => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, request)
    return request
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    // Simple pattern matching (supports wildcards)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    const stats = this.cache.getStats()
    
    stats.items.forEach(({ key }) => {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    })

    logger.debug('Cache invalidated', { pattern })
  }

  // Invalidate related cache entries
  invalidateRelated(entity: string, id?: string): void {
    const patterns = [
      `${entity}:*`,
      `${entity}s:*`,
      'dashboard:*',
      'stats:*'
    ]

    if (id) {
      patterns.push(`${entity}:${id}:*`)
    }

    patterns.forEach(pattern => this.invalidate(pattern))
  }

  getStats() {
    return this.cache.getStats()
  }
}

// Query cache for search results
class QueryCache {
  private cache: Cache<unknown>
  private readonly maxQueryAge = 2 * 60 * 1000 // 2 minutes for search results

  constructor() {
    this.cache = new Cache({
      ttl: this.maxQueryAge,
      maxSize: 50,
      storage: 'memory' // Search results are session-specific
    })
  }

  generateKey(endpoint: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, unknown>)
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`
  }

  get(endpoint: string, params: Record<string, unknown>) {
    const key = this.generateKey(endpoint, params)
    return this.cache.get(key)
  }

  set(endpoint: string, params: Record<string, unknown>, data: unknown) {
    const key = this.generateKey(endpoint, params)
    this.cache.set(key, data)
  }

  invalidateQueries(endpoint: string) {
    const stats = this.cache.getStats()
    stats.items.forEach(({ key }) => {
      if (key.startsWith(`${endpoint}:`)) {
        this.cache.delete(key)
      }
    })
  }

  clear() {
    this.cache.clear()
  }
}

// Create global cache instances
export const apiCache = new ApiCache()
export const queryCache = new QueryCache()

// Cache utilities
export const cacheUtils = {
  // Generate cache key for API endpoints
  generateApiKey: (method: string, endpoint: string, params?: unknown): string => {
    const paramString = params ? `:${JSON.stringify(params)}` : ''
    return `api:${method}:${endpoint}${paramString}`
  },

  // Generate cache key for entities
  generateEntityKey: (entity: string, id?: string, action?: string): string => {
    let key = `entity:${entity}`
    if (id) key += `:${id}`
    if (action) key += `:${action}`
    return key
  },

  // Cache decorator for functions
  cached: <T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    ttl?: number
  ) => {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      const key = keyGenerator(...args)
      return apiCache.get(key, () => fn(...args), { ttl }) as Promise<Awaited<ReturnType<T>>>
    }
  }
}

export { Cache, ApiCache, QueryCache }
export type { CacheOptions, CacheItem }