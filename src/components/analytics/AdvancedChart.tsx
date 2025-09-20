import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend, Brush, FunnelChart, Funnel, LabelList
} from 'recharts'
import { Download, Settings, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { ChartConfig, DEFAULT_CONFIG, CHART_TYPES, COLOR_SCHEMES } from './chart-constants'

interface ChartData {
  [key: string]: unknown
}

interface AdvancedChartProps {
  data: ChartData[]
  config: Partial<ChartConfig>
  onConfigChange?: (config: ChartConfig) => void
  className?: string
}

export function AdvancedChart({ data, config: propConfig, onConfigChange, className }: AdvancedChartProps) {
  const [config, setConfig] = useState<ChartConfig>({ ...DEFAULT_CONFIG, ...propConfig })
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDataKeys, setSelectedDataKeys] = useState<string[]>(() => {
    // Ensure we always have at least one data key
    if (config.dataKey) return [config.dataKey]
    if (data && data.length > 0) {
      const numericKeys = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number')
      return numericKeys.length > 0 ? [numericKeys[0]] : ['value']
    }
    return ['value']
  })

  // Ensure colors array is never empty
  const safeColors = config.colors && config.colors.length > 0 ? config.colors : ['#8884d8']

  const availableKeys = useMemo(() => {
    if (!data || data.length === 0) return []
    try {
      return Object.keys(data[0]).filter(key => typeof data[0][key] === 'number')
    } catch {
      return []
    }
  }, [data])

  const handleConfigChange = (newConfig: Partial<ChartConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig }
      setConfig(updatedConfig)
      if (onConfigChange) {
        onConfigChange(updatedConfig)
      }
    } catch (error) {
      console.error('Error updating config:', error)
    }
  }

  const toggleDataKey = (key: string) => {
    setSelectedDataKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const exportChart = () => {
    // In a real implementation, this would export the chart as PNG/SVG
    toast.success('Chart export functionality would be implemented here')
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    const safeColors = config.colors && config.colors.length > 0 ? config.colors : DEFAULT_CONFIG.colors
    
    // Ensure we have valid data and colors
    if (!data || data.length === 0 || !safeColors || safeColors.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
    }

    // Ensure we have valid data keys to render
    if (!selectedDataKeys || selectedDataKeys.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No valid data keys selected</p>
          </div>
        </div>
      )
    }

    // Grid, tooltip, and legend are handled inline in each chart type

    switch (config.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxisKey} />
            <YAxis />
            {config.showTooltip && <Tooltip />}
            {config.showLegend && <Legend />}
            {selectedDataKeys.length > 0 && selectedDataKeys.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={safeColors[index % safeColors.length]}
                stackId={config.stacked ? 'stack' : undefined}
              />
            ))}
            {config.showBrush && <Brush dataKey={config.xAxisKey} height={30} stroke={safeColors[0]} />}
          </BarChart>
        )

      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxisKey} />
            <YAxis />
            {config.showTooltip && <Tooltip />}
            {config.showLegend && <Legend />}
            {selectedDataKeys.length > 0 && selectedDataKeys.map((key, index) => (
              <Line 
                key={key}
                type={config.smooth ? 'monotone' : 'linear'}
                dataKey={key} 
                stroke={safeColors[index % safeColors.length]}
                strokeWidth={config.strokeWidth}
                dot={{ r: 4 }}
              />
            ))}
            {config.showBrush && <Brush dataKey={config.xAxisKey} height={30} stroke={safeColors[0]} />}
          </LineChart>
        )

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill={safeColors[0]}
              dataKey={config.dataKey}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={safeColors[index % safeColors.length]} />
              ))}
            </Pie>
            {config.showTooltip && <Tooltip />}
            {config.showLegend && <Legend />}
          </PieChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxisKey} />
            <YAxis />
            {config.showTooltip && <Tooltip />}
            {config.showLegend && <Legend />}
            {selectedDataKeys.length > 0 && selectedDataKeys.map((key, index) => (
              <Area 
                key={key}
                type={config.smooth ? 'monotone' : 'linear'}
                dataKey={key} 
                stroke={safeColors[index % safeColors.length]}
                fill={safeColors[index % safeColors.length]}
                fillOpacity={config.fillOpacity}
                stackId={config.stacked ? 'stack' : undefined}
              />
            ))}
            {config.showBrush && <Brush dataKey={config.xAxisKey} height={30} stroke={safeColors[0]} />}
          </AreaChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxisKey} />
            <YAxis />
            {config.showTooltip && <Tooltip />}
            {config.showLegend && <Legend />}
            {selectedDataKeys.length > 0 && selectedDataKeys.slice(0, 2).map((key, index) => 
              index === 0 ? (
                <Bar key={key} dataKey={key} fill={safeColors[index]} />
              ) : (
                <Line key={key} type="monotone" dataKey={key} stroke={safeColors[index]} strokeWidth={config.strokeWidth} />
              )
            )}
          </ComposedChart>
        )

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxisKey} />
            <YAxis dataKey={config.yAxisKey || selectedDataKeys[0]} />
            {config.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
            {config.showLegend && <Legend />}
            <Scatter dataKey={config.dataKey} fill={safeColors[0]} />
          </ScatterChart>
        )

      case 'radar':
        return (
          <RadarChart {...commonProps}>
            <PolarGrid />
            <PolarAngleAxis dataKey={config.xAxisKey} />
            <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
            {selectedDataKeys.length > 0 && selectedDataKeys.map((key, index) => (
              <Radar 
                key={key}
                name={key}
                dataKey={key} 
                stroke={safeColors[index % safeColors.length]}
                fill={safeColors[index % safeColors.length]}
                fillOpacity={config.fillOpacity}
              />
            ))}
            {config.showTooltip && <Tooltip />}
            {config.showLegend && <Legend />}
          </RadarChart>
        )

      case 'funnel':
        return (
          <FunnelChart {...commonProps}>
            <Funnel
              dataKey={config.dataKey}
              data={data}
              isAnimationActive
            >
              <LabelList position="center" fill="#fff" stroke="none" />
            </Funnel>
            {config.showTooltip && <Tooltip />}
          </FunnelChart>
        )

      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <Card className={cn("w-full", className)} data-testid="card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {config.title || 'Chart'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{config.type}</Badge>
            <Button variant="ghost" size="sm" onClick={exportChart} data-testid="button">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} data-testid="button">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Chart Type</label>
                <Select value={config.type} onValueChange={(value) => handleConfigChange({ type: value as ChartConfig['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Color Scheme</label>
                <Select 
                  value="default"
                  onValueChange={(value) => handleConfigChange({ colors: COLOR_SCHEMES[value as keyof typeof COLOR_SCHEMES] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(COLOR_SCHEMES).map(scheme => (
                      <SelectItem key={scheme} value={scheme}>
                        <div className="flex items-center">
                          <div className="flex space-x-1 mr-2">
                            {COLOR_SCHEMES[scheme as keyof typeof COLOR_SCHEMES].slice(0, 3).map((color, i) => (
                              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            ))}
                          </div>
                          {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Height</label>
                <Select 
                  value={config.height.toString()}
                  onValueChange={(value) => handleConfigChange({ height: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Small (300px)</SelectItem>
                    <SelectItem value="400">Medium (400px)</SelectItem>
                    <SelectItem value="500">Large (500px)</SelectItem>
                    <SelectItem value="600">Extra Large (600px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={config.showGrid} 
                  onCheckedChange={(checked) => handleConfigChange({ showGrid: checked })}
                />
                <label className="text-sm font-medium">Show Grid</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={config.showLegend} 
                  onCheckedChange={(checked) => handleConfigChange({ showLegend: checked })}
                />
                <label className="text-sm font-medium">Show Legend</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={config.showTooltip} 
                  onCheckedChange={(checked) => handleConfigChange({ showTooltip: checked })}
                />
                <label className="text-sm font-medium">Show Tooltip</label>
              </div>
              
              {['bar', 'line', 'area'].includes(config.type) && (
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={config.showBrush} 
                    onCheckedChange={(checked) => handleConfigChange({ showBrush: checked })}
                  />
                  <label className="text-sm font-medium">Show Brush</label>
                </div>
              )}
              
              {['bar', 'area'].includes(config.type) && (
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={config.stacked} 
                    onCheckedChange={(checked) => handleConfigChange({ stacked: checked })}
                  />
                  <label className="text-sm font-medium">Stacked</label>
                </div>
              )}
            </div>
            
            {availableKeys.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Data Series</label>
                <div className="flex flex-wrap gap-2">
                  {availableKeys.map(key => (
                    <Button
                      key={key}
                      variant={selectedDataKeys.includes(key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDataKey(key)}
                    >
                      {selectedDataKeys.includes(key) ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                      {key}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div style={{ height: config.height }}>
          <ResponsiveContainer width="100%" height="100%" data-testid="responsive-container">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdvancedChart