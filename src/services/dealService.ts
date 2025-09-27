import { supabase } from '../lib/supabase-client'
import { offlineDataService } from './offlineDataService'
import errorHandlingService from './errorHandlingService'
import performanceMonitoringService from './performanceMonitoringService'
import { isOfflineMode } from '../utils/offlineMode'
import type { Database } from '../lib/database.types'

type Deal = Database['public']['Tables']['deals']['Row']
type DealInsert = Database['public']['Tables']['deals']['Insert']

export interface DealFilters {
  search?: string
  stage?: string
  customerId?: string
}

export class DealService {
  private static instance: DealService
  
  static getInstance(): DealService {
    if (!DealService.instance) {
      DealService.instance = new DealService()
    }
    return DealService.instance
  }

  async getDeals(filters?: DealFilters): Promise<Deal[]> {
    const operationId = 'get-deals'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        const deals = await offlineDataService.getDeals()
        return this.applyFilters(deals, filters)
      }

      let query = supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters?.stage) {
        query = query.eq('stage', filters.stage)
      }

      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'DealService.getDeals')

      if (shouldFallback) {
        const deals = await offlineDataService.getDeals()
        return this.applyFilters(deals, filters)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async createDeal(dealData: DealInsert): Promise<Deal> {
    const operationId = 'create-deal'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        return offlineDataService.createDeal(dealData)
      }

      const { data, error } = await supabase
        .from('deals')
        .insert([dealData])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'DealService.createDeal')

      if (shouldFallback) {
        return offlineDataService.createDeal(dealData)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async updateDeal(id: string, dealData: Partial<DealInsert>): Promise<Deal> {
    const operationId = 'update-deal'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        return offlineDataService.updateDeal(id, dealData)
      }

      const { data, error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'DealService.updateDeal')

      if (shouldFallback) {
        return offlineDataService.updateDeal(id, dealData)
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async deleteDeal(id: string): Promise<void> {
    const operationId = 'delete-deal'
    performanceMonitoringService.startOperation(operationId)

    try {
      const isOfflineModeActive = isOfflineMode()
      
      if (isOfflineModeActive) {
        offlineDataService.deleteDeal(id)
        return
      }

      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (error) {
      const shouldFallback = errorHandlingService.handleSupabaseError(error, 'DealService.deleteDeal')

      if (shouldFallback) {
        offlineDataService.deleteDeal(id)
        return
      }

      throw error
    } finally {
      performanceMonitoringService.endOperation(operationId)
    }
  }

  async updateDealStage(id: string, stage: string): Promise<Deal> {
    return this.updateDeal(id, { stage })
  }

  private applyFilters(deals: Deal[], filters?: DealFilters): Deal[] {
    if (!filters) return deals

    let filtered = deals

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(deal =>
        deal.title?.toLowerCase().includes(searchLower) ||
        deal.description?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.stage) {
      filtered = filtered.filter(deal => deal.stage === filters.stage)
    }

    if (filters.customerId) {
      filtered = filtered.filter(deal => deal.customer_id === filters.customerId)
    }

    return filtered
  }
}

export const dealService = DealService.getInstance()