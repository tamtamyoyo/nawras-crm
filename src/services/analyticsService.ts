import { supabase } from '../lib/supabase-client'
import { offlineDataService } from './offlineDataService'
import { isOfflineMode, handleSupabaseError } from '../utils/offlineMode'
import errorHandlingService from './errorHandlingService'
import performanceMonitoringService from './performanceMonitoringService'
import type { Database } from '../lib/database.types'

type Deal = Database['public']['Tables']['deals']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

interface AnalyticsData {
  totalDeals: number
  totalRevenue: number
  totalClients: number
  totalEvents: number
  dealsByStatus: { name: string; value: number; color: string }[]
  revenueByMonth: { month: string; revenue: number; deals: number }[]
  clientsBySource: { source: string; count: number }[]
  performanceMetrics: { metric: string; current: number; previous: number; change: number }[]
}

interface ChartData {
  revenueOverTime: Array<{ date: string; revenue: number; deals: number }>
  dealsByStage: Array<{ stage: string; count: number; value: number }>
  leadsBySource: Array<{ source: string; count: number; percentage: number }>
  customerGrowth: Array<{ month: string; customers: number; growth: number }>
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>
  performanceMetrics: Array<{ metric: string; value: number; change: number; trend: string }>
}

class AnalyticsService {
  async getAnalyticsData(dateRange: string): Promise<AnalyticsData> {
    const startTime = performance.now()
    
    try {
      const offline = isOfflineMode()
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      let deals: Deal[] = []
      let clients: Customer[] = []

      if (offline) {
        const allDeals = await offlineDataService.getDeals()
        const allCustomers = await offlineDataService.getCustomers()
        
        deals = allDeals.filter(deal => {
          const dealDate = new Date(deal.created_at)
          return dealDate >= startDate && dealDate <= endDate
        })
        
        clients = allCustomers.filter(customer => {
          const customerDate = new Date(customer.created_at)
          return customerDate >= startDate && customerDate <= endDate
        })
      } else {
        try {
          const dealsResponse = await supabase
            .from('deals')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
          
          const customersResponse = await supabase
            .from('customers')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          deals = dealsResponse.data || []
          clients = customersResponse.data || []
        } catch (supabaseError) {
          if (handleSupabaseError(supabaseError)) {
            const allDeals = await offlineDataService.getDeals()
            const allCustomers = await offlineDataService.getCustomers()
            
            deals = allDeals.filter(deal => {
              const dealDate = new Date(deal.created_at)
              return dealDate >= startDate && dealDate <= endDate
            })
            
            clients = allCustomers.filter(customer => {
              const customerDate = new Date(customer.created_at)
              return customerDate >= startDate && customerDate <= endDate
            })
          } else {
            throw supabaseError
          }
        }
      }

      const analyticsData = this.processAnalyticsData(deals, clients)
      
      performanceMonitoringService.recordMetric('analytics_data_load', performance.now() - startTime)
      return analyticsData
    } catch (error) {
      errorHandlingService.handleError(error, 'Failed to load analytics data')
      throw error
    }
  }

  generateChartData(deals: Deal[], leads: Lead[], dateRange: string): ChartData {
    const now = new Date()
    const daysBack = parseInt(dateRange)
    
    // Revenue over time
    const revenueOverTime = Array.from({ length: daysBack }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (daysBack - i - 1))
      const dayDeals = deals.filter(deal => {
        const dealDate = new Date(deal.created_at)
        return dealDate.toDateString() === date.toDateString() && deal.stage === 'closed_won'
      })
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        deals: dayDeals.length
      }
    })
    
    // Deals by stage
    const dealsByStage = [
      { stage: 'Lead', count: leads?.length || 0, value: 0 },
      { stage: 'Prospecting', count: deals.filter(d => d.stage === 'prospecting').length, value: deals.filter(d => d.stage === 'prospecting').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Qualification', count: deals.filter(d => d.stage === 'qualification').length, value: deals.filter(d => d.stage === 'qualification').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Proposal', count: deals.filter(d => d.stage === 'proposal').length, value: deals.filter(d => d.stage === 'proposal').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Negotiation', count: deals.filter(d => d.stage === 'negotiation').length, value: deals.filter(d => d.stage === 'negotiation').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Won', count: deals.filter(d => d.stage === 'closed_won').length, value: deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Lost', count: deals.filter(d => d.stage === 'closed_lost').length, value: 0 }
    ]
    
    // Leads by source (mock data)
    const leadsBySource = [
      { source: 'Website', count: Math.floor(Math.random() * 50) + 20, percentage: 35 },
      { source: 'Referral', count: Math.floor(Math.random() * 30) + 15, percentage: 25 },
      { source: 'Social Media', count: Math.floor(Math.random() * 25) + 10, percentage: 20 },
      { source: 'Email Campaign', count: Math.floor(Math.random() * 20) + 8, percentage: 15 },
      { source: 'Other', count: Math.floor(Math.random() * 10) + 3, percentage: 5 }
    ]
    
    // Customer growth (mock data)
    const customerGrowth = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now)
      date.setMonth(date.getMonth() - (11 - i))
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        customers: Math.floor(Math.random() * 50) + (i * 10) + 20,
        growth: Math.floor(Math.random() * 20) + 5
      }
    })
    
    // Conversion funnel (mock data)
    const conversionFunnel = [
      { stage: 'Visitors', count: 1000, percentage: 100 },
      { stage: 'Leads', count: 250, percentage: 25 },
      { stage: 'Qualified', count: 100, percentage: 10 },
      { stage: 'Proposals', count: 50, percentage: 5 },
      { stage: 'Customers', count: 15, percentage: 1.5 }
    ]
    
    // Performance metrics (mock data)
    const performanceMetrics = [
      { metric: 'Conversion Rate', value: 15.2, change: 2.3, trend: 'up' },
      { metric: 'Avg Deal Size', value: 5420, change: -1.2, trend: 'down' },
      { metric: 'Sales Cycle', value: 28, change: -3.1, trend: 'up' },
      { metric: 'Win Rate', value: 68.5, change: 4.7, trend: 'up' }
    ]
    
    return {
      revenueOverTime,
      dealsByStage,
      leadsBySource,
      customerGrowth,
      conversionFunnel,
      performanceMetrics
    }
  }

  private processAnalyticsData(deals: Deal[], clients: Customer[]): AnalyticsData {
    const totalDeals = deals.length
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    const totalClients = clients.length
    const totalEvents = 0 // Events functionality removed

    const dealsByStatus = [
      { name: 'Won', value: deals.filter(d => d.stage === 'closed_won').length, color: '#10B981' },
      { name: 'In Progress', value: deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length, color: '#F59E0B' },
      { name: 'Lost', value: deals.filter(d => d.stage === 'closed_lost').length, color: '#EF4444' }
    ]

    // Generate revenue by month
    const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const monthDeals = deals.filter(deal => {
        const dealDate = new Date(deal.created_at)
        return dealDate.getMonth() === date.getMonth() && dealDate.getFullYear() === date.getFullYear()
      })
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        deals: monthDeals.length
      }
    })

    // Mock clients by source data
    const clientsBySource = [
      { source: 'Website', count: Math.floor(totalClients * 0.4) },
      { source: 'Referral', count: Math.floor(totalClients * 0.3) },
      { source: 'Social Media', count: Math.floor(totalClients * 0.2) },
      { source: 'Other', count: Math.floor(totalClients * 0.1) }
    ]

    // Mock performance metrics
    const performanceMetrics = [
      { metric: 'Conversion Rate', current: 15.2, previous: 12.9, change: 2.3 },
      { metric: 'Average Deal Size', current: totalRevenue / (totalDeals || 1), previous: 4800, change: ((totalRevenue / (totalDeals || 1)) - 4800) / 4800 * 100 },
      { metric: 'Win Rate', current: 68.5, previous: 64.2, change: 4.3 },
      { metric: 'Sales Cycle', current: 28, previous: 31, change: -3 }
    ]

    return {
      totalDeals,
      totalRevenue,
      totalClients,
      totalEvents,
      dealsByStatus,
      revenueByMonth,
      clientsBySource,
      performanceMetrics
    }
  }
}

export const analyticsService = new AnalyticsService()