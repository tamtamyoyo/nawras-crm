import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
  error?: string
  startTime?: number
  estimatedDuration?: number
}

interface LoadingOperation {
  id: string
  type: 'api' | 'database' | 'file' | 'computation' | 'navigation' | 'custom'
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  showSpinner?: boolean
  showProgress?: boolean
  allowCancel?: boolean
  timeout?: number
}

interface LoadingStateStore {
  operations: Map<string, LoadingState & LoadingOperation>
  globalLoading: boolean
  globalMessage: string
  
  // Actions
  startLoading: (operation: LoadingOperation) => void
  updateLoading: (id: string, updates: Partial<LoadingState>) => void
  finishLoading: (id: string, error?: string) => void
  cancelLoading: (id: string) => void
  setGlobalLoading: (loading: boolean, message?: string) => void
  clearAllLoading: () => void
  
  // Getters
  isOperationLoading: (id: string) => boolean
  getOperation: (id: string) => (LoadingState & LoadingOperation) | undefined
  getLoadingOperations: () => (LoadingState & LoadingOperation)[]
  getHighPriorityOperations: () => (LoadingState & LoadingOperation)[]
}

const useLoadingStore = create<LoadingStateStore>()(subscribeWithSelector((set, get) => ({
  operations: new Map(),
  globalLoading: false,
  globalMessage: '',

  startLoading: (operation: LoadingOperation) => {
    set((state) => {
      const newOperations = new Map(state.operations)
      newOperations.set(operation.id, {
        ...operation,
        isLoading: true,
        startTime: Date.now(),
        message: operation.description
      })
      
      return {
        operations: newOperations,
        globalLoading: newOperations.size > 0
      }
    })
    
    // Set timeout if specified
    if (operation.timeout) {
      setTimeout(() => {
        const currentOp = get().operations.get(operation.id)
        if (currentOp?.isLoading) {
          get().finishLoading(operation.id, 'Operation timed out')
        }
      }, operation.timeout)
    }
  },

  updateLoading: (id: string, updates: Partial<LoadingState>) => {
    set((state) => {
      const newOperations = new Map(state.operations)
      const existing = newOperations.get(id)
      
      if (existing) {
        newOperations.set(id, { ...existing, ...updates })
      }
      
      return { operations: newOperations }
    })
  },

  finishLoading: (id: string, error?: string) => {
    set((state) => {
      const newOperations = new Map(state.operations)
      const operation = newOperations.get(id)
      
      if (operation) {
        if (error) {
          newOperations.set(id, {
            ...operation,
            isLoading: false,
            error,
            progress: undefined
          })
          
          // Remove error operations after 3 seconds
          setTimeout(() => {
            set((state) => {
              const ops = new Map(state.operations)
              ops.delete(id)
              return {
                operations: ops,
                globalLoading: ops.size > 0
              }
            })
          }, 3000)
        } else {
          newOperations.delete(id)
        }
      }
      
      return {
        operations: newOperations,
        globalLoading: newOperations.size > 0
      }
    })
  },

  cancelLoading: (id: string) => {
    set((state) => {
      const newOperations = new Map(state.operations)
      newOperations.delete(id)
      
      return {
        operations: newOperations,
        globalLoading: newOperations.size > 0
      }
    })
  },

  setGlobalLoading: (loading: boolean, message?: string) => {
    set({ globalLoading: loading, globalMessage: message || '' })
  },

  clearAllLoading: () => {
    set({
      operations: new Map(),
      globalLoading: false,
      globalMessage: ''
    })
  },

  isOperationLoading: (id: string) => {
    return get().operations.get(id)?.isLoading || false
  },

  getOperation: (id: string) => {
    return get().operations.get(id)
  },

  getLoadingOperations: () => {
    return Array.from(get().operations.values()).filter(op => op.isLoading)
  },

  getHighPriorityOperations: () => {
    return Array.from(get().operations.values())
      .filter(op => op.isLoading && (op.priority === 'high' || op.priority === 'critical'))
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }
})))

class LoadingStateService {
  private store = useLoadingStore
  private operationCounter = 0

  /**
   * Generate unique operation ID
   */
  private generateOperationId(type: string, description: string): string {
    this.operationCounter++
    return `${type}_${this.operationCounter}_${Date.now()}`
  }

  /**
   * Start a loading operation
   */
  startOperation(
    type: LoadingOperation['type'],
    description: string,
    options: Partial<Omit<LoadingOperation, 'id' | 'type' | 'description'>> = {}
  ): string {
    const id = this.generateOperationId(type, description)
    
    const operation: LoadingOperation = {
      id,
      type,
      description,
      priority: 'medium',
      showSpinner: true,
      showProgress: false,
      allowCancel: false,
      ...options
    }

    this.store.getState().startLoading(operation)
    return id
  }

  /**
   * Update loading progress
   */
  updateProgress(id: string, progress: number, message?: string): void {
    this.store.getState().updateLoading(id, {
      progress: Math.max(0, Math.min(100, progress)),
      message
    })
  }

  /**
   * Update loading message
   */
  updateMessage(id: string, message: string): void {
    this.store.getState().updateLoading(id, { message })
  }

  /**
   * Finish loading operation
   */
  finishOperation(id: string, error?: string): void {
    this.store.getState().finishLoading(id, error)
  }

  /**
   * Cancel loading operation
   */
  cancelOperation(id: string): void {
    this.store.getState().cancelLoading(id)
  }

  /**
   * Wrapper for async operations with automatic loading state
   */
  async withLoading<T>(
    operation: () => Promise<T>,
    type: LoadingOperation['type'],
    description: string,
    options: Partial<Omit<LoadingOperation, 'id' | 'type' | 'description'>> = {}
  ): Promise<T> {
    const id = this.startOperation(type, description, options)
    
    try {
      const result = await operation()
      this.finishOperation(id)
      return result
    } catch (error) {
      this.finishOperation(id, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Wrapper for async operations with progress tracking
   */
  async withProgressTracking<T>(
    operation: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
    type: LoadingOperation['type'],
    description: string,
    options: Partial<Omit<LoadingOperation, 'id' | 'type' | 'description'>> = {}
  ): Promise<T> {
    const id = this.startOperation(type, description, {
      showProgress: true,
      ...options
    })
    
    const updateProgress = (progress: number, message?: string) => {
      this.updateProgress(id, progress, message)
    }
    
    try {
      const result = await operation(updateProgress)
      this.finishOperation(id)
      return result
    } catch (error) {
      this.finishOperation(id, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Batch operations with combined loading state
   */
  async withBatchLoading<T>(
    operations: Array<{
      operation: () => Promise<any>
      description: string
      weight?: number
    }>,
    type: LoadingOperation['type'],
    batchDescription: string,
    options: Partial<Omit<LoadingOperation, 'id' | 'type' | 'description'>> = {}
  ): Promise<T[]> {
    const id = this.startOperation(type, batchDescription, {
      showProgress: true,
      ...options
    })
    
    const totalWeight = operations.reduce((sum, op) => sum + (op.weight || 1), 0)
    let completedWeight = 0
    const results: T[] = []
    
    try {
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i]
        const weight = op.weight || 1
        
        this.updateMessage(id, `${op.description} (${i + 1}/${operations.length})`)
        
        const result = await op.operation()
        results.push(result)
        
        completedWeight += weight
        const progress = (completedWeight / totalWeight) * 100
        this.updateProgress(id, progress)
      }
      
      this.finishOperation(id)
      return results
    } catch (error) {
      this.finishOperation(id, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Set global loading state
   */
  setGlobalLoading(loading: boolean, message?: string): void {
    this.store.getState().setGlobalLoading(loading, message)
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.store.getState().clearAllLoading()
  }

  /**
   * Check if any operation is loading
   */
  isAnyLoading(): boolean {
    return this.store.getState().globalLoading
  }

  /**
   * Check if specific operation is loading
   */
  isLoading(id: string): boolean {
    return this.store.getState().isOperationLoading(id)
  }

  /**
   * Get operation details
   */
  getOperation(id: string): (LoadingState & LoadingOperation) | undefined {
    return this.store.getState().getOperation(id)
  }

  /**
   * Get all loading operations
   */
  getLoadingOperations(): (LoadingState & LoadingOperation)[] {
    return this.store.getState().getLoadingOperations()
  }

  /**
   * Get high priority operations
   */
  getHighPriorityOperations(): (LoadingState & LoadingOperation)[] {
    return this.store.getState().getHighPriorityOperations()
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(
    selector: (state: LoadingStateStore) => any,
    callback: (value: any) => void
  ): () => void {
    return this.store.subscribe(selector, callback)
  }

  /**
   * Subscribe to specific operation changes
   */
  subscribeToOperation(
    id: string,
    callback: (operation: (LoadingState & LoadingOperation) | undefined) => void
  ): () => void {
    return this.store.subscribe(
      (state) => state.operations.get(id),
      callback
    )
  }

  /**
   * Get loading statistics
   */
  getStatistics(): {
    totalOperations: number
    loadingOperations: number
    operationsByType: Record<string, number>
    operationsByPriority: Record<string, number>
    averageLoadingTime: number
    longestRunningOperation?: LoadingState & LoadingOperation
  } {
    const operations = Array.from(this.store.getState().operations.values())
    const loadingOps = operations.filter(op => op.isLoading)
    
    const operationsByType: Record<string, number> = {}
    const operationsByPriority: Record<string, number> = {}
    let totalLoadingTime = 0
    let completedOperations = 0
    
    operations.forEach(op => {
      operationsByType[op.type] = (operationsByType[op.type] || 0) + 1
      operationsByPriority[op.priority] = (operationsByPriority[op.priority] || 0) + 1
      
      if (!op.isLoading && op.startTime) {
        totalLoadingTime += Date.now() - op.startTime
        completedOperations++
      }
    })
    
    const longestRunningOperation = loadingOps
      .filter(op => op.startTime)
      .sort((a, b) => (a.startTime! - b.startTime!))[0]
    
    return {
      totalOperations: operations.length,
      loadingOperations: loadingOps.length,
      operationsByType,
      operationsByPriority,
      averageLoadingTime: completedOperations > 0 ? totalLoadingTime / completedOperations : 0,
      longestRunningOperation
    }
  }

  /**
   * Cleanup completed operations older than specified time
   */
  cleanup(maxAge: number = 300000): void { // 5 minutes default
    const now = Date.now()
    const operations = this.store.getState().operations
    const toRemove: string[] = []
    
    operations.forEach((op, id) => {
      if (!op.isLoading && op.startTime && (now - op.startTime) > maxAge) {
        toRemove.push(id)
      }
    })
    
    toRemove.forEach(id => {
      this.store.getState().cancelLoading(id)
    })
  }

  /**
   * Get the store hook for React components
   */
  getStoreHook() {
    return useLoadingStore
  }
}

// Create singleton instance
const loadingStateService = new LoadingStateService()

// Auto cleanup every 5 minutes
setInterval(() => {
  loadingStateService.cleanup()
}, 300000)

export default loadingStateService
export { LoadingStateService, useLoadingStore }
export type { LoadingState, LoadingOperation, LoadingStateStore }