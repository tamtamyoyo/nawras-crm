import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../hooks/useAuthHook'
import { useStore } from '../store/useStore'
import { dashboardService } from '../services/dashboardService'
import { protectFromExtensionInterference } from '../utils/extensionProtection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { TrendingUp, DollarSign, Calendar, Plus, Phone, Mail, FileText, Activity, Target, UserPlus, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { ResponsiveContainer as ResponsiveWrapper, ResponsiveGrid, ResponsiveCard } from '@/components/ui/responsive'
import { PageLoadingOverlay, StatsLoadingSkeleton, ChartLoadingSkeleton } from '@/components/ui/loading-states'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden, AccessibleButton } from '@/components/ui/accessibility'

import type { Database } from '../lib/database.types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

type Deal = Database['public']['Tables']['deals']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Customer = Database['public']['Tables']['customers']['Row']
type Proposal = Database['public']['Tables']['proposals']['Row']

export default function Dashboard() {
  const { user } = useAuth()
  const { customers, deals, leads, proposals, setCustomers, setDeals, setLeads, setProposals } = useStore()
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<{
    monthlyRevenue: Array<{ month: string; revenue: number }>
    dealsByStage: Array<{ stage: string; count: number }>
    leadsBySource: Array<{ source: string; count: number; value: number }>
  }>({
    monthlyRevenue: [],
    dealsByStage: [],
    leadsBySource: []
  })
  const [refreshing, setRefreshing] = useState(false)
  // Responsive breakpoints available but not used in current implementation

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      protectFromExtensionInterference()
      
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const data = await dashboardService.loadDashboardData()
      
      setCustomers(data.customers)
      setDeals(data.deals)
      setLeads(data.leads)
      setProposals(data.proposals)

      // Generate chart data
      const chartData = dashboardService.generateChartData(data.deals, data.leads)
      setChartData(chartData)

      toast.success('Dashboard loaded')
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [setCustomers, setDeals, setLeads, setProposals])

  useEffect(() => {
    loadDashboardData(false)
  }, [loadDashboardData])

  const handleRefresh = () => {
    loadDashboardData(true)
  }

  const totalRevenue = deals.filter(deal => deal.stage === 'closed_won').reduce((sum, deal) => sum + (deal.value || 0), 0)
  const activeDeals = deals.filter(deal => deal.stage && !['closed_won', 'closed_lost'].includes(deal.stage))
  // Calculate conversion rate from leads to deals
  const conversionRate = leads.length > 0 ? Math.round((deals.length / leads.length) * 100) : 0

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '+12%',
      changeType: 'positive' as const,
      icon: DollarSign,
      bgColor: 'bg-green-100',
      color: 'text-green-600'
    },
    {
      title: 'Active Deals',
      value: activeDeals.length.toString(),
      change: '+3',
      changeType: 'positive' as const,
      icon: TrendingUp,
      bgColor: 'bg-blue-100',
      color: 'text-blue-600'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: '+2%',
      changeType: 'positive' as const,
      icon: Target,
      bgColor: 'bg-purple-100',
      color: 'text-purple-600'
    },
    {
      title: 'Total Proposals',
      value: proposals.length.toString(),
      change: '+5',
      changeType: 'positive' as const,
      icon: FileText,
      bgColor: 'bg-orange-100',
      color: 'text-orange-600'
    }
  ]

  const quickActions = [
    { label: 'Add Customer', icon: Plus, action: () => window.location.href = '/customers' },
    { label: 'Add Lead', icon: Phone, action: () => window.location.href = '/leads' },
    { label: 'Create Deal', icon: Mail, action: () => window.location.href = '/deals' },
    { label: 'Create Proposal', icon: FileText, action: () => window.location.href = '/proposals' }
  ]

  const recentActivity = [
    { 
      type: 'lead', 
      title: 'New Lead',
      description: 'New lead from website contact form', 
      message: 'New lead from website contact form', 
      time: '2 minutes ago',
      icon: UserPlus,
      color: 'text-green-600'
     },
     { 
       type: 'deal', 
       title: 'Deal Updated',
       description: 'Deal "Enterprise Solution" moved to negotiation', 
       message: 'Deal "Enterprise Solution" moved to negotiation', 
       time: '15 minutes ago',
       icon: TrendingUp,
       color: 'text-blue-600'
     },
     { 
       type: 'task', 
       title: 'Task Scheduled',
       description: 'Follow-up call scheduled with ABC Corp', 
       message: 'Follow-up call scheduled with ABC Corp', 
       time: '1 hour ago',
       icon: Calendar,
       color: 'text-orange-600'
     },
     { 
       type: 'lead', 
       title: 'Lead Qualified',
       description: 'Lead qualification completed for XYZ Inc', 
       message: 'Lead qualification completed for XYZ Inc', 
       time: '2 hours ago',
       icon: Target,
       color: 'text-green-600'
    }
  ]

  if (loading) {
    return (
      <PageLoadingOverlay 
        message="Loading dashboard data..."
      />
    )
  }

  return (
    <ResponsiveWrapper className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight" data-testid="page-title">
              <VisuallyHidden>Dashboard for </VisuallyHidden>
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Welcome back, {user?.user_metadata?.full_name || user?.email}! Here's what's happening with your business.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="h-3 w-3 mr-1" aria-hidden="true" />
              Live Data
            </Badge>
            <AccessibleButton
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
              ariaLabel="Refresh dashboard data"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} aria-hidden="true" />
              Refresh Data
            </AccessibleButton>
          </div>
        </div>

      {/* Stats Cards */}
      {refreshing ? (
        <StatsLoadingSkeleton count={4} />
      ) : (
        <ResponsiveGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <ResponsiveCard key={index} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </CardContent>
              </ResponsiveCard>
            ))
          ) : (
            stats.map((stat, index) => {
              const Icon = stat.icon
              const isPositive = stat.changeType === 'positive'
              return (
                <ResponsiveCard 
                  key={index} 
                  className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label={`${stat.title}: ${stat.value}, ${stat.change} change`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      // Handle card interaction if needed
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            Live
                          </Badge>
                        </div>
                        <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" aria-hidden="true" />
                          )}
                          <p className={cn(
                            "text-sm font-medium",
                            isPositive ? "text-green-600" : "text-red-600"
                          )}>
                            {stat.change}
                          </p>
                          <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                        </div>
                      </div>
                      <div className={cn(
                        "p-3 rounded-full transition-colors duration-200 group-hover:scale-110",
                        stat.bgColor
                      )}>
                        <Icon className={cn("h-6 w-6", stat.color)} aria-hidden="true" />
                      </div>
                    </div>
                  </CardContent>
                </ResponsiveCard>
              )
            })
          )}
        </ResponsiveGrid>
      )}

      {/* Charts */}
      {refreshing ? (
        <ResponsiveGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <ChartLoadingSkeleton className="col-span-full md:col-span-2 lg:col-span-1" height="h-[300px]" />
          <ChartLoadingSkeleton height="h-[300px]" />
          <ChartLoadingSkeleton height="h-[300px]" />
        </ResponsiveGrid>
      ) : (
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="col-span-full md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                  <CardDescription>Revenue trend over the last 6 months</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                  Trending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.monthlyRevenue} aria-label="Monthly revenue chart">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Deals by Stage</CardTitle>
                <CardDescription>Current pipeline distribution</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activeDeals.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.dealsByStage} aria-label="Deals by stage chart">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="stage" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value, 'Deals']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    className="hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Leads by Source</CardTitle>
                <CardDescription>Lead generation channels</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {leads.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart aria-label="Leads by source chart">
                  <Pie
                    data={chartData.leadsBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, value }) => `${source}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    className="outline-none"
                  >
                    {chartData.leadsBySource.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value, 'Leads']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-background to-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </div>
            <CardDescription>Common tasks and shortcuts to boost productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                const colors = [
                  { bg: 'bg-blue-50 group-hover:bg-blue-100', icon: 'text-blue-600' },
                  { bg: 'bg-green-50 group-hover:bg-green-100', icon: 'text-green-600' },
                  { bg: 'bg-purple-50 group-hover:bg-purple-100', icon: 'text-purple-600' },
                  { bg: 'bg-orange-50 group-hover:bg-orange-100', icon: 'text-orange-600' }
                ]
                const colorScheme = colors[index % colors.length]
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-24 flex flex-col gap-3 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group"
                    onClick={action.action}
                    aria-label={action.label}
                  >
                    <div className={`p-2 rounded-full ${colorScheme.bg} transition-colors`}>
                      <Icon className={`h-5 w-5 ${colorScheme.icon}`} aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest updates and actions across your CRM</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Live Updates
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div 
                      key={index} 
                      className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors duration-200 group cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${activity.title}: ${activity.description}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          // Handle activity interaction if needed
                        }
                      }}
                    >
                      <div className={cn(
                        "p-2.5 rounded-full transition-transform duration-200 group-hover:scale-110",
                        activity.color
                      )}>
                        <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {activity.type || 'Update'}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Activity will appear here as you use the CRM</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </ResponsiveWrapper>
  )
}