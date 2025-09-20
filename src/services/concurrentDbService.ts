import { supabase } from '../lib/supabase-client';
import { toast } from 'sonner';

// Types for optimistic locking
interface VersionedRecord {
  id: string;
  version: number;
  updated_at: string;
}

interface ConflictError extends Error {
  code: 'CONFLICT';
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

// Concurrent operation tracking
class OperationLock {
  private static locks = new Set<string>();
  
  static async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.locks.has(key)) {
      throw new Error(`Operation ${key} is already in progress`);
    }
    
    this.locks.add(key);
    try {
      return await operation();
    } finally {
      this.locks.delete(key);
    }
  }
  
  static isLocked(key: string): boolean {
    return this.locks.has(key);
  }
}

// Enhanced database service with concurrency control
export class ConcurrentDbService {
  // Optimistic locking update with conflict detection
  static async updateWithOptimisticLocking<T extends VersionedRecord>(
    table: string,
    id: string,
    updates: Partial<T>,
    expectedVersion: number,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    return this.withRetry(async () => {
      const lockKey = `${table}-${id}`;
      
      return OperationLock.withLock(lockKey, async () => {
        // First, get the current record to check version
        const { data: currentRecord, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        // Check for version conflict
        if (currentRecord.version !== expectedVersion) {
          const conflictError = new Error('Record was modified by another user') as ConflictError;
          conflictError.code = 'CONFLICT';
          conflictError.localData = { ...updates, version: expectedVersion };
          conflictError.remoteData = currentRecord;
          throw conflictError;
        }
        
        // Perform the update
        const { data, error } = await supabase
          .from(table)
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('version', expectedVersion)
          .select()
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No rows updated - version conflict
            const conflictError = new Error('Record was modified by another user') as ConflictError;
            conflictError.code = 'CONFLICT';
            conflictError.localData = { ...updates, version: expectedVersion };
            conflictError.remoteData = currentRecord;
            throw conflictError;
          }
          throw error;
        }
        
        return data;
      });
    }, retryConfig);
  }
  
  // Safe create operation with duplicate detection
  static async createSafely<T>(
    table: string,
    data: Omit<T, 'id' | 'created_at' | 'updated_at' | 'version'>,
    uniqueFields: string[] = [],
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    return this.withRetry(async () => {
      // Check for duplicates if unique fields are specified
      if (uniqueFields.length > 0) {
        const conditions = uniqueFields.map(field => {
          const value = (data as Record<string, unknown>)[field];
          return `${field}.eq.${value}`;
        }).join(',');
        
        const { data: existing } = await supabase
          .from(table)
          .select('id')
          .or(conditions)
          .limit(1);
        
        if (existing && existing.length > 0) {
          throw new Error(`Record with duplicate ${uniqueFields.join(', ')} already exists`);
        }
      }
      
      const { data: created, error } = await supabase
        .from(table)
        .insert({
          ...data,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return created;
    }, retryConfig);
  }
  
  // Delete with version check
  static async deleteWithVersion(
    table: string,
    id: string,
    expectedVersion: number,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<void> {
    return this.withRetry(async () => {
      const lockKey = `${table}-${id}`;
      
      return OperationLock.withLock(lockKey, async () => {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id)
          .eq('version', expectedVersion);
        
        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Record was modified by another user');
          }
          throw error;
        }
      });
    }, retryConfig);
  }
  
  // Calendar functionality removed
  
  // Batch operations with transaction-like behavior
  static async batchUpdate<T extends VersionedRecord>(
    operations: Array<{
      table: string;
      id: string;
      updates: Partial<T>;
      expectedVersion: number;
    }>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T[]> {
    return this.withRetry(async () => {
      const results: T[] = [];
      const lockKeys = operations.map(op => `${op.table}-${op.id}`);
      
      // Sort lock keys to prevent deadlocks
      lockKeys.sort();
      
      // Acquire all locks
      for (const key of lockKeys) {
        if (OperationLock.isLocked(key)) {
          throw new Error(`Batch operation conflict: ${key} is locked`);
        }
      }
      
      // Execute all operations
      for (const operation of operations) {
        const result = await this.updateWithOptimisticLocking(
          operation.table,
          operation.id,
          operation.updates,
          operation.expectedVersion,
          { maxRetries: 1, baseDelay: 0, maxDelay: 0 } // No retry in batch
        );
        results.push(result);
      }
      
      return results;
    }, retryConfig);
  }
  
  // Retry mechanism with exponential backoff
  private static async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on conflict errors - they need user intervention
        if ((error as ConflictError).code === 'CONFLICT') {
          throw error;
        }
        
        if (attempt === config.maxRetries) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
          config.maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  // Conflict resolution helpers
  static resolveConflict<T>(
    localData: Partial<T>,
    remoteData: T,
    strategy: 'local' | 'remote' | 'merge' | 'manual' = 'manual'
  ): T {
    switch (strategy) {
      case 'local':
        return { ...remoteData, ...localData };
      case 'remote':
        return remoteData;
      case 'merge': {
        // Simple merge strategy - prefer newer timestamps
        const localTime = (localData as Record<string, unknown>).updated_at;
        const remoteTime = (remoteData as Record<string, unknown>).updated_at;
        
        if (localTime && remoteTime && new Date(localTime) > new Date(remoteTime)) {
          return { ...remoteData, ...localData };
        }
        return remoteData;
      }
      case 'manual':
      default:
        // Return both for manual resolution
        throw new Error('Manual conflict resolution required');
    }
  }
  
  // Show user-friendly conflict resolution UI
  static showConflictResolution<T>(
    localData: Partial<T>,
    remoteData: T,
    onResolve: (resolved: T) => void
  ): void {
    toast.error('Data Conflict Detected', {
      description: 'Another user has modified this record. Please choose how to resolve the conflict.',
      duration: 10000,
      action: {
        label: 'Resolve',
        onClick: () => {
          // In a real implementation, this would open a modal
          // For now, we'll use the merge strategy
          const resolved = this.resolveConflict(localData, remoteData, 'merge');
          onResolve(resolved);
        }
      }
    });
  }
}

// Export utility functions
export const withOptimisticLocking = ConcurrentDbService.updateWithOptimisticLocking.bind(ConcurrentDbService);
export const createSafely = ConcurrentDbService.createSafely.bind(ConcurrentDbService);
// Calendar functionality removed
export const resolveConflict = ConcurrentDbService.resolveConflict.bind(ConcurrentDbService);

// Metrics tracking
export class ConcurrencyMetrics {
  private static conflicts = 0;
  private static retries = 0;
  private static operations = 0;
  private static lockWaits = 0;

  static recordConflict(): void {
    this.conflicts++;
  }

  static recordRetry(): void {
    this.retries++;
  }

  static recordOperation(): void {
    this.operations++;
  }
  
  static recordLockWait(): void {
    this.lockWaits++;
  }

  static getMetrics() {
    return {
      conflictRate: this.operations > 0 ? this.conflicts / this.operations : 0,
      retryRate: this.operations > 0 ? this.retries / this.operations : 0,
      lockWaitRate: this.operations > 0 ? this.lockWaits / this.operations : 0,
      totalOperations: this.operations,
      totalConflicts: this.conflicts,
      totalRetries: this.retries,
      totalLockWaits: this.lockWaits
    };
  }
  
  static reset(): void {
    this.conflicts = 0;
    this.retries = 0;
    this.operations = 0;
    this.lockWaits = 0;
  }
}