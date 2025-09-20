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

export const DEFAULT_CONFIG: ChartConfig = {
  type: 'bar',
  title: 'Chart',
  dataKey: 'value',
  xAxisKey: 'name',
  colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'],
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  showBrush: false,
  stacked: false,
  smooth: true,
  fillOpacity: 0.6,
  strokeWidth: 2,
  height: 400
}

export const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'composed', label: 'Composed Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'radar', label: 'Radar Chart' },
  { value: 'funnel', label: 'Funnel Chart' }
]

export const COLOR_SCHEMES = {
  default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'],
  blues: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a'],
  greens: ['#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5'],
  warm: ['#ff7f0e', '#ffbb78', '#d62728', '#ff9896', '#8c564b', '#c49c94'],
  cool: ['#17becf', '#9edae5', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d']
}