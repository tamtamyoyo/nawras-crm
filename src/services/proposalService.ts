import { supabase } from '../lib/supabase-client'
import { offlineDataService } from './offlineDataService'
import { isOfflineMode } from '../utils/offlineMode'
import { handleSupabaseError } from '../utils/errorHandling'
import performanceMonitoringService from './performanceMonitoringService'
import type { Database } from '../lib/database.types'

type Proposal = Database['public']['Tables']['proposals']['Row']

export interface ProposalData {
  id?: string
  title: string
  description: string
  amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  customer_id: string
  created_at?: string
  updated_at?: string
  items?: ProposalItem[]
  terms?: string
  valid_until?: string
  metadata?: Record<string, unknown>
}

class ProposalService {
  async getProposals(): Promise<{ proposals: Proposal[], isOffline: boolean }> {
    const startTime = Date.now()
    
    try {
      if (isOfflineMode()) {
        console.log('📱 Loading proposals from offline storage')
        const proposals = await offlineDataService.getProposals()
        
        performanceMonitoringService.recordMetric('proposal_load_offline', Date.now() - startTime)
        return { proposals, isOffline: true }
      }

      console.log('🔧 Loading proposals from Supabase...')
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      performanceMonitoringService.recordMetric('proposal_load_online', Date.now() - startTime)
      return { proposals: data || [], isOffline: false }
    } catch (error) {
      console.error('Error loading proposals:', error)
      
      const shouldFallback = handleSupabaseError(error, 'proposal loading')
      
      if (shouldFallback) {
        console.log('🔄 Falling back to offline mode for proposals')
        const proposals = await offlineDataService.getProposals()
        
        performanceMonitoringService.recordMetric('proposal_load_fallback', Date.now() - startTime)
        return { proposals, isOffline: true }
      }
      
      throw error
    }
  }

  async createProposal(proposalData: ProposalData): Promise<Proposal> {
    const startTime = Date.now()
    
    try {
      if (isOfflineMode()) {
        console.log('📱 Creating proposal in offline mode')
        const proposal = await offlineDataService.createProposal(proposalData)
        
        performanceMonitoringService.recordMetric('proposal_create_offline', Date.now() - startTime)
        return proposal
      }

      console.log('🔧 Creating proposal in Supabase...')
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          ...proposalData,
          content: typeof proposalData.content === 'string' 
            ? proposalData.content 
            : JSON.stringify(proposalData.content),
          variables: typeof proposalData.variables === 'string'
            ? proposalData.variables
            : JSON.stringify(proposalData.variables || {}),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      performanceMonitoringService.recordMetric('proposal_create_online', Date.now() - startTime)
      return data
    } catch (error) {
      console.error('Error creating proposal:', error)
      
      const shouldFallback = handleSupabaseError(error, 'proposal creation')
      
      if (shouldFallback) {
        console.log('🔄 Falling back to offline mode for proposal creation')
        const proposal = await offlineDataService.createProposal(proposalData)
        
        performanceMonitoringService.recordMetric('proposal_create_fallback', Date.now() - startTime)
        return proposal
      }
      
      throw error
    }
  }

  async updateProposal(id: string, updates: Partial<ProposalData>): Promise<Proposal> {
    const startTime = Date.now()
    
    try {
      if (isOfflineMode()) {
        console.log('📱 Updating proposal in offline mode')
        const proposal = await offlineDataService.updateProposal(id, {
          ...updates,
          updated_at: new Date().toISOString()
        })
        
        performanceMonitoringService.recordMetric('proposal_update_offline', Date.now() - startTime)
        return proposal
      }

      console.log('🔧 Updating proposal in Supabase...')
      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Handle content and variables serialization
      if (updates.content) {
        updateData.content = typeof updates.content === 'string' 
          ? updates.content 
          : JSON.stringify(updates.content)
      }
      
      if (updates.variables) {
        updateData.variables = typeof updates.variables === 'string'
          ? updates.variables
          : JSON.stringify(updates.variables)
      }

      const { data, error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      performanceMonitoringService.recordMetric('proposal_update_online', Date.now() - startTime)
      return data
    } catch (error) {
      console.error('Error updating proposal:', error)
      
      const shouldFallback = handleSupabaseError(error, 'proposal update')
      
      if (shouldFallback) {
        console.log('🔄 Falling back to offline mode for proposal update')
        const proposal = await offlineDataService.updateProposal(id, {
          ...updates,
          updated_at: new Date().toISOString()
        })
        
        performanceMonitoringService.recordMetric('proposal_update_fallback', Date.now() - startTime)
        return proposal
      }
      
      throw error
    }
  }

  async deleteProposal(id: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (isOfflineMode()) {
        console.log('📱 Deleting proposal in offline mode')
        await offlineDataService.deleteProposal(id)
        
        performanceMonitoringService.recordMetric('proposal_delete_offline', Date.now() - startTime)
        return
      }

      console.log('🔧 Deleting proposal from Supabase...')
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id)

      if (error) throw error

      performanceMonitoringService.recordMetric('proposal_delete_online', Date.now() - startTime)
    } catch (error) {
      console.error('Error deleting proposal:', error)
      
      const shouldFallback = handleSupabaseError(error, 'proposal deletion')
      
      if (shouldFallback) {
        console.log('🔄 Falling back to offline mode for proposal deletion')
        await offlineDataService.deleteProposal(id)
        
        performanceMonitoringService.recordMetric('proposal_delete_fallback', Date.now() - startTime)
        return
      }
      
      throw error
    }
  }

  async sendProposal(id: string): Promise<Proposal> {
    return this.updateProposal(id, {
      status: 'sent',
      // Add sent_at timestamp if needed
    })
  }

  async acceptProposal(id: string): Promise<Proposal> {
    return this.updateProposal(id, {
      status: 'accepted'
    })
  }

  async rejectProposal(id: string): Promise<Proposal> {
    return this.updateProposal(id, {
      status: 'rejected'
    })
  }
}

export const proposalService = new ProposalService()