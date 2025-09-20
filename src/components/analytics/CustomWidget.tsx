import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Trash2, BarChart3, LineChart, PieChart as PieChartIcon, AreaChart, Activity, TrendingUp, TrendingDown, Target, X } from 'lucide-react'
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { WidgetConfig } from '@/types/analytics'

interface CustomWidgetProps {
  config: WidgetConfig
  data: unknown[]
  onUpdate: (config: WidgetConfig) => void
  onRemove: (id: string) => void
  isEditing?: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: Activity },
  { value: 'pie', label: 'Pie Chart', icon: PieChartIcon },
  { value: 'area', label: 'Area Chart', icon: Activity },
  { value: 'metric', label: 'Metric Card', icon: Target }
]

const DATA_SOURCES = [
  { value: 'deals', label: 'Deals' },
  { value: 'customers', label: 'Customers' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'leads', label: 'Leads' },
  { value: 'performance', label: 'Performance' }
]

export function CustomWidget({ config, data, onUpdate, onRemove, isEditing = false }: CustomWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [editConfig, setEditConfig] = useState(config)

  const handleConfigUpdate = () => {
    onUpdate(editConfig)
    setShowSettings(false)
  }

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No data available</p>
          </div>
        </div>
      )
    }

    switch (config.type) {
      case 'bar': {
        const chartData = data as Array<{ name: string; value: number }>
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
      
      case 'line': {
        const chartData = data as Array<{ name: string; value: number }>
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={COLORS[1]} strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        )
      }
      
      case 'pie': {
        const chartData = data as Array<{ name: string; value: number }>
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill={COLORS[2]}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        )
      }
      
      case 'area': {
        const chartData = data as Array<{ name: string; value: number }>
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsAreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.3} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        )
      }
      
      case 'metric': {
        const dataArray = data as Array<{ value?: number; previousValue?: number }>
        const totalValue = dataArray.reduce((sum, item) => sum + (item.value || 0), 0)
        const previousValue = dataArray.reduce((sum, item) => sum + (item.previousValue || 0), 0)
        const change = previousValue > 0 ? ((totalValue - previousValue) / previousValue) * 100 : 0
        const isPositive = change >= 0
        
        return (
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {typeof totalValue === 'number' && totalValue > 1000 
                  ? `$${(totalValue / 1000).toFixed(1)}k` 
                  : totalValue.toLocaleString()}
              </p>
              <div className={cn(
                "flex items-center mt-1 text-sm",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            </div>
            <Target className="h-8 w-8 text-gray-400" />
          </div>
        )
      }
      
      default:
        return <div>Unsupported chart type</div>
    }
  }

  const getSizeClass = () => {
    switch (config.size) {
      case 'small': return 'col-span-1'
      case 'medium': return 'col-span-2'
      case 'large': return 'col-span-3'
      default: return 'col-span-1'
    }
  }

  return (
    <Card className={cn(
      "relative transition-all duration-200",
      getSizeClass(),
      isEditing && "ring-2 ring-blue-500"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-xs">
            {DATA_SOURCES.find(ds => ds.value === config.dataSource)?.label}
          </Badge>
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(config.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {showSettings ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={editConfig.title}
                onChange={(e) => setEditConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Chart Type</label>
              <Select
                value={editConfig.type}
                onValueChange={(value) => setEditConfig(prev => ({ ...prev, type: value as WidgetConfig['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="h-4 w-4 mr-2" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Data Source</label>
              <Select
                value={editConfig.dataSource}
                onValueChange={(value) => setEditConfig(prev => ({ ...prev, dataSource: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SOURCES.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Size</label>
              <Select
                value={editConfig.size}
                onValueChange={(value) => setEditConfig(prev => ({ ...prev, size: value as WidgetConfig['size'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleConfigUpdate} size="sm">
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(false)} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  )
}

export default CustomWidget