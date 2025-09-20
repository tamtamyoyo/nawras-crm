// Analytics types for chart components
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'composed' | 'scatter' | 'radar' | 'funnel'
  title: string
  dataKey: string
  xAxisKey: string
  yAxisKey?: string
  colors: string[]
  showGrid: boolean
  showLegend: boolean
  showTooltip: boolean
  showBrush: boolean
  stacked: boolean
  smooth: boolean
  fillOpacity: number
  strokeWidth: number
  height: number
}

export interface ChartData {
  [key: string]: string | number
}

export interface ChartProps {
  data: ChartData[]
  config: ChartConfig
  className?: string
  onConfigChange?: (config: ChartConfig) => void
}

export type ChartType = ChartConfig['type']

export interface ColorScheme {
  [key: string]: string[]
}

export interface ChartMetrics {
  total: number
  average: number
  min: number
  max: number
  trend: 'up' | 'down' | 'stable'
}

export interface WidgetConfig {
  id: string
  title: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'metric'
  dataSource: string
  filters?: Record<string, unknown>
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number }
}

export interface DashboardConfig {
  id: string
  name: string
  widgets: WidgetConfig[]
  layout: 'grid' | 'masonry'
  columns: number
}