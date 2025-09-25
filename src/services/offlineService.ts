interface OfflineQueueItem {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  table: string
  data: unknown
  timestamp: number
  retryCount: number
  maxRetries: number
}

interface OfflineStorageConfig {
  maxQueueSize?: number
  maxRetries?: number
  syncInterval?: number
  storagePrefix?: string
}

interface SyncResult {
  success: boolean
  processed: number
  failed: number
  errors: string[]
}

class OfflineService {
  private isOnline: boolean = navigator.onLine
  private syncQueue: OfflineQueueItem[] = []
  private syncInterval: NodeJS.Timeout | null = null
  private listeners: Set<(isOnline: boolean) => void> = new Set()
  private config: Required<OfflineStorageConfig>

  constructor(config: OfflineStorageConfig = {}) {
    this.config = {
      maxQueueSize: 1000,
      maxRetries: 3,
      syncInterval: 30000, // 30 seconds
      storagePrefix: 'crm_offline_',
      ...config
    }

    this.initializeOfflineHandling()
    this.loadQueueFromStorage()
    this.startSyncInterval()
  }

  /**
   * Initialize offline event handling
   */
  private initializeOfflineHandling(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners(true)
      this.syncQueuedOperations()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners(false)
    })

    // Check connection periodically
    setInterval(() => {
      const wasOnline = this.isOnline
      this.isOnline = navigator.onLine
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners(this.isOnline)
        if (this.isOnline) {
          this.syncQueuedOperations()
        }
      }
    }, 5000)
  }

  /**
   * Add listener for online/offline status changes
   */
  addStatusListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline)
      } catch (error) {
        console.error('Error in offline status listener:', error)
      }
    })
  }

  /**
   * Check if currently online
   */
  isOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Store data locally
   */
  setLocalData(key: string, data: unknown): void {
    try {
      const storageKey = `${this.config.storagePrefix}${key}`
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to store data locally:', error)
    }
  }

  /**
   * Get data from local storage
   */
  getLocalData<T>(key: string): T | null {
    try {
      const storageKey = `${this.config.storagePrefix}${key}`
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null
      
      const parsed = JSON.parse(stored)
      return parsed.data
    } catch (error) {
      console.error('Failed to get local data:', error)
      return null
    }
  }

  /**
   * Remove data from local storage
   */
  removeLocalData(key: string): void {
    try {
      const storageKey = `${this.config.storagePrefix}${key}`
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to remove local data:', error)
    }
  }

  /**
   * Get all local data keys
   */
  getLocalDataKeys(): string[] {
    const keys: string[] = []
    const prefix = this.config.storagePrefix
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keys.push(key.substring(prefix.length))
      }
    }
    
    return keys
  }

  /**
   * Queue operation for later sync
   */
  queueOperation(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    table: string,
    data: unknown
  ): string {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const queueItem: OfflineQueueItem = {
      id,
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    }

    this.syncQueue.push(queueItem)
    
    // Limit queue size
    if (this.syncQueue.length > this.config.maxQueueSize) {
      this.syncQueue = this.syncQueue.slice(-this.config.maxQueueSize)
    }
    
    this.saveQueueToStorage()
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncQueuedOperations()
    }
    
    return id
  }

  /**
   * Get queued operations count
   */
  getQueuedOperationsCount(): number {
    return this.syncQueue.length
  }

  /**
   * Get queued operations
   */
  getQueuedOperations(): OfflineQueueItem[] {
    return [...this.syncQueue]
  }

  /**
   * Clear all queued operations
   */
  clearQueue(): void {
    this.syncQueue = []
    this.saveQueueToStorage()
  }

  /**
   * Sync queued operations
   */
  async syncQueuedOperations(): Promise<SyncResult> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return { success: true, processed: 0, failed: 0, errors: [] }
    }

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    }

    const itemsToProcess = [...this.syncQueue]
    
    for (const item of itemsToProcess) {
      try {
        await this.syncSingleOperation(item)
        
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(q => q.id !== item.id)
        result.processed++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`${item.type} ${item.table}: ${errorMessage}`)
        
        // Increment retry count
        const queueItem = this.syncQueue.find(q => q.id === item.id)
        if (queueItem) {
          queueItem.retryCount++
          
          // Remove if max retries reached
          if (queueItem.retryCount >= queueItem.maxRetries) {
            this.syncQueue = this.syncQueue.filter(q => q.id !== item.id)
            result.failed++
          }
        }
      }
    }

    result.success = result.failed === 0
    this.saveQueueToStorage()
    
    return result
  }

  /**
   * Sync a single operation
   */
  private async syncSingleOperation(item: OfflineQueueItem): Promise<void> {
    // This would be implemented with actual API calls
    // For now, we'll simulate the sync operation
    
    console.log(`Syncing ${item.type} operation for ${item.table}:`, item.data)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated sync failure')
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      const queueKey = `${this.config.storagePrefix}sync_queue`
      localStorage.setItem(queueKey, JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const queueKey = `${this.config.storagePrefix}sync_queue`
      const stored = localStorage.getItem(queueKey)
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.syncQueue = []
    }
  }

  /**
   * Start automatic sync interval
   */
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncQueuedOperations()
      }
    }, this.config.syncInterval)
  }

  /**
   * Stop automatic sync interval
   */
  stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Cache management
   */
  getCachedData<T>(key: string, maxAge: number = 3600000): T | null { // 1 hour default
    try {
      const storageKey = `${this.config.storagePrefix}cache_${key}`
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null
      
      const parsed = JSON.parse(stored)
      const age = Date.now() - parsed.timestamp
      
      if (age > maxAge) {
        localStorage.removeItem(storageKey)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return null
    }
  }

  setCachedData(key: string, data: unknown): void {
    try {
      const storageKey = `${this.config.storagePrefix}cache_${key}`
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  clearCache(): void {
    const prefix = `${this.config.storagePrefix}cache_`
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    totalItems: number
    queueSize: number
    cacheSize: number
    estimatedSize: string
  } {
    let totalItems = 0
    let queueSize = 0
    let cacheSize = 0
    let estimatedBytes = 0
    
    const prefix = this.config.storagePrefix
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        totalItems++
        const value = localStorage.getItem(key) || ''
        estimatedBytes += key.length + value.length
        
        if (key.includes('sync_queue')) {
          queueSize++
        } else if (key.includes('cache_')) {
          cacheSize++
        }
      }
    }
    
    return {
      totalItems,
      queueSize,
      cacheSize,
      estimatedSize: this.formatBytes(estimatedBytes)
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Cleanup old data
   */
  cleanup(maxAge: number = 7 * 24 * 3600000): void { // 7 days default
    const cutoffTime = Date.now() - maxAge
    const prefix = this.config.storagePrefix
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const parsed = JSON.parse(value)
            if (parsed.timestamp && parsed.timestamp < cutoffTime) {
              keysToRemove.push(key)
            }
          }
        } catch (error) {
          // Remove invalid entries
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`Cleaned up ${keysToRemove.length} old offline storage items`)
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.stopSyncInterval()
    this.listeners.clear()
    window.removeEventListener('online', this.initializeOfflineHandling)
    window.removeEventListener('offline', this.initializeOfflineHandling)
  }
}

// Create a singleton instance
const offlineService = new OfflineService()

export default offlineService
export { OfflineService }
export type { OfflineQueueItem, OfflineStorageConfig, SyncResult }