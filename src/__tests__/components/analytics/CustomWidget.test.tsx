import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { toast } from 'sonner'
import { CustomWidget } from '../../../components/analytics/CustomWidget'
import { WidgetConfig } from '@/types/analytics'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock recharts components with proper types
interface MockChartProps {
  children?: React.ReactNode;
}

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: MockChartProps) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: MockChartProps) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: MockChartProps) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }: MockChartProps) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }: MockChartProps) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />
}))

// Mock UI components with proper types
interface MockCardProps {
  children?: React.ReactNode;
  className?: string;
}

interface MockCardContentProps {
  children?: React.ReactNode;
}

vi.mock('../../../components/ui/card', () => ({
  Card: ({ children, className }: MockCardProps) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }: MockCardProps) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: MockCardProps) => <div data-testid="card-title" className={className}>{children}</div>,
  CardContent: ({ children }: MockCardContentProps) => <div data-testid="card-content">{children}</div>
}))

interface MockButtonProps {
  children?: React.ReactNode
  onClick?: () => void
  variant?: string
  size?: string
  [key: string]: unknown
}

vi.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: MockButtonProps) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}))

interface MockInputProps {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  [key: string]: unknown
}

vi.mock('../../../components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: MockInputProps) => (
    <input 
      data-testid="input" 
      value={value} 
      onChange={onChange}
      {...props}
    />
  )
}))

interface MockBadgeProps {
  children?: React.ReactNode
  variant?: string
  className?: string
}

vi.mock('../../../components/ui/badge', () => ({
  Badge: ({ children, variant, className }: MockBadgeProps) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  )
}))

interface MockSelectProps {
  children?: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}

interface MockSelectItemProps {
  children?: React.ReactNode
  value?: string
}

interface MockSelectChildProps {
  children?: React.ReactNode
}

vi.mock('../../../components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: MockSelectProps) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange && onValueChange('test-value')}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: MockSelectChildProps) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value" />,
  SelectContent: ({ children }: MockSelectChildProps) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: MockSelectItemProps) => <div data-testid="select-item" data-value={value}>{children}</div>
}))

// Mock lucide-react icons with proper types
interface MockIconProps {
  className?: string;
  size?: number | string;
  color?: string;
  [key: string]: unknown;
}

vi.mock('lucide-react', () => ({
  TrendingUp: (props: MockIconProps) => <div data-testid="trending-up-icon" {...props} />,
  TrendingDown: (props: MockIconProps) => <div data-testid="trending-down-icon" {...props} />,
  BarChart3: (props: MockIconProps) => <div data-testid="bar-chart-icon" {...props} />,
  PieChart: (props: MockIconProps) => <div data-testid="pie-chart-icon" {...props} />,
  Settings: (props: MockIconProps) => <div data-testid="settings-icon" {...props} />,
  X: (props: MockIconProps) => <div data-testid="x-icon" {...props} />,
  Activity: (props: MockIconProps) => <div data-testid="activity-icon" {...props} />,
  Target: (props: MockIconProps) => <div data-testid="target-icon" {...props} />
}))

// Mock utils with proper types
vi.mock('../../../lib/utils', () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ')
}))

const mockChartData = [
  { name: 'Jan', value: 1000 },
  { name: 'Feb', value: 1200 },
  { name: 'Mar', value: 900 },
  { name: 'Apr', value: 1500 }
]

const mockMetricData = [
  { value: 5000, previousValue: 4500 },
  { value: 3000, previousValue: 2800 }
]

const defaultConfig: WidgetConfig = {
  id: 'widget-1',
  title: 'Test Widget',
  type: 'bar',
  dataSource: 'deals',
  size: 'medium',
  position: { x: 0, y: 0 }
}

describe('CustomWidget', () => {
  const user = userEvent.setup()
  const mockOnUpdate = vi.fn()
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders widget with default configuration', () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('card-title')).toHaveTextContent('Test Widget')
      expect(screen.getByTestId('badge')).toHaveTextContent('Deals')
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('applies correct size class', () => {
      const { rerender } = render(
        <CustomWidget 
          config={{ ...defaultConfig, size: 'small' }} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByTestId('card')).toHaveClass('col-span-1')
      
      rerender(
        <CustomWidget 
          config={{ ...defaultConfig, size: 'large' }} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByTestId('card')).toHaveClass('col-span-3')
    })

    it('shows editing state when isEditing is true', () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      expect(screen.getByTestId('card')).toHaveClass('ring-2', 'ring-blue-500')
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })

    it('hides editing controls when isEditing is false', () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={false}
        />
      )
      
      expect(screen.queryByTestId('settings-icon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument()
    })
  })

  describe('Chart Types', () => {
    const chartTypes = [
      { type: 'bar' as const, testId: 'bar-chart' },
      { type: 'line' as const, testId: 'line-chart' },
      { type: 'pie' as const, testId: 'pie-chart' },
      { type: 'area' as const, testId: 'area-chart' }
    ]

    chartTypes.forEach(({ type, testId }) => {
      it(`renders ${type} chart correctly`, () => {
        const config = { ...defaultConfig, type }
        render(
          <CustomWidget 
            config={config} 
            data={mockChartData} 
            onUpdate={mockOnUpdate} 
            onRemove={mockOnRemove} 
          />
        )
        
        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })

    it('renders metric card correctly', () => {
      const config = { ...defaultConfig, type: 'metric' as const }
      render(
        <CustomWidget 
          config={config} 
          data={mockMetricData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByText('$8.0k')).toBeInTheDocument() // Total value
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument() // Positive change
      expect(screen.getByTestId('target-icon')).toBeInTheDocument()
    })

    it('handles metric card with negative change', () => {
      const negativeData = [
        { value: 4000, previousValue: 5000 }
      ]
      const config = { ...defaultConfig, type: 'metric' as const }
      
      render(
        <CustomWidget 
          config={config} 
          data={negativeData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument()
    })

    it('formats large numbers correctly in metric card', () => {
      const largeData = [
        { value: 15000, previousValue: 12000 }
      ]
      const config = { ...defaultConfig, type: 'metric' as const }
      
      render(
        <CustomWidget 
          config={config} 
          data={largeData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByText('$15.0k')).toBeInTheDocument()
    })

    it('renders unsupported chart type message', () => {
      const config = { ...defaultConfig, type: 'invalid' as any }
      render(
        <CustomWidget 
          config={config} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByText('Unsupported chart type')).toBeInTheDocument()
    })
  })

  describe('Empty Data Handling', () => {
    it('shows no data message when data is empty', () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={[]} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument()
    })

    it('shows no data message when data is null', () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={null as any} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('Settings Panel', () => {
    it('toggles settings panel visibility', async () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      // Settings panel should be hidden initially
      expect(screen.queryByText('Title')).not.toBeInTheDocument()
      
      // Click settings button
      const settingsButton = screen.getAllByTestId('button')[0]
      await user.click(settingsButton)
      
      // Settings panel should be visible
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
      expect(screen.getByText('Data Source')).toBeInTheDocument()
      expect(screen.getByText('Size')).toBeInTheDocument()
    })

    it('updates title in settings', async () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      const settingsButton = screen.getAllByTestId('button')[0]
      await user.click(settingsButton)
      
      const titleInput = screen.getByTestId('input')
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')
      
      expect(titleInput).toHaveValue('New Title')
    })

    it('saves configuration changes', async () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      const settingsButton = screen.getAllByTestId('button')[0]
      await user.click(settingsButton)
      
      const titleInput = screen.getByTestId('input')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...defaultConfig,
        title: 'Updated Title'
      })
    })

    it('cancels configuration changes', async () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      const settingsButton = screen.getAllByTestId('button')[0]
      await user.click(settingsButton)
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(screen.queryByText('Title')).not.toBeInTheDocument()
      expect(mockOnUpdate).not.toHaveBeenCalled()
    })

    it('handles select changes', async () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      const settingsButton = screen.getAllByTestId('button')[0]
      await user.click(settingsButton)
      
      const chartTypeSelect = screen.getAllByTestId('select')[0]
      fireEvent.click(chartTypeSelect)
      
      // The mock select will trigger onValueChange with 'test-value'
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })

  describe('Widget Actions', () => {
    it('handles remove action', async () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      const removeButton = screen.getAllByTestId('button')[1] // Second button is remove
      await user.click(removeButton)
      
      expect(mockOnRemove).toHaveBeenCalledWith('widget-1')
    })
  })

  describe('Data Source Badge', () => {
    it('displays correct data source label', () => {
      const dataSources = [
        { value: 'deals', label: 'Deals' },
        { value: 'customers', label: 'Customers' },
        { value: 'revenue', label: 'Revenue' },
        { value: 'leads', label: 'Leads' },
        { value: 'performance', label: 'Performance' }
      ]
      
      dataSources.forEach(({ value, label }) => {
        const config = { ...defaultConfig, dataSource: value }
        const { rerender } = render(
          <CustomWidget 
            config={config} 
            data={mockChartData} 
            onUpdate={mockOnUpdate} 
            onRemove={mockOnRemove} 
          />
        )
        
        expect(screen.getByTestId('badge')).toHaveTextContent(label)
        
        rerender(<div />)
      })
    })

    it('handles unknown data source', () => {
      const config = { ...defaultConfig, dataSource: 'unknown' }
      render(
        <CustomWidget 
          config={config} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      // Should not crash and badge should be empty or show fallback
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing config properties gracefully', () => {
      const incompleteConfig = {
        id: 'test',
        title: 'Test',
        type: 'bar' as const
      }
      
      expect(() => {
        render(
          <CustomWidget 
            config={incompleteConfig as any} 
            data={mockChartData} 
            onUpdate={mockOnUpdate} 
            onRemove={mockOnRemove} 
          />
        )
      }).not.toThrow()
    })

    it('handles metric data with missing values', () => {
      const incompleteMetricData = [
        { value: 1000 }, // Missing previousValue
        { previousValue: 500 } // Missing value
      ]
      const config = { ...defaultConfig, type: 'metric' as const }
      
      render(
        <CustomWidget 
          config={config} 
          data={incompleteMetricData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByText('1,000')).toBeInTheDocument()
    })

    it('handles zero values in metric calculation', () => {
      const zeroData = [
        { value: 0, previousValue: 0 }
      ]
      const config = { ...defaultConfig, type: 'metric' as const }
      
      render(
        <CustomWidget 
          config={config} 
          data={zeroData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        name: `Item ${i}`,
        value: Math.random() * 1000
      }))
      
      const startTime = performance.now()
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={largeData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
        />
      )
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should render within 1 second
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper button accessibility', () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      const buttons = screen.getAllByTestId('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      render(
        <CustomWidget 
          config={defaultConfig} 
          data={mockChartData} 
          onUpdate={mockOnUpdate} 
          onRemove={mockOnRemove} 
          isEditing={true}
        />
      )
      
      const settingsButton = screen.getAllByTestId('button')[0]
      settingsButton.focus()
      
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('Title')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles rendering errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Force an error by passing invalid data
      const invalidData = 'invalid' as any
      
      expect(() => {
        render(
          <CustomWidget 
            config={defaultConfig} 
            data={invalidData} 
            onUpdate={mockOnUpdate} 
            onRemove={mockOnRemove} 
          />
        )
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})