import { supabase } from '../lib/supabase-client'
import { offlineDataService } from './offlineDataService'
import { isOfflineMode } from '../utils/offlineMode'
import { handleSupabaseError } from '../utils/errorHandling'
import performanceMonitoringService from './performanceMonitoringService'
import type { Database } from '../lib/database.types'

type Proposal = Database['public']['Tables']['proposals']['Row']

export interface ProposalItem {
  id?: string
  description: string
  quantity?: number
  rate?: number
  total: number
}

export interface ProposalData {
  id?: string
  title: string
  deal_id?: string | null
  customer_id?: string | null
  content: string
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | null
  valid_until?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  notes?: string | null
  total_amount?: number | null
  source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
  responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
  proposal_type?: 'standard' | 'custom' | 'template' | 'rfp_response' | 'quote' | null
  validity_period?: number | null
  approval_workflow?: 'single_approval' | 'multi_level_approval' | 'committee_approval' | 'auto_approval' | null
  template_used?: string | null
  delivery_method?: 'email' | 'portal' | 'physical_mail' | 'in_person' | 'fax' | null
  estimated_value?: number | null
  version?: number | null
  // Legacy fields for backward compatibility
  description?: string
  amount?: number
  items?: ProposalItem[]
  terms?: string
  metadata?: Record<string, unknown>
  variables?: Record<string, unknown> | string
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
        // Map ProposalData to Proposal format for offline service
        const proposalForOffline: Omit<Proposal, 'id' | 'created_at' | 'updated_at'> = {
          title: proposalData.title || '',
          deal_id: proposalData.deal_id || '',
          customer_id: proposalData.customer_id || '',
          content: proposalData.content || '',
          status: proposalData.status || 'draft',
          valid_until: proposalData.valid_until || '',
          created_by: proposalData.created_by || '',
          notes: proposalData.notes || null,
          total_amount: proposalData.total_amount || null,
          source: proposalData.source || null,
          responsible_person: proposalData.responsible_person || null,
          proposal_type: proposalData.proposal_type || null,
          validity_period: proposalData.validity_period || null,
          approval_workflow: proposalData.approval_workflow || null,
          template_used: proposalData.template_used || null,
          delivery_method: proposalData.delivery_method || null,
          estimated_value: proposalData.estimated_value || null,
          version: proposalData.version || 1
        }
        const proposal = await offlineDataService.createProposal(proposalForOffline)
        
        performanceMonitoringService.recordMetric('proposal_create_offline', Date.now() - startTime)
        return proposal
      }

      console.log('🔧 Creating proposal in Supabase...')
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          title: proposalData.title,
          deal_id: proposalData.deal_id,
          customer_id: proposalData.customer_id,
          content: typeof proposalData.content === 'string' 
            ? proposalData.content 
            : JSON.stringify(proposalData.content),
          status: proposalData.status || 'draft',
          valid_until: proposalData.valid_until,
          created_by: proposalData.created_by,
          notes: proposalData.notes,
          total_amount: proposalData.total_amount || proposalData.amount,
          source: proposalData.source,
          responsible_person: proposalData.responsible_person,
          proposal_type: proposalData.proposal_type,
          validity_period: proposalData.validity_period,
          approval_workflow: proposalData.approval_workflow,
          template_used: proposalData.template_used,
          delivery_method: proposalData.delivery_method,
          estimated_value: proposalData.estimated_value,
          version: proposalData.version,
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
        // Map ProposalData to Proposal format for offline service
        const proposalForOffline: Omit<Proposal, 'id' | 'created_at' | 'updated_at'> = {
          title: proposalData.title || '',
          deal_id: proposalData.deal_id || '',
          customer_id: proposalData.customer_id || '',
          content: proposalData.content || '',
          status: proposalData.status || 'draft',
          valid_until: proposalData.valid_until || '',
          created_by: proposalData.created_by || '',
          notes: proposalData.notes || null,
          total_amount: proposalData.total_amount || proposalData.amount || null,
          source: proposalData.source || null,
          responsible_person: proposalData.responsible_person || null,
          proposal_type: proposalData.proposal_type || null,
          validity_period: proposalData.validity_period || null,
          approval_workflow: proposalData.approval_workflow || null,
          template_used: proposalData.template_used || null,
          delivery_method: proposalData.delivery_method || null,
          estimated_value: proposalData.estimated_value || null,
          version: proposalData.version || 1
        }
        const proposal = await offlineDataService.createProposal(proposalForOffline)
        
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
        // Map legacy amount field to total_amount if present
        const mappedUpdates = { ...updates }
        if ('amount' in mappedUpdates && mappedUpdates.amount !== undefined) {
          mappedUpdates.total_amount = mappedUpdates.amount
          delete mappedUpdates.amount
        }
        
        const proposal = await offlineDataService.updateProposal(id, {
          ...mappedUpdates,
          updated_at: new Date().toISOString()
        } as Partial<Proposal>)
        
        performanceMonitoringService.recordMetric('proposal_update_offline', Date.now() - startTime)
        return proposal
      }

      console.log('🔧 Updating proposal in Supabase...')
      // Build update data with proper typing
      const updateData: Partial<Database['public']['Tables']['proposals']['Update']> = {
        updated_at: new Date().toISOString()
      }

      // Map ProposalData fields to database fields
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.deal_id !== undefined) updateData.deal_id = updates.deal_id
      if (updates.customer_id !== undefined) updateData.customer_id = updates.customer_id
      if (updates.content !== undefined) {
        updateData.content = typeof updates.content === 'string' 
          ? updates.content 
          : JSON.stringify(updates.content)
      }
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.valid_until !== undefined) updateData.valid_until = updates.valid_until
      if (updates.created_by !== undefined) updateData.created_by = updates.created_by
      if (updates.notes !== undefined) updateData.notes = updates.notes
      if (updates.total_amount !== undefined) updateData.total_amount = updates.total_amount
      if (updates.amount !== undefined && updates.total_amount === undefined) updateData.total_amount = updates.amount
      if (updates.source !== undefined) updateData.source = updates.source
      if (updates.responsible_person !== undefined) updateData.responsible_person = updates.responsible_person
      if (updates.proposal_type !== undefined) updateData.proposal_type = updates.proposal_type
      if (updates.validity_period !== undefined) updateData.validity_period = updates.validity_period
      if (updates.approval_workflow !== undefined) updateData.approval_workflow = updates.approval_workflow
      if (updates.template_used !== undefined) updateData.template_used = updates.template_used
      if (updates.delivery_method !== undefined) updateData.delivery_method = updates.delivery_method
      if (updates.estimated_value !== undefined) updateData.estimated_value = updates.estimated_value
      if (updates.version !== undefined) updateData.version = updates.version

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
        // Map legacy amount field to total_amount if present
        const mappedUpdates = { ...updates }
        if ('amount' in mappedUpdates && mappedUpdates.amount !== undefined) {
          mappedUpdates.total_amount = mappedUpdates.amount
          delete mappedUpdates.amount
        }
        
        const proposal = await offlineDataService.updateProposal(id, {
          ...mappedUpdates,
          updated_at: new Date().toISOString()
        } as Partial<Proposal>)
        
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