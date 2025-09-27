import { supabase } from '../lib/supabase-client'
import { offlineDataService } from './offlineDataService'
import { isOfflineMode } from '../utils/offlineMode'
import errorHandlingService from './errorHandlingService'
import performanceMonitoringService from './performanceMonitoringService'
import type { Database } from '../lib/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type LeadInsert = Database['public']['Tables']['leads']['Insert']
type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

export interface LeadFilters {
  search?: string
  status?: string
  source?: string
}

export class LeadService {
  private static instance: LeadService
  
  static getInstance(): LeadService {
    if (!LeadService.instance) {
      LeadService.instance = new LeadService()
    }
    return LeadService.instance
  }

  async getLeads(filters?: LeadFilters): Promise<Lead[]> {
    const operationId = 'get-leads'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        const leads = await offlineDataService.getLeads()
        return this.applyFilters(leads, filters)
      }

      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.source) {
        query = query.eq('source', filters.source)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'LeadService.getLeads')

      if (shouldFallback) {
        const leads = await offlineDataService.getLeads()
        return this.applyFilters(leads, filters)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async createLead(leadData: LeadInsert): Promise<Lead> {
    const operationId = 'create-lead'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        return await offlineDataService.createLead(leadData)
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'LeadService.createLead')

      if (shouldFallback) {
        return await offlineDataService.createLead(leadData)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async updateLead(id: string, leadData: Partial<LeadInsert>): Promise<Lead> {
    const operationId = 'update-lead'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        return await offlineDataService.updateLead(id, leadData)
      }

      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'LeadService.updateLead')

      if (shouldFallback) {
        return await offlineDataService.updateLead(id, leadData)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async deleteLead(id: string): Promise<void> {
    const operationId = 'delete-lead'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        await offlineDataService.deleteLead(id)
        return
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'LeadService.deleteLead')

      if (shouldFallback) {
        await offlineDataService.deleteLead(id)
        return
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async convertLeadToCustomer(leadId: string, customerData: CustomerInsert): Promise<{ customer: Customer; success: boolean }> {
    const operationId = 'convert-lead'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        // Handle offline conversion
        const customer = await offlineDataService.createCustomer(customerData)
        await offlineDataService.deleteLead(leadId)
        return { customer, success: true }
      }

      // Start transaction
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single()

      if (customerError) {
        throw customerError
      }

      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (deleteError) {
        // Rollback customer creation if lead deletion fails
        await supabase.from('customers').delete().eq('id', customer.id)
        throw deleteError
      }

      return { customer, success: true }
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'LeadService.convertLeadToCustomer')

      if (shouldFallback) {
        const customer = await offlineDataService.createCustomer(customerData)
        await offlineDataService.deleteLead(leadId)
        return { customer, success: true }
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  private applyFilters(leads: Lead[], filters?: LeadFilters): Lead[] {
    if (!filters) return leads

    let filtered = leads

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status)
    }

    if (filters.source) {
      filtered = filtered.filter(lead => lead.source === filters.source)
    }

    return filtered
  }
}

export const leadService = LeadService.getInstance()