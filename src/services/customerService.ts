import { supabase } from '../lib/supabase-client'
import { offlineDataService } from './offlineDataService'
import errorHandlingService from './errorHandlingService'
import performanceMonitoringService from './performanceMonitoringService'
import { isOfflineMode } from '../utils/offlineMode'
import type { Database } from '../lib/database.types'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

export interface CustomerFilters {
  search?: string
  status?: string
}

export class CustomerService {
  private static instance: CustomerService
  
  static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService()
    }
    return CustomerService.instance
  }

  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    const operationId = 'get-customers'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        const customers = await offlineDataService.getCustomers()
        return this.applyFilters(customers, filters)
      }

      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'CustomerService.getCustomers')

      if (shouldFallback) {
        const customers = await offlineDataService.getCustomers()
        return this.applyFilters(customers, filters)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async createCustomer(customerData: CustomerInsert): Promise<Customer> {
    const operationId = 'create-customer'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        return offlineDataService.createCustomer(customerData)
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'CustomerService.createCustomer')

      if (shouldFallback) {
        return offlineDataService.createCustomer(customerData)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async updateCustomer(id: string, customerData: Partial<CustomerInsert>): Promise<Customer> {
    const operationId = 'update-customer'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        return offlineDataService.updateCustomer(id, customerData)
      }

      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'CustomerService.updateCustomer')

      if (shouldFallback) {
        return offlineDataService.updateCustomer(id, customerData)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    const operationId = 'delete-customer'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        offlineDataService.deleteCustomer(id)
        return
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'CustomerService.deleteCustomer')

      if (shouldFallback) {
        offlineDataService.deleteCustomer(id)
        return
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  private applyFilters(customers: Customer[], filters?: CustomerFilters): Customer[] {
    if (!filters) return customers

    let filtered = customers

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      filtered = filtered.filter(customer => customer.status === filters.status)
    }

    return filtered
  }
}

export const customerService = CustomerService.getInstance()