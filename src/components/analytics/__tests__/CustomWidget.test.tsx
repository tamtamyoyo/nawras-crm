import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { CustomWidget } from '../CustomWidget'

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => <div data-testid={`bar-${dataKey}`} style={{ fill }}></div>,
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => <div data-testid={`line-${dataKey}`} style={{ stroke }}></div>,
  Pie: ({ dataKey }: { dataKey: string }) => <div data-testid={`pie-${dataKey}`}></div>,
  Area: ({ dataKey, fill }: { dataKey: string; fill: string }) => <div data-testid={`area-${dataKey}`} style={{ fill }}></div>,
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid={`x-axis-${dataKey}`}></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" style={{ fill }}></div>
}))

const mockConfig = {
  id: 'widget-1',
  title: 'Test Widget',
  type: 'bar' as const,
  dataSource: 'deals',
  size: 'medium' as const,
  position: { x: 0, y: 0 }
}

const mockData = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 150 },
  { name: 'Mar', value: 120 }
]

const mockMetricData = [
  { value: 1500, previousValue: 1200 },
  { value: 800, previousValue: 900 }
]

describe('CustomWidget', () => {
  const mockOnUpdate = vi.fn()
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders widget with basic configuration', () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )

    expect(screen.getByText('Test Widget')).toBeInTheDocument()
    expect(screen.getByText('Deals')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders empty state when no data provided', () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={[]}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('renders different chart types correctly', () => {
    const chartTypes = ['bar', 'line', 'pie', 'area'] as const
    
    chartTypes.forEach(type => {
      const { unmount } = render(
        <CustomWidget
          config={{ ...mockConfig, type }}
          data={mockData}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      )
      
      expect(screen.getByTestId(`${type}-chart`)).toBeInTheDocument()
      unmount()
    })
  })

  it('renders metric widget with calculations', () => {
    render(
      <CustomWidget
        config={{ ...mockConfig, type: 'metric' }}
        data={mockMetricData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )

    // Total value: 1500 + 800 = 2300, formatted as $2.3k
    expect(screen.getByText('$2.3k')).toBeInTheDocument()
    
    // Change calculation: ((2300 - 2100) / 2100) * 100 = 9.5%
    expect(screen.getByText('9.5%')).toBeInTheDocument()
  })

  it('shows editing controls when isEditing is true', () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('opens settings panel when settings button is clicked', () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Chart Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Data Source')).toBeInTheDocument()
    expect(screen.getByLabelText('Size')).toBeInTheDocument()
  })

  it('handles title change in settings', async () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, { target: { value: 'Updated Widget' } })
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Widget' })
      )
    })
  })

  it('handles chart type change in settings', async () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    const chartTypeSelect = screen.getByDisplayValue('Bar Chart')
    fireEvent.click(chartTypeSelect)
    
    const lineOption = screen.getByText('Line Chart')
    fireEvent.click(lineOption)
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'line' })
      )
    })
  })

  it('handles data source change in settings', async () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    const dataSourceSelect = screen.getByDisplayValue('Deals')
    fireEvent.click(dataSourceSelect)
    
    const customersOption = screen.getByText('Customers')
    fireEvent.click(customersOption)
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ dataSource: 'customers' })
      )
    })
  })

  it('handles size change in settings', async () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    const sizeSelect = screen.getByDisplayValue('Medium')
    fireEvent.click(sizeSelect)
    
    const largeOption = screen.getByText('Large')
    fireEvent.click(largeOption)
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'large' })
      )
    })
  })

  it('cancels settings changes when cancel button is clicked', () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    
    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, { target: { value: 'Changed Title' } })
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Test Widget')).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', () => {
    render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /remove/i }))

    expect(mockOnRemove).toHaveBeenCalledWith('widget-1')
  })

  it('applies correct size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    const expectedClasses = ['col-span-1', 'col-span-2', 'col-span-3']
    
    sizes.forEach((size, index) => {
      const { container, unmount } = render(
        <CustomWidget
          config={{ ...mockConfig, size }}
          data={mockData}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      )
      
      expect(container.firstChild).toHaveClass(expectedClasses[index])
      unmount()
    })
  })

  it('applies editing ring when isEditing is true', () => {
    const { container } = render(
      <CustomWidget
        config={mockConfig}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        isEditing={true}
      />
    )

    expect(container.firstChild).toHaveClass('ring-2', 'ring-blue-500')
  })

  it('renders pie chart with cells', () => {
    render(
      <CustomWidget
        config={{ ...mockConfig, type: 'pie' }}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId('cell')).toHaveLength(mockData.length)
  })

  it('handles metric widget with negative change', () => {
    const negativeChangeData = [
      { value: 800, previousValue: 1000 },
      { value: 600, previousValue: 800 }
    ]

    render(
      <CustomWidget
        config={{ ...mockConfig, type: 'metric' }}
        data={negativeChangeData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )

    // Should show negative change percentage
    expect(screen.getByText('22.2%')).toBeInTheDocument()
  })

  it('handles metric widget with large values', () => {
    const largeValueData = [
      { value: 50000, previousValue: 45000 }
    ]

    render(
      <CustomWidget
        config={{ ...mockConfig, type: 'metric' }}
        data={largeValueData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )

    // Should format large values with k suffix
    expect(screen.getByText('$50.0k')).toBeInTheDocument()
  })

  it('handles unsupported chart type', () => {
    render(
      <CustomWidget
        config={{ ...mockConfig, type: 'unsupported' as any }}
        data={mockData}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )

    expect(screen.getByText('Unsupported chart type')).toBeInTheDocument()
  })

  it('displays correct data source label', () => {
    const dataSources = ['deals', 'customers', 'revenue', 'leads', 'performance']
    const expectedLabels = ['Deals', 'Customers', 'Revenue', 'Leads', 'Performance']
    
    dataSources.forEach((dataSource, index) => {
      const { unmount } = render(
        <CustomWidget
          config={{ ...mockConfig, dataSource }}
          data={mockData}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      )
      
      expect(screen.getByText(expectedLabels[index])).toBeInTheDocument()
      unmount()
    })
  })
})