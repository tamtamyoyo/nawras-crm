import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AdvancedChart } from '../AdvancedChart'
import { ChartConfig, DEFAULT_CONFIG } from '../chart-constants'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn()
  }
}))

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  ScatterChart: ({ children }: { children: React.ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  FunnelChart: ({ children }: { children: React.ReactNode }) => <div data-testid="funnel-chart">{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => <div data-testid={`bar-${dataKey}`} style={{ fill }}></div>,
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => <div data-testid={`line-${dataKey}`} style={{ stroke }}></div>,
  Pie: ({ dataKey }: { dataKey: string }) => <div data-testid={`pie-${dataKey}`}></div>,
  Area: ({ dataKey, fill }: { dataKey: string; fill: string }) => <div data-testid={`area-${dataKey}`} style={{ fill }}></div>,
  Scatter: ({ dataKey }: { dataKey: string }) => <div data-testid={`scatter-${dataKey}`}></div>,
  Radar: ({ dataKey }: { dataKey: string }) => <div data-testid={`radar-${dataKey}`}></div>,
  Funnel: ({ dataKey }: { dataKey: string }) => <div data-testid={`funnel-${dataKey}`}></div>,
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid={`x-axis-${dataKey}`}></div>,
  YAxis: ({ dataKey }: { dataKey?: string }) => <div data-testid={`y-axis${dataKey ? `-${dataKey}` : ''}`}></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>,
  Brush: ({ dataKey }: { dataKey: string }) => <div data-testid={`brush-${dataKey}`}></div>,
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" style={{ fill }}></div>,
  PolarGrid: () => <div data-testid="polar-grid"></div>,
  PolarAngleAxis: ({ dataKey }: { dataKey: string }) => <div data-testid={`polar-angle-axis-${dataKey}`}></div>,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis"></div>,
  LabelList: () => <div data-testid="label-list"></div>
}))

const mockData = [
  { name: 'Jan', sales: 100, revenue: 200, profit: 50 },
  { name: 'Feb', sales: 150, revenue: 300, profit: 75 },
  { name: 'Mar', sales: 120, revenue: 250, profit: 60 }
]

const mockConfig: Partial<ChartConfig> = {
  title: 'Test Chart',
  dataKey: 'sales',
  xAxisKey: 'name'
}

describe('AdvancedChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default configuration', () => {
    render(<AdvancedChart data={mockData} config={mockConfig} />)
    
    expect(screen.getByText('Test Chart')).toBeInTheDocument()
    expect(screen.getByText('bar')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders empty state when no data provided', () => {
    render(<AdvancedChart data={[]} config={mockConfig} />)
    
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('renders different chart types correctly', () => {
    const chartTypes: ChartConfig['type'][] = ['bar', 'line', 'pie', 'area', 'composed', 'scatter', 'radar', 'funnel']
    
    chartTypes.forEach(type => {
      const { unmount } = render(
        <AdvancedChart 
          data={mockData} 
          config={{ ...mockConfig, type }} 
        />
      )
      
      expect(screen.getByTestId(`${type}-chart`)).toBeInTheDocument()
      unmount()
    })
  })

  it('shows settings panel when settings button is clicked', () => {
    render(<AdvancedChart data={mockData} config={mockConfig} />)
    
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(settingsButton)
    
    expect(screen.getByText('Chart Type')).toBeInTheDocument()
    expect(screen.getByText('Color Scheme')).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
  })

  it('handles chart type change', async () => {
    const onConfigChange = vi.fn()
    render(
      <AdvancedChart 
        data={mockData} 
        config={mockConfig} 
        onConfigChange={onConfigChange}
      />
    )
    
    // Open settings
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    // Change chart type
    const chartTypeSelect = screen.getByDisplayValue('Bar Chart')
    fireEvent.click(chartTypeSelect)
    
    const lineOption = screen.getByText('Line Chart')
    fireEvent.click(lineOption)
    
    await waitFor(() => {
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'line' })
      )
    })
  })

  it('handles color scheme change', async () => {
    const onConfigChange = vi.fn()
    render(
      <AdvancedChart 
        data={mockData} 
        config={mockConfig} 
        onConfigChange={onConfigChange}
      />
    )
    
    // Open settings
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    // Change color scheme
    const colorSchemeSelect = screen.getByDisplayValue('Default')
    fireEvent.click(colorSchemeSelect)
    
    const bluesOption = screen.getByText('Blues')
    fireEvent.click(bluesOption)
    
    await waitFor(() => {
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ 
          colors: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a']
        })
      )
    })
  })

  it('handles height change', async () => {
    const onConfigChange = vi.fn()
    render(
      <AdvancedChart 
        data={mockData} 
        config={mockConfig} 
        onConfigChange={onConfigChange}
      />
    )
    
    // Open settings
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    // Change height
    const heightSelect = screen.getByDisplayValue('Medium (400px)')
    fireEvent.click(heightSelect)
    
    const largeOption = screen.getByText('Large (500px)')
    fireEvent.click(largeOption)
    
    await waitFor(() => {
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ height: 500 })
      )
    })
  })

  it('handles toggle switches', async () => {
    const onConfigChange = vi.fn()
    render(
      <AdvancedChart 
        data={mockData} 
        config={mockConfig} 
        onConfigChange={onConfigChange}
      />
    )
    
    // Open settings
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    // Toggle grid
    const gridSwitch = screen.getByRole('switch', { name: /show grid/i })
    fireEvent.click(gridSwitch)
    
    await waitFor(() => {
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ showGrid: false })
      )
    })
  })

  it('handles data series toggle', async () => {
    render(<AdvancedChart data={mockData} config={mockConfig} />)
    
    // Open settings
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    // Toggle revenue data series
    const revenueButton = screen.getByRole('button', { name: /revenue/i })
    fireEvent.click(revenueButton)
    
    // Should show eye icon for selected series
    expect(revenueButton).toBeInTheDocument()
  })

  it('handles export functionality', () => {
    render(<AdvancedChart data={mockData} config={mockConfig} />)
    
    const exportButton = screen.getByRole('button', { name: /download/i })
    fireEvent.click(exportButton)
    
    expect(toast.success).toHaveBeenCalledWith(
      'Chart export functionality would be implemented here'
    )
  })

  it('renders chart elements based on configuration', () => {
    const configWithElements: Partial<ChartConfig> = {
      ...mockConfig,
      showGrid: true,
      showLegend: true,
      showTooltip: true,
      showBrush: true
    }
    
    render(<AdvancedChart data={mockData} config={configWithElements} />)
    
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    expect(screen.getByTestId('legend')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('brush-name')).toBeInTheDocument()
  })

  it('handles stacked configuration for bar charts', () => {
    const stackedConfig: Partial<ChartConfig> = {
      ...mockConfig,
      type: 'bar',
      stacked: true
    }
    
    render(<AdvancedChart data={mockData} config={stackedConfig} />)
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('handles smooth lines for line charts', () => {
    const smoothConfig: Partial<ChartConfig> = {
      ...mockConfig,
      type: 'line',
      smooth: true
    }
    
    render(<AdvancedChart data={mockData} config={smoothConfig} />)
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders pie chart with cells', () => {
    const pieConfig: Partial<ChartConfig> = {
      ...mockConfig,
      type: 'pie'
    }
    
    render(<AdvancedChart data={mockData} config={pieConfig} />)
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId('cell')).toHaveLength(mockData.length)
  })

  it('handles unsupported chart type', () => {
    const unsupportedConfig = {
      ...mockConfig,
      type: 'unsupported' as ChartConfig['type']
    }
    
    render(<AdvancedChart data={mockData} config={unsupportedConfig} />)
    
    expect(screen.getByText('Unsupported chart type')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <AdvancedChart 
        data={mockData} 
        config={mockConfig} 
        className="custom-chart"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-chart')
  })

  it('detects available numeric keys from data', () => {
    render(<AdvancedChart data={mockData} config={mockConfig} />)
    
    // Open settings to see data series
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    expect(screen.getByRole('button', { name: /sales/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /revenue/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /profit/i })).toBeInTheDocument()
  })
})