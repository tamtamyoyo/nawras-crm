import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { BarChart3, TrendingUp, DollarSign, Users, Target, Download, Filter, Settings, RefreshCw, Eye, EyeOff } from 'lucide-react'

import { supabase } from '../lib/supabase-client'
import { offlineDataService } from '../services/offlineDataService'

import type { Database } from '../lib/database.types'
import { toast } from 'sonner'
import { isOfflineMode, handleSupabaseError, protectFromExtensionInterference } from '../utils/offlineMode'

import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'
import { CustomWidget } from '../components/analytics/CustomWidget'
import DashboardBuilder from '../components/analytics/DashboardBuilder'
import { AdvancedChart } from '../components/analytics/AdvancedChart'

type Deal = Database['public']['Tables']['deals']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

interface CustomWidget {
  id: string
  title: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'metric'
  dataSource: string
  filters?: Record<string, unknown>
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number }
}



interface Event {
  id: string
  title: string
  date: string
  type: string
}

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Analytics() {
  const { deals, leads } = useStore()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'deals', 'customers', 'conversion'])
  const [customFilters, setCustomFilters] = useState<{
    stage?: string
    source?: string
    minRevenue?: string
  }>({})
  const [showDashboardBuilder, setShowDashboardBuilder] = useState(false)
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([])

  const [chartData, setChartData] = useState({
    revenueOverTime: [],
    dealsByStage: [],
    leadsBySource: [],
    customerGrowth: [],
    conversionFunnel: [],
    performanceMetrics: []
  })

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalDeals: 0,
    totalRevenue: 0,
    totalClients: 0,
    totalEvents: 0,
    dealsByStatus: [],
    revenueByMonth: [],
    clientsBySource: [],
    performanceMetrics: []
  })


  const generateAdvancedChartData = useCallback(() => {
    const now = new Date()
    const daysBack = parseInt(dateRange)
    
    // Revenue over time
    const revenueData = Array.from({ length: daysBack }, (_, i) => {
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
    const stageData = [
      { stage: 'Lead', count: leads?.length || 0, value: 0 },
      { stage: 'Prospecting', count: deals.filter(d => d.stage === 'prospecting').length, value: deals.filter(d => d.stage === 'prospecting').reduce((sum, d) => sum + (d.value || 0), 0) },
       { stage: 'Qualification', count: deals.filter(d => d.stage === 'qualification').length, value: deals.filter(d => d.stage === 'qualification').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Proposal', count: deals.filter(d => d.stage === 'proposal').length, value: deals.filter(d => d.stage === 'proposal').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Negotiation', count: deals.filter(d => d.stage === 'negotiation').length, value: deals.filter(d => d.stage === 'negotiation').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Won', count: deals.filter(d => d.stage === 'closed_won').length, value: deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0) },
      { stage: 'Lost', count: deals.filter(d => d.stage === 'closed_lost').length, value: 0 }
    ]
    
    // Leads by source
    const sourceData = [
      { source: 'Website', count: Math.floor(Math.random() * 50) + 20, percentage: 35 },
      { source: 'Referral', count: Math.floor(Math.random() * 30) + 15, percentage: 25 },
      { source: 'Social Media', count: Math.floor(Math.random() * 25) + 10, percentage: 20 },
      { source: 'Email Campaign', count: Math.floor(Math.random() * 20) + 8, percentage: 15 },
      { source: 'Other', count: Math.floor(Math.random() * 10) + 3, percentage: 5 }
    ]
    
    // Customer growth
    const growthData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now)
      date.setMonth(date.getMonth() - (11 - i))
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        customers: Math.floor(Math.random() * 50) + (i * 10) + 20,
        growth: Math.floor(Math.random() * 20) + 5
      }
    })
    
    // Conversion funnel
    const funnelData = [
      { stage: 'Visitors', count: 1000, percentage: 100 },
      { stage: 'Leads', count: 250, percentage: 25 },
      { stage: 'Qualified', count: 100, percentage: 10 },
      { stage: 'Proposals', count: 50, percentage: 5 },
      { stage: 'Customers', count: 15, percentage: 1.5 }
    ]
    
    // Performance metrics
    const performanceData = [
      { metric: 'Conversion Rate', value: 15.2, change: 2.3, trend: 'up' },
      { metric: 'Avg Deal Size', value: 5420, change: -1.2, trend: 'down' },
      { metric: 'Sales Cycle', value: 28, change: -3.1, trend: 'up' },
      { metric: 'Win Rate', value: 68.5, change: 4.7, trend: 'up' }
    ]
    
    setChartData({
      revenueOverTime: revenueData,
      dealsByStage: stageData,
      leadsBySource: sourceData,
      customerGrowth: growthData,
      conversionFunnel: funnelData,
      performanceMetrics: performanceData
    })
  }, [dateRange, deals, leads])

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Generate advanced chart data
      generateAdvancedChartData()
      
      toast.success('Advanced analytics loaded')
    } catch (error) {
      console.error('Error loading analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [generateAdvancedChartData])

  const fetchAnalyticsData = useCallback(async () => {
    protectFromExtensionInterference()
    const offline = isOfflineMode()
    console.log('📊 Loading Analytics data...', { offlineMode: offline })
    setLoading(true)
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      let deals: Deal[] | null = null
      let clients: Customer[] | null = null
      let events: Event[] | null = null

      if (offline) {
        // Use offline data
        const allDeals = await offlineDataService.getDeals()
        const allCustomers = await offlineDataService.getCustomers()
        const allEvents = [] // Mock events data for offline mode
        
        // Filter by date range
        deals = allDeals.filter(deal => {
          const dealDate = new Date(deal.created_at)
          return dealDate >= startDate && dealDate <= endDate
        })
        
        clients = allCustomers.filter(customer => {
          const customerDate = new Date(customer.created_at)
          return customerDate >= startDate && customerDate <= endDate
        })
        
        events = allEvents
      } else {
        console.log('📊 Querying Supabase for analytics data...')
        try {
          // Fetch deals data
          const dealsResponse = await supabase
            .from('deals')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
          deals = dealsResponse.data

          // Fetch customers data
          const customersResponse = await supabase
            .from('customers')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
          clients = customersResponse.data

          // Events functionality removed
          events = []
        } catch (supabaseError) {
          console.warn('Supabase error, checking if should fallback to offline mode:', supabaseError)
          
          // Check if should fallback to offline data
          if (handleSupabaseError(supabaseError)) {
            // Use offline data as fallback
            const allDeals = await offlineDataService.getDeals()
            const allCustomers = await offlineDataService.getCustomers()
            const allEvents = [] // Mock events data for offline mode
            
            // Filter by date range
            deals = allDeals.filter(deal => {
              const dealDate = new Date(deal.created_at)
              return dealDate >= startDate && dealDate <= endDate
            })
            
            clients = allCustomers.filter(customer => {
              const customerDate = new Date(customer.created_at)
              return customerDate >= startDate && customerDate <= endDate
            })
            
            events = allEvents
          } else {
            throw supabaseError
          }
        }
      }

      // Process data
      const totalDeals = deals?.length || 0
      const totalRevenue = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0
      const totalClients = clients?.length || 0
      const totalEvents = events?.length || 0

      // Deals by status
      const statusCounts = deals?.reduce((acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const dealsByStatus = Object.entries(statusCounts).map(([status, count], index) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: COLORS[index % COLORS.length]
      }))

      // Revenue by month (last 6 months)
      const monthlyData = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthDeals = deals?.filter(deal => {
          const dealDate = new Date(deal.created_at)
          return dealDate >= monthStart && dealDate <= monthEnd
        }) || []
        
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
          deals: monthDeals.length
        })
      }

      // Clients by source (mock data for demonstration)
      const clientsBySource = [
        { source: 'Website', count: Math.floor(totalClients * 0.4) },
        { source: 'Referral', count: Math.floor(totalClients * 0.3) },
        { source: 'Social Media', count: Math.floor(totalClients * 0.2) },
        { source: 'Direct', count: Math.floor(totalClients * 0.1) }
      ]

      // Performance metrics
      const performanceMetrics = [
        {
          metric: 'Conversion Rate',
          current: totalDeals > 0 ? Math.round((deals?.filter(d => d.stage === 'closed_won').length || 0) / totalDeals * 100) : 0,
          previous: 15,
          change: 5
        },
        {
          metric: 'Avg Deal Size',
          current: totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0,
          previous: 8500,
          change: -2
        },
        {
          metric: 'Client Retention',
          current: 85,
          previous: 82,
          change: 3
        }
      ]

      setAnalyticsData({
        totalDeals,
        totalRevenue,
        totalClients,
        totalEvents,
        dealsByStatus,
        revenueByMonth: monthlyData,
        clientsBySource,
        performanceMetrics
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAnalyticsData()
    loadAnalyticsData()
  }, [dateRange, selectedMetrics, fetchAnalyticsData, loadAnalyticsData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }

  const getKPIValue = (metric: string) => {
    switch (metric) {
      case 'Total Revenue':
        return formatCurrency(analyticsData.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0))
      case 'Total Deals':
        return analyticsData.revenueByMonth.reduce((sum, item) => sum + item.deals, 0).toString()
      case 'Conversion Rate':
        return '24.5%'
      case 'Avg Deal Size': {
        const avgTotalRevenue = analyticsData.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0)
        const avgTotalDeals = analyticsData.revenueByMonth.reduce((sum, item) => sum + item.deals, 0)
        return avgTotalDeals > 0 ? formatCurrency(avgTotalRevenue / avgTotalDeals) : '$0'
      }
      case 'Active Clients':
        return analyticsData.clientsBySource.reduce((sum, item) => sum + item.count, 0).toString()
      case 'Pipeline Value':
        return formatCurrency(analyticsData.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0) * 1.2) // Estimated pipeline
      default:
        return '0'
    }
  }

  const formatValue = (metric: string, value: string) => {
    return value
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Advanced Analytics</h1>
                  <p className="text-gray-600">Comprehensive business insights and KPI dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading advanced analytics...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Advanced Analytics</h1>
                <p className="text-gray-600">Comprehensive business insights and KPI dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAnalyticsData}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDashboardBuilder(!showDashboardBuilder)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showDashboardBuilder ? 'Hide Builder' : 'Dashboard Builder'}
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Builder */}
        {showDashboardBuilder && (
          <div className="mb-6">
            <DashboardBuilder 
              data={{
                deals: deals || [],
                revenue: chartData.revenueOverTime || [],
                performance: chartData.performanceMetrics || []
              }}
              onSave={(config) => {
                setCustomWidgets(config.widgets || [])
              }}
            />
          </div>
        )}

        {/* Custom Widgets */}
        {customWidgets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Custom Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customWidgets.map((widget, index) => (
                <CustomWidget
                  key={widget.id || index}
                  config={widget}
                  data={widget.dataSource === 'deals' ? deals || [] : chartData.revenueOverTime || []}
                  onUpdate={(newConfig) => {
                    const updatedWidgets = [...customWidgets]
                    updatedWidgets[index] = newConfig
                    setCustomWidgets(updatedWidgets)
                  }}
                  onRemove={(id) => {
                    setCustomWidgets(prev => prev.filter(w => w.id !== id))
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* KPI Metrics Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Performance Indicators
            </CardTitle>
            <CardDescription>Select metrics to display on your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['revenue', 'deals', 'customers', 'conversion'].map((metric) => (
                <Button
                  key={metric}
                  variant={selectedMetrics.includes(metric) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleMetric(metric)}
                  className="capitalize"
                >
                  {selectedMetrics.includes(metric) ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  {metric}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {selectedMetrics.map((metric) => {
            const value = getKPIValue(metric)
            const icons = {
              revenue: DollarSign,
              deals: Target,
              customers: Users,
              conversion: TrendingUp
            }
            const Icon = icons[metric as keyof typeof icons]
            return (
              <Card key={metric}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 capitalize">{metric}</p>
                      <p className="text-2xl font-bold text-gray-900">{formatValue(metric, value)}</p>
                      <div className="flex items-center mt-1 text-sm text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +{Math.floor(Math.random() * 15) + 5}%
                      </div>
                    </div>
                    <Icon className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Advanced Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedChart
                data={chartData.revenueOverTime}
                config={{
                  type: 'line',
                  title: 'Revenue Overview',
                  dataKey: 'revenue',
                  xAxisKey: 'date',
                  colors: [COLORS[0]],
                  showGrid: true,
                  showLegend: false,
                  showTooltip: true,
                  smooth: true,
                  height: 320
                }}
              />

              <AdvancedChart
                data={chartData.dealsByStage}
                config={{
                  type: 'bar',
                  title: 'Deal Pipeline',
                  dataKey: 'count',
                  xAxisKey: 'stage',
                  colors: [COLORS[1]],
                  showGrid: true,
                  showLegend: false,
                  showTooltip: true,
                  height: 320
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedChart
                data={chartData.leadsBySource}
                config={{
                  type: 'pie',
                  title: 'Revenue by Source',
                  dataKey: 'count',
                  xAxisKey: 'source',
                  colors: COLORS,
                  showGrid: false,
                  showLegend: true,
                  showTooltip: true,
                  height: 320
                }}
              />

              <AdvancedChart
                data={chartData.revenueOverTime}
                config={{
                  type: 'area',
                  title: 'Monthly Revenue Comparison',
                  dataKey: 'revenue',
                  xAxisKey: 'date',
                  colors: [COLORS[3]],
                  showGrid: true,
                  showLegend: false,
                  showTooltip: true,
                  fillOpacity: 0.3,
                  height: 320
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedChart
                data={chartData.performanceMetrics}
                config={{
                  type: 'radar',
                  title: 'Performance Metrics',
                  dataKey: 'value',
                  xAxisKey: 'metric',
                  colors: [COLORS[4]],
                  showGrid: true,
                  showLegend: false,
                  showTooltip: true,
                  fillOpacity: 0.6,
                  height: 320
                }}
              />

              <AdvancedChart
                data={chartData.conversionFunnel}
                config={{
                  type: 'bar',
                  title: 'Conversion Funnel',
                  dataKey: 'count',
                  xAxisKey: 'stage',
                  colors: [COLORS[5]],
                  showGrid: true,
                  showLegend: false,
                  showTooltip: true,
                  height: 320
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedChart
                data={chartData.customerGrowth}
                config={{
                  type: 'composed',
                  title: 'Customer Growth',
                  dataKey: 'customers',
                  xAxisKey: 'month',
                  colors: [COLORS[0], COLORS[1]],
                  showGrid: true,
                  showLegend: true,
                  showTooltip: true,
                  height: 320
                }}
              />

              <AdvancedChart
                data={deals.map(deal => ({ value: deal.value || 0, probability: deal.probability || 50, name: deal.title }))}
                config={{
                  type: 'scatter',
                  title: 'Deal Value Distribution',
                  dataKey: 'probability',
                  xAxisKey: 'value',
                  yAxisKey: 'probability',
                  colors: [COLORS[2]],
                  showGrid: true,
                  showLegend: false,
                  showTooltip: true,
                  height: 320
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Custom Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
            <CardDescription>Apply custom filters to your analytics data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Deal Stage</label>
                <Input
                  placeholder="Filter by stage..."
                  value={customFilters.stage}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, stage: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Client Source</label>
                <Input
                  placeholder="Filter by source..."
                  value={customFilters.source}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Revenue Range</label>
                <Input
                  placeholder="Min revenue..."
                  type="number"
                  value={customFilters.minRevenue}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, minRevenue: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}