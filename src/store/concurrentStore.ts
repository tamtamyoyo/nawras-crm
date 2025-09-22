import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase-client';
import { ConcurrentDbService, ConcurrencyMetrics } from '../services/concurrentDbService';
import { toast } from 'sonner';
import { Database } from '../lib/database.types';

// Database entity types
type Customer = Database['public']['Tables']['customers']['Row'];
type Lead = Database['public']['Tables']['leads']['Row'];
type Deal = Database['public']['Tables']['deals']['Row'];
type Proposal = Database['public']['Tables']['proposals']['Row'];
type Invoice = Database['public']['Tables']['invoices']['Row'];

// Update types for partial updates
type CustomerUpdate = Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>> & { version?: number };
type LeadUpdate = Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>> & { version?: number };
type DealUpdate = Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at'>> & { version?: number };
type ProposalUpdate = Partial<Omit<Proposal, 'id' | 'created_at' | 'updated_at'>> & { version?: number };
type InvoiceUpdate = Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>> & { version?: number };

// Create types for new entities
type CustomerCreate = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
type LeadCreate = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;
type DealCreate = Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
type ProposalCreate = Omit<Proposal, 'id' | 'created_at' | 'updated_at'>;
type InvoiceCreate = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;

// Realtime payload type
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  errors?: string[];
}

// Realtime subscription type
interface RealtimeSubscription {
  unsubscribe: () => void;
}

// Types for concurrent operations
interface OperationState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;
}

interface ConflictResolution<T> {
  id: string;
  localData: Partial<T>;
  remoteData: T;
  timestamp: string;
  resolved: boolean;
}

interface ConcurrentStoreState {
  // Existing state
  customers: Customer[];
  leads: Lead[];
  deals: Deal[];
  proposals: Proposal[];
  invoices: Invoice[];
  // Calendar events removed
  
  // Loading states for each entity
  customersState: OperationState;
  leadsState: OperationState;
  dealsState: OperationState;
  proposalsState: OperationState;
  invoicesState: OperationState;
  // Calendar state removed
  
  // Concurrency control
  operationLocks: Set<string>;
  conflictResolutions: Map<string, ConflictResolution<Record<string, unknown>>>;
  realtimeSubscriptions: Map<string, RealtimeSubscription>;
  
  // Actions with concurrency control
  updateCustomerSafely: (id: string, updates: CustomerUpdate, expectedVersion: number) => Promise<void>;
  updateLeadSafely: (id: string, updates: LeadUpdate, expectedVersion: number) => Promise<void>;
  updateDealSafely: (id: string, updates: DealUpdate, expectedVersion: number) => Promise<void>;
  updateProposalSafely: (id: string, updates: ProposalUpdate, expectedVersion: number) => Promise<void>;
  updateInvoiceSafely: (id: string, updates: InvoiceUpdate, expectedVersion: number) => Promise<void>;
  
  createCustomerSafely: (data: CustomerCreate) => Promise<void>;
  createLeadSafely: (data: LeadCreate) => Promise<void>;
  createDealSafely: (data: DealCreate) => Promise<void>;
  createProposalSafely: (data: ProposalCreate) => Promise<void>;
  createInvoiceSafely: (data: InvoiceCreate) => Promise<void>;
  // Calendar methods removed
  
  // Conflict resolution
  resolveConflict: (id: string, strategy: 'local' | 'remote' | 'merge') => Promise<void>;
  getPendingConflicts: () => ConflictResolution<Record<string, unknown>>[];
  
  // Realtime synchronization
  setupRealtimeSync: () => () => void;
  handleRealtimeUpdate: (table: string, payload: RealtimePayload) => void;
  
  // Utility methods
  isOperationLocked: (key: string) => boolean;
  getEntityVersion: (table: string, id: string) => number | null;
  refreshEntity: (table: string, id: string) => Promise<void>;
}

const initialOperationState: OperationState = {
  isLoading: false,
  error: null,
  lastUpdated: new Date().toISOString()
};

export const useConcurrentStore = create<ConcurrentStoreState>()(subscribeWithSelector((set, get) => ({
    // Initial state
    customers: [],
    leads: [],
    deals: [],
    proposals: [],
    invoices: [],
    // Calendar events removed
    
    customersState: { ...initialOperationState },
    leadsState: { ...initialOperationState },
    dealsState: { ...initialOperationState },
    proposalsState: { ...initialOperationState },
    invoicesState: { ...initialOperationState },
    // Calendar state removed
    
    operationLocks: new Set(),
    conflictResolutions: new Map(),
    realtimeSubscriptions: new Map(),
    
    // Safe update operations with optimistic locking
    updateCustomerSafely: async (id: string, updates: CustomerUpdate, expectedVersion: number) => {
      const lockKey = `customers-${id}`;
      
      if (get().operationLocks.has(lockKey)) {
        toast.error('Operation in progress', {
          description: 'Please wait for the current operation to complete.'
        });
        return;
      }
      
      set(state => ({
        operationLocks: new Set([...state.operationLocks, lockKey]),
        customersState: { ...state.customersState, isLoading: true, error: null }
      }));
      
      try {
        ConcurrencyMetrics.recordOperation();
        
        const updated = await ConcurrentDbService.updateWithOptimisticLocking(
          'customers',
          id,
          updates,
          expectedVersion
        );
        
        set(state => ({
          customers: state.customers.map(c => c.id === id ? updated as any : c),
          customersState: {
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString()
          }
        }));
        
        toast.success('Customer updated successfully');
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string; remoteData?: Record<string, unknown> };
        if (err.code === 'CONFLICT') {
          ConcurrencyMetrics.recordConflict();
          
          // Store conflict for resolution
          const conflictId = `customers-${id}-${Date.now()}`;
          set(state => ({
            conflictResolutions: new Map(state.conflictResolutions.set(conflictId, {
              id: conflictId,
              localData: updates as any,
              remoteData: err.remoteData || {},
              timestamp: new Date().toISOString(),
              resolved: false
            }))
          }));
          
          ConcurrentDbService.showConflictResolution(
            { ...updates, version: expectedVersion } as any,
            err.remoteData || {},
            () => get().resolveConflict(conflictId, 'merge')
          );
        } else {
          set(() => ({
            customersState: {
              isLoading: false,
              error: err.message || 'Unknown error occurred',
              lastUpdated: new Date().toISOString()
            }
          }));
          
          toast.error('Failed to update customer', {
            description: err.message || 'Unknown error occurred'
          });
        }
      } finally {
        set(state => {
          const newLocks = new Set(state.operationLocks);
          newLocks.delete(lockKey);
          return { operationLocks: newLocks };
        });
      }
    },
    
    // Similar implementations for other entities
    updateLeadSafely: async (id: string, updates: LeadUpdate, expectedVersion: number) => {
      // Implementation similar to updateCustomerSafely but for leads
      const lockKey = `leads-${id}`;
      
      if (get().operationLocks.has(lockKey)) {
        toast.error('Operation in progress');
        return;
      }
      
      set(state => ({
        operationLocks: new Set([...state.operationLocks, lockKey]),
        leadsState: { ...state.leadsState, isLoading: true, error: null }
      }));
      
      try {
        ConcurrencyMetrics.recordOperation();
        
        const updated = await ConcurrentDbService.updateWithOptimisticLocking(
          'leads',
          id,
          updates,
          expectedVersion
        );
        
        set(state => ({
          leads: state.leads.map(l => l.id === id ? updated : l) as any,
          leadsState: {
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString()
          }
        }));
        
        toast.success('Lead updated successfully');
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string; remoteData?: Record<string, unknown> };
        if (err.code === 'CONFLICT') {
          ConcurrencyMetrics.recordConflict();
          
          const conflictId = `leads-${id}-${Date.now()}`;
          set(state => ({
            conflictResolutions: new Map(state.conflictResolutions.set(conflictId, {
              id: conflictId,
              localData: updates as any,
              remoteData: err.remoteData || {},
              timestamp: new Date().toISOString(),
              resolved: false
            }))
          }));
          
          ConcurrentDbService.showConflictResolution(
            { ...updates, version: expectedVersion } as any,
            err.remoteData || {},
            () => get().resolveConflict(conflictId, 'merge')
          );
        } else {
          set(() => ({
            leadsState: {
              isLoading: false,
              error: err.message || 'Unknown error occurred',
              lastUpdated: new Date().toISOString()
            }
          }));
          
          toast.error('Failed to update lead', { description: err.message || 'Unknown error occurred' });
        }
      } finally {
        set(state => {
          const newLocks = new Set(state.operationLocks);
          newLocks.delete(lockKey);
          return { operationLocks: newLocks };
        });
      }
    },
    
    updateDealSafely: async (id: string, updates: DealUpdate, expectedVersion: number) => {
      // Similar implementation for deals
      const lockKey = `deals-${id}`;
      
      if (get().operationLocks.has(lockKey)) {
        toast.error('Operation in progress');
        return;
      }
      
      set(state => ({
        operationLocks: new Set([...state.operationLocks, lockKey]),
        dealsState: { ...state.dealsState, isLoading: true, error: null }
      }));
      
      try {
        ConcurrencyMetrics.recordOperation();
        
        const updated = await ConcurrentDbService.updateWithOptimisticLocking(
          'deals',
          id,
          updates,
          expectedVersion
        );
        
        set(state => ({
          deals: state.deals.map(d => d.id === id ? updated : d) as any,
          dealsState: {
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString()
          }
        }));
        
        toast.success('Deal updated successfully');
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string; remoteData?: Record<string, unknown> };
        if (err.code === 'CONFLICT') {
          ConcurrencyMetrics.recordConflict();
          
          const conflictId = `deals-${id}-${Date.now()}`;
          set(state => ({
            conflictResolutions: new Map(state.conflictResolutions.set(conflictId, {
              id: conflictId,
              localData: updates as any,
              remoteData: err.remoteData || {},
              timestamp: new Date().toISOString(),
              resolved: false
            }))
          }));
          
          ConcurrentDbService.showConflictResolution(
            { ...updates, version: expectedVersion } as any,
            err.remoteData || {},
            () => get().resolveConflict(conflictId, 'merge')
          );
        } else {
          set(() => ({
            dealsState: {
              isLoading: false,
              error: err.message || 'Unknown error occurred',
              lastUpdated: new Date().toISOString()
            }
          }));
          
          toast.error('Failed to update deal', { description: err.message || 'Unknown error occurred' });
        }
      } finally {
        set(state => {
          const newLocks = new Set(state.operationLocks);
          newLocks.delete(lockKey);
          return { operationLocks: newLocks };
        });
      }
    },
    
    updateProposalSafely: async (id: string, updates: ProposalUpdate, expectedVersion: number) => {
      // Implementation for proposals
      const lockKey = `proposals-${id}`;
      
      if (get().operationLocks.has(lockKey)) {
        toast.error('Operation in progress');
        return;
      }
      
      set(state => ({
        operationLocks: new Set([...state.operationLocks, lockKey]),
        proposalsState: { ...state.proposalsState, isLoading: true, error: null }
      }));
      
      try {
        ConcurrencyMetrics.recordOperation();
        
        const updated = await ConcurrentDbService.updateWithOptimisticLocking(
          'proposals',
          id,
          updates,
          expectedVersion
        );
        
        set(state => ({
          proposals: state.proposals.map(p => p.id === id ? updated : p) as any,
          proposalsState: {
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString()
          }
        }));
        
        toast.success('Proposal updated successfully');
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string; remoteData?: Record<string, unknown> };
        if (err.code === 'CONFLICT') {
          ConcurrencyMetrics.recordConflict();
          
          const conflictId = `proposals-${id}-${Date.now()}`;
          set(state => ({
            conflictResolutions: new Map(state.conflictResolutions.set(conflictId, {
              id: conflictId,
              localData: updates as any,
              remoteData: err.remoteData || {},
              timestamp: new Date().toISOString(),
              resolved: false
            }))
          }));
          
          ConcurrentDbService.showConflictResolution(
            { ...updates, version: expectedVersion } as any,
            err.remoteData || {},
            () => get().resolveConflict(conflictId, 'merge')
          );
        } else {
          set(() => ({
            proposalsState: {
              isLoading: false,
              error: err.message || 'Unknown error occurred',
              lastUpdated: new Date().toISOString()
            }
          }));
          
          toast.error('Failed to update proposal', { description: err.message || 'Unknown error occurred' });
        }
      } finally {
        set(state => {
          const newLocks = new Set(state.operationLocks);
          newLocks.delete(lockKey);
          return { operationLocks: newLocks };
        });
      }
    },
    
    updateInvoiceSafely: async (id: string, updates: InvoiceUpdate, expectedVersion: number) => {
      // Implementation for invoices
      const lockKey = `invoices-${id}`;
      
      if (get().operationLocks.has(lockKey)) {
        toast.error('Operation in progress');
        return;
      }
      
      set(state => ({
        operationLocks: new Set([...state.operationLocks, lockKey]),
        invoicesState: { ...state.invoicesState, isLoading: true, error: null }
      }));
      
      try {
        ConcurrencyMetrics.recordOperation();
        
        const updated = await ConcurrentDbService.updateWithOptimisticLocking(
          'invoices',
          id,
          updates,
          expectedVersion
        );
        
        set(state => ({
          invoices: state.invoices.map(i => i.id === id ? updated : i) as any,
          invoicesState: {
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString()
          }
        }));
        
        toast.success('Invoice updated successfully');
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string; remoteData?: Record<string, unknown> };
        if (err.code === 'CONFLICT') {
          ConcurrencyMetrics.recordConflict();
          
          const conflictId = `invoices-${id}-${Date.now()}`;
          set(state => ({
            conflictResolutions: new Map(state.conflictResolutions.set(conflictId, {
              id: conflictId,
              localData: updates as any,
              remoteData: err.remoteData || {},
              timestamp: new Date().toISOString(),
              resolved: false
            }))
          }));
          
          ConcurrentDbService.showConflictResolution(
            { ...updates, version: expectedVersion } as any,
            err.remoteData || {},
            () => get().resolveConflict(conflictId, 'merge')
          );
        } else {
          set((state) => ({
            ...state,
            invoicesState: {
              isLoading: false,
              error: err.message || 'Unknown error occurred',
              lastUpdated: new Date().toISOString()
            }
          }));
          
          toast.error('Failed to update invoice', { description: err.message || 'Unknown error occurred' });
        }
      } finally {
        set(state => {
          const newLocks = new Set(state.operationLocks);
          newLocks.delete(lockKey);
          return { operationLocks: newLocks };
        });
      }
    },
    
    // Safe create operations
    createCustomerSafely: async (data: CustomerCreate) => {
      try {
        ConcurrencyMetrics.recordOperation();
        
        const created = await ConcurrentDbService.createSafely(
          'customers',
          data,
          ['email'] // Unique field
        );
        
        set(state => ({
          customers: [...state.customers, created as any]
        }));
        
        toast.success('Customer created successfully');
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error('Failed to create customer', {
          description: err.message || 'Unknown error occurred'
        });
      }
    },
    
    createLeadSafely: async (data: LeadCreate) => {
      try {
        ConcurrencyMetrics.recordOperation();
        
        const created = await ConcurrentDbService.createSafely(
          'leads',
          data,
          ['email']
        );
        
        set(state => ({
          leads: [...state.leads, created as any]
        }));
        
        toast.success('Lead created successfully');
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error('Failed to create lead', {
          description: err.message || 'Unknown error occurred'
        });
      }
    },
    
    createDealSafely: async (data: DealCreate) => {
      try {
        ConcurrencyMetrics.recordOperation();
        
        const created = await ConcurrentDbService.createSafely('deals', data);
        
        set(state => ({
          deals: [...state.deals, created as any]
        }));
        
        toast.success('Deal created successfully');
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error('Failed to create deal', {
          description: err.message || 'Unknown error occurred'
        });
      }
    },
    
    createProposalSafely: async (data: ProposalCreate) => {
      try {
        ConcurrencyMetrics.recordOperation();
        
        const created = await ConcurrentDbService.createSafely('proposals', data);
        
        set(state => ({
          proposals: [...state.proposals, created as any]
        }));
        
        toast.success('Proposal created successfully');
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error('Failed to create proposal', {
          description: err.message || 'Unknown error occurred'
        });
      }
    },
    
    createInvoiceSafely: async (data: InvoiceCreate) => {
      try {
        ConcurrencyMetrics.recordOperation();
        
        const created = await ConcurrentDbService.createSafely('invoices', data);
        
        set(state => ({
          invoices: [...state.invoices, created as any]
        }));
        
        toast.success('Invoice created successfully');
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error('Failed to create invoice', {
          description: err.message || 'Unknown error occurred'
        });
      }
    },
    
    // Calendar methods removed
    
    // Conflict resolution
    resolveConflict: async (conflictId: string, strategy: 'local' | 'remote' | 'merge') => {
      const conflict = get().conflictResolutions.get(conflictId);
      if (!conflict) return;
      
      try {
        const resolved = ConcurrentDbService.resolveConflict(
          conflict.localData,
          conflict.remoteData,
          strategy
        );
        
        // Update the store with resolved data
        const [table, id] = conflictId.split('-');
        
        set(state => {
          const newConflicts = new Map(state.conflictResolutions);
          newConflicts.delete(conflictId);
          
          // Update the appropriate entity array
          const entityKey = table as keyof Pick<ConcurrentStoreState, 'customers' | 'leads' | 'deals' | 'proposals' | 'invoices'>;
          const entities = state[entityKey] as Record<string, unknown>[];
          
          return {
            conflictResolutions: newConflicts,
            [entityKey]: entities.map(entity => (entity as any).id === id ? resolved : entity)
          };
        });
        
        toast.success('Conflict resolved successfully');
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error('Failed to resolve conflict', {
          description: err.message || 'Unknown error occurred'
        });
      }
    },
    
    getPendingConflicts: () => {
      return Array.from(get().conflictResolutions.values()).filter(c => !c.resolved);
    },
    
    // Realtime synchronization
    setupRealtimeSync: () => {
      const tables = ['customers', 'leads', 'deals', 'proposals', 'invoices'];
      const subscriptions: RealtimeSubscription[] = [];
      
      tables.forEach(table => {
        const subscription = supabase
          .channel(`${table}-changes`)
          .on('postgres_changes', 
            { event: '*', schema: 'public', table },
            (payload) => get().handleRealtimeUpdate(table, payload)
          )
          .subscribe();
        
        subscriptions.push(subscription);
      });
      
      set(state => ({
        realtimeSubscriptions: new Map([
          ...state.realtimeSubscriptions,
          ...tables.map((table, index) => [table, subscriptions[index]] as [string, RealtimeSubscription])
        ])
      }));
      
      return () => {
        subscriptions.forEach(sub => sub.unsubscribe());
        set(() => ({
        realtimeSubscriptions: new Map()
      }));
      };
    },
    
    handleRealtimeUpdate: (table: string, payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      set(state => {
        const entityKey = table as keyof Pick<ConcurrentStoreState, 'customers' | 'leads' | 'deals' | 'proposals' | 'invoices'>;
        const entities = state[entityKey] as Record<string, unknown>[];
        
        switch (eventType) {
          case 'INSERT':
            return {
              [entityKey]: [...entities, newRecord]
            };
          case 'UPDATE':
            return {
              [entityKey]: entities.map(entity => 
                (entity as any).id === (newRecord as any).id ? newRecord : entity
              )
            };
          case 'DELETE':
            return {
              [entityKey]: entities.filter(entity => (entity as any).id !== (oldRecord as any).id)
            };
          default:
            return state;
        }
      });
    },
    
    // Utility methods
    isOperationLocked: (key: string) => {
      return get().operationLocks.has(key);
    },
    
    getEntityVersion: (table: string, id: string): any => {
      const entityKey = table as keyof Pick<ConcurrentStoreState, 'customers' | 'leads' | 'deals' | 'proposals' | 'invoices'>;
      const entities = get()[entityKey] as Record<string, unknown>[];
      const entity = entities.find(e => (e as any).id === id);
      return (entity as any)?.version || null;
    },
    
    refreshEntity: async (table: string, id: string) => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        set(state => {
          const entityKey = table as keyof Pick<ConcurrentStoreState, 'customers' | 'leads' | 'deals' | 'proposals' | 'invoices'>;
          const entities = state[entityKey] as Record<string, unknown>[];
          
          return {
            [entityKey]: entities.map(entity => 
              (entity as any).id === id ? data : entity
            )
          };
        });
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error('Failed to refresh entity', {
          description: err.message || 'Unknown error occurred'
        });
      }
    }
  })));

// Export hooks for specific entities
export const useCustomers = () => useConcurrentStore(state => ({
  customers: state.customers,
  state: state.customersState,
  updateSafely: state.updateCustomerSafely,
  createSafely: state.createCustomerSafely
}));

export const useLeads = () => useConcurrentStore(state => ({
  leads: state.leads,
  state: state.leadsState,
  updateSafely: state.updateLeadSafely,
  createSafely: state.createLeadSafely
}));

export const useDeals = () => useConcurrentStore(state => ({
  deals: state.deals,
  state: state.dealsState,
  updateSafely: state.updateDealSafely,
  createSafely: state.createDealSafely
}));

export const useProposals = () => useConcurrentStore(state => ({
  proposals: state.proposals,
  state: state.proposalsState,
  updateSafely: state.updateProposalSafely,
  createSafely: state.createProposalSafely
}));

export const useInvoices = () => useConcurrentStore(state => ({
  invoices: state.invoices,
  state: state.invoicesState,
  updateSafely: state.updateInvoiceSafely,
  createSafely: state.createInvoiceSafely
}));

// Calendar functionality removed

// Export conflict management
export const useConflictResolution = () => useConcurrentStore(state => ({
  conflicts: state.getPendingConflicts(),
  resolveConflict: state.resolveConflict
}));

// Export realtime sync
export const useRealtimeSync = () => useConcurrentStore(state => ({
  setupSync: state.setupRealtimeSync,
  isLocked: state.isOperationLocked
}));