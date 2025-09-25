import { supabase } from '../lib/supabase-client'
import { offlineDataService } from './offlineDataService'
import { isOfflineMode } from '../utils/offlineMode'
import { handleSupabaseError } from '../utils/errorHandling'
import { protectFromExtensionInterference } from '../utils/extensionProtection'
import errorHandlingService from './errorHandlingService'
import performanceMonitoringService from './performanceMonitoringService'
import type { Database } from '../lib/database.types'

type Deal = Database['public']['Tables']['deals']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Customer = Database['public']['Tables']['customers']['Row']
type Proposal = Database['public']['Tables']['proposals']['Row']

interface DashboardData {
  customers: Customer[]
  deals: Deal[]
  leads: Lead[]
  proposals: Proposal[]
}

interface ChartData {
  monthlyRevenue: Array<{ month: string; revenue: number }>
  dealsByStage: Array<{ stage: string; count: number }>
  leadsBySource: Array<{ source: string; count: number; value: number }>
}

interface DashboardStats {
  totalRevenue: number
  activeDeals: Deal[]
  conversionRate: number
  totalProposals: number
  acceptedProposals: number
  pendingProposals: number
  totalProposalValue: number
}

class DashboardService {
  async loadDashboardData(): Promise<DashboardData> {
    const startTime = performance.now()
    
    try {
      protectFromExtensionInterference()
      
      const offlineMode = isOfflineMode()
      console.log('🔧 [Dashboard] Loading data - offlineMode:', offlineMode)
      
      if (offlineMode) {
        console.log('📱 Loading dashboard data from offline service')
        
        const [customersData, dealsData, leadsData, proposalsData] = await Promise.all([
          offlineDataService.getCustomers(),
          offlineDataService.getDeals(),
          offlineDataService.getLeads(),
          offlineDataService.getProposals()
        ])

        const result = {
          customers: customersData as Customer[],
          deals: dealsData as Deal[],
          leads: leadsData as Lead[],
          proposals: proposalsData as Proposal[]
        }
        
        performanceMonitoringService.recordMetric('dashboard_data_load_offline', performance.now() - startTime)
        return result
      } else {
        console.log('🔧 [Dashboard] Loading data from Supabase...')
        
        const [customersRes, dealsRes, leadsRes, proposalsRes] = await Promise.all([
          supabase.from('customers').select('*'),
          supabase.from('deals').select('*'),
          supabase.from('leads').select('*'),
          supabase.from('proposals').select('*')
        ])

        if (customersRes.error) throw customersRes.error
        if (dealsRes.error) throw dealsRes.error
        if (leadsRes.error) throw leadsRes.error
        if (proposalsRes.error) throw proposalsRes.error

        const result = {
          customers: customersRes.data as Customer[] || [],
          deals: dealsRes.data as Deal[] || [],
          leads: leadsRes.data as Lead[] || [],
          proposals: proposalsRes.data as Proposal[] || []
        }
        
        performanceMonitoringService.recordMetric('dashboard_data_load_online', performance.now() - startTime)
        return result
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      
      const shouldFallback = handleSupabaseError(error, 'dashboard data loading')
      
      if (shouldFallback) {
        try {
          console.log('🔄 Falling back to offline mode due to error')
          const [customersData, dealsData, leadsData, proposalsData] = await Promise.all([
            offlineDataService.getCustomers(),
            offlineDataService.getDeals(),
            offlineDataService.getLeads(),
            offlineDataService.getProposals()
          ])

          return {
            customers: customersData as Customer[],
            deals: dealsData as Deal[],
            leads: leadsData as Lead[],
            proposals: proposalsData as Proposal[]
          }
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError)
          errorHandlingService.handleError(offlineError, 'Failed to load dashboard data from offline storage')
          throw offlineError
        }
      } else {
        errorHandlingService.handleError(error, 'Failed to load dashboard data')
        throw error
      }
    }
  }

  generateChartData(dealsData: Deal[], leadsData: Lead[]): ChartData {
    // Monthly revenue from closed deals
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const revenue = dealsData
        .filter(deal => deal.stage === 'closed_won' && 
          deal.updated_at && new Date(deal.updated_at).getMonth() === date.getMonth())
        .reduce((sum, deal) => sum + (deal.value || 0), 0)
      return { month: monthName, revenue }
    }).reverse()

    // Deals by stage
    const stageGroups = dealsData.reduce((acc: Record<string, number>, deal) => {
      const stage = deal.stage || 'unknown'
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {})
    const dealsByStage = Object.entries(stageGroups).map(([stage, count]) => ({
      stage: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: count as number
    }))

    // Leads by source
    const sourceGroups = leadsData.reduce((acc: Record<string, number>, lead) => {
      const source = lead.source || 'Unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})
    const leadsBySource = Object.entries(sourceGroups).map(([source, count]) => ({
      source,
      count: count as number,
      value: count as number
    }))

    return { monthlyRevenue, dealsByStage, leadsBySource }
  }

  calculateDashboardStats(deals: Deal[], leads: Lead[], proposals: Proposal[]): DashboardStats {
    // Ensure all parameters are arrays
    const safeDeals = Array.isArray(deals) ? deals : []
    const safeLeads = Array.isArray(leads) ? leads : []
    const safeProposals = Array.isArray(proposals) ? proposals : []
    
    const totalRevenue = safeDeals.filter(deal => deal.stage === 'closed_won').reduce((sum, deal) => sum + (deal.value || 0), 0)
    const activeDeals = safeDeals.filter(deal => deal.stage && !['closed_won', 'closed_lost'].includes(deal.stage))
    const conversionRate = safeLeads.length > 0 ? Math.round((safeDeals.length / safeLeads.length) * 100) : 0
    
    const totalProposals = safeProposals.length
    const acceptedProposals = safeProposals.filter(proposal => proposal.status === 'accepted').length
    const pendingProposals = safeProposals.filter(proposal => proposal.status === 'draft').length
    
    const totalProposalValue = safeProposals.reduce((sum, proposal) => {
      try {
        const content = typeof proposal.content === 'string' ? JSON.parse(proposal.content) : proposal.content
        if (Array.isArray(content)) {
          return sum + content.reduce((itemSum, item) => {
            return itemSum + (item.quantity || 0) * (item.price || 0)
          }, 0)
        }
        return sum
      } catch (error) {
        console.warn('Error parsing proposal content:', error)
        return sum
      }
    }, 0)

    return {
      totalRevenue,
      activeDeals,
      conversionRate,
      totalProposals,
      acceptedProposals,
      pendingProposals,
      totalProposalValue
    }
  }
}

export const dashboardService = new DashboardService()