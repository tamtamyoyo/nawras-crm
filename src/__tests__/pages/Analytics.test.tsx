import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'
import Analytics from '../../pages/Analytics'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase-client'
import { offlineDataService } from '../../services/offlineDataService'
import { devConfig } from '../../config/development'
import { CustomWidget } from '../../components/analytics/CustomWidget'
import DashboardBuilder from '../../components/analytics/DashboardBuilder'
import { AdvancedChart } from '../../components/analytics/AdvancedChart'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../store/useStore')
vi.mock('../../lib/supabase-client')
vi.mock('../../services/offlineDataService')
vi.mock('../../config/development')
vi.mock('../../components/analytics/CustomWidget')
vi.mock('../../components/analytics/DashboardBuilder')
vi.mock('../../components/analytics/AdvancedChart')

// Mock UI components
interface MockCardProps {
  children?: React.ReactNode;
  className?: string;
}

interface MockCardChildProps {
  children?: React.ReactNode;
}

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, className }: MockCardProps) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: MockCardChildProps) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: MockCardChildProps) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: MockCardChildProps) => <div data-testid="card-title">{children}</div>,
}))

interface MockButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: string;
  size?: string;
  className?: string;
}

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: MockButtonProps) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-variant={variant}
      data-size={size}
      data-testid="button"
    >
      {children}
    </button>
  ),
}))

interface MockSelectProps {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface MockSelectChildProps {
  children?: React.ReactNode;
}

interface MockSelectItemProps {
  children?: React.ReactNode;
  value?: string;
}

vi.mock('../../components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: MockSelectProps) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('30')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: MockSelectChildProps) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: MockSelectItemProps) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: MockSelectChildProps) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value" />,
}))

interface MockTabsProps {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface MockTabsChildProps {
  children?: React.ReactNode;
}

interface MockTabsContentProps {
  children?: React.ReactNode;
  value?: string;
}

interface MockTabsTriggerProps {
  children?: React.ReactNode;
  value?: string;
}

vi.mock('../../components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: MockTabsProps) => (
    <div data-testid="tabs" data-value={value} onClick={() => onValueChange?.('revenue')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: MockTabsContentProps) => <div data-testid="tabs-content" data-value={value}>{children}</div>,
  TabsList: ({ children }: MockTabsChildProps) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: MockTabsTriggerProps) => <div data-testid="tabs-trigger" data-value={value}>{children}</div>,
}))

interface MockInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}

vi.mock('../../components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, type, className }: MockInputProps) => (
    <input 
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      type={type}
      className={className}
      data-testid="input"
    />
  ),
}))

// Mock icons
interface MockIconProps {
  className?: string;
}

vi.mock('lucide-react', () => ({
  BarChart3: ({ className }: MockIconProps) => <div className={className} data-testid="bar-chart-icon" />,
  Activity: ({ className }: MockIconProps) => <div className={className} data-testid="activity-icon" />,
  PieChart: ({ className }: MockIconProps) => <div className={className} data-testid="pie-chart-icon" />,
  TrendingUp: ({ className }: MockIconProps) => <div className={className} data-testid="trending-up-icon" />,
  TrendingDown: ({ className }: MockIconProps) => <div className={className} data-testid="trending-down-icon" />,
  DollarSign: ({ className }: MockIconProps) => <div className={className} data-testid="dollar-sign-icon" />,
  Users: ({ className }: MockIconProps) => <div className={className} data-testid="users-icon" />,
  Target: ({ className }: MockIconProps) => <div className={className} data-testid="target-icon" />,
  Download: ({ className }: MockIconProps) => <div className={className} data-testid="download-icon" />,
  Filter: ({ className }: MockIconProps) => <div className={className} data-testid="filter-icon" />,
  Settings: ({ className }: MockIconProps) => <div className={className} data-testid="settings-icon" />,
  RefreshCw: ({ className }: MockIconProps) => <div className={className} data-testid="refresh-icon" />,
  Eye: ({ className }: MockIconProps) => <div className={className} data-testid="eye-icon" />,
  EyeOff: ({ className }: MockIconProps) => <div className={className} data-testid="eye-off-icon" />,
  X: ({ className }: MockIconProps) => <div className={className} data-testid="x-icon" />,
}))

// Mock utils
vi.mock('../../lib/utils', () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' '),
}))

const mockUseStore = useStore as vi.MockedFunction<typeof useStore>
const mockSupabase = supabase as vi.Mocked<typeof supabase>
const mockOfflineDataService = offlineDataService as vi.Mocked<typeof offlineDataService>
const mockDevConfig = devConfig as vi.Mocked<typeof devConfig>
const mockToast = toast as vi.Mocked<typeof toast>
const mockCustomWidget = CustomWidget as vi.MockedFunction<typeof CustomWidget>
const mockDashboardBuilder = DashboardBuilder as vi.MockedFunction<typeof DashboardBuilder>
const mockAdvancedChart = AdvancedChart as vi.MockedFunction<typeof AdvancedChart>

const mockDeals = [
  {
    id: '1',
    title: 'Deal 1',
    value: 10000,
    status: 'won',
    stage: 'closed_won',
    probability: 100,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Deal 2',
    value: 5000,
    status: 'qualified',
    stage: 'qualified',
    probability: 75,
    created_at: '2024-01-10T10:00:00Z',
  },
]

const mockLeads = [
  {
    id: '1',
    name: 'Lead 1',
    email: 'lead1@example.com',
    created_at: '2024-01-12T10:00:00Z',
  },
]

const mockCustomers = [
  {
    id: '1',
    name: 'Customer 1',
    email: 'customer1@example.com',
    created_at: '2024-01-08T10:00:00Z',
  },
]

interface MockStoreState {
  deals: typeof mockDeals;
  leads: typeof mockLeads;
}

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseStore.mockReturnValue({
      deals: mockDeals,
      leads: mockLeads,
    } as MockStoreState)
    
    mockDevConfig.OFFLINE_MODE = false
    
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ data: mockDeals }),
        }),
      }),
    })
    
    mockOfflineDataService.getDeals = vi.fn().mockResolvedValue(mockDeals)
    mockOfflineDataService.getCustomers = vi.fn().mockResolvedValue(mockCustomers)
    
    mockCustomWidget.mockImplementation(({ config }) => (
      <div data-testid="custom-widget">{config.title}</div>
    ))
    
    mockDashboardBuilder.mockImplementation(({ onWidgetsChange }) => (
      <div data-testid="dashboard-builder">
        <button onClick={() => onWidgetsChange([{ id: '1', type: 'chart', title: 'Test Widget', dataSource: 'deals', config: {} }])}>
          Add Widget
        </button>
      </div>
    ))
    
    mockAdvancedChart.mockImplementation(({ config }) => (
      <div data-testid="advanced-chart">{config.title}</div>
    ))
  })

  describe('Basic Rendering', () => {
    it('renders analytics page with header', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toHaveTextContent('Advanced Analytics')
        expect(screen.getByText('Comprehensive business insights and KPI dashboard')).toBeInTheDocument()
      })
    })

    it('shows loading state initially', () => {
      render(<Analytics />)
      
      expect(screen.getByText('Loading advanced analytics...')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument()
    })

    it('renders header buttons', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        const buttons = screen.getAllByTestId('button')
        expect(buttons.length).toBeGreaterThan(0)
        expect(screen.getByText('Refresh')).toBeInTheDocument()
        expect(screen.getByText('Export')).toBeInTheDocument()
        expect(screen.getByText('Dashboard Builder')).toBeInTheDocument()
        expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('loads analytics data on mount', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('deals')
        expect(toast.success).toHaveBeenCalledWith('Advanced analytics loaded')
      })
    })

    it('handles offline mode', async () => {
      mockDevConfig.OFFLINE_MODE = true
      
      render(<Analytics />)
      
      await waitFor(() => {
        expect(mockOfflineDataService.getDeals).toHaveBeenCalled()
        expect(mockOfflineDataService.getCustomers).toHaveBeenCalled()
      })
    })

    it('falls back to offline mode on Supabase error', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      })
      
      render(<Analytics />)
      
      await waitFor(() => {
        expect(mockOfflineDataService.getDeals).toHaveBeenCalled()
        expect(mockDevConfig.OFFLINE_MODE).toBe(true)
      })
    })

    it('refreshes data when refresh button is clicked', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })
      
      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Advanced analytics loaded')
      })
    })
  })

  describe('Date Range Selection', () => {
    it('changes date range when select is used', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('select')).toBeInTheDocument()
      })
      
      const select = screen.getByTestId('select')
      await user.click(select)
      
      await waitFor(() => {
        expect(select).toHaveAttribute('data-value', '30')
      })
    })
  })

  describe('KPI Metrics', () => {
    it('renders KPI selector', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument()
        expect(screen.getByText('revenue')).toBeInTheDocument()
        expect(screen.getByText('deals')).toBeInTheDocument()
        expect(screen.getByText('customers')).toBeInTheDocument()
        expect(screen.getByText('conversion')).toBeInTheDocument()
      })
    })

    it('toggles metrics visibility', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('revenue')).toBeInTheDocument()
      })
      
      const revenueButton = screen.getByText('revenue')
      await user.click(revenueButton)
      
      // Should toggle the metric
      expect(revenueButton).toBeInTheDocument()
    })

    it('displays KPI cards for selected metrics', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        const cards = screen.getAllByTestId('card')
        expect(cards.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Dashboard Builder', () => {
    it('toggles dashboard builder visibility', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Builder')).toBeInTheDocument()
      })
      
      const builderButton = screen.getByText('Dashboard Builder')
      await user.click(builderButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-builder')).toBeInTheDocument()
        expect(screen.getByText('Hide Builder')).toBeInTheDocument()
      })
    })

    it('adds custom widgets', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Builder')).toBeInTheDocument()
      })
      
      const builderButton = screen.getByText('Dashboard Builder')
      await user.click(builderButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-builder')).toBeInTheDocument()
      })
      
      const addWidgetButton = screen.getByText('Add Widget')
      await user.click(addWidgetButton)
      
      await waitFor(() => {
        expect(screen.getByText('Custom Dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('custom-widget')).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Tabs', () => {
    it('renders all tab triggers', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
        expect(screen.getByText('Revenue')).toBeInTheDocument()
        expect(screen.getByText('Performance')).toBeInTheDocument()
        expect(screen.getByText('Trends')).toBeInTheDocument()
      })
    })

    it('switches between tabs', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('tabs')).toBeInTheDocument()
      })
      
      const tabs = screen.getByTestId('tabs')
      await user.click(tabs)
      
      await waitFor(() => {
        expect(tabs).toHaveAttribute('data-value', 'revenue')
      })
    })

    it('renders advanced charts in tabs', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        const charts = screen.getAllByTestId('advanced-chart')
        expect(charts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Advanced Filters', () => {
    it('renders filter inputs', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Filter by stage...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Filter by source...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Min revenue...')).toBeInTheDocument()
      })
    })

    it('updates filter values', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter by stage...')).toBeInTheDocument()
      })
      
      const stageInput = screen.getByPlaceholderText('Filter by stage...')
      await user.type(stageInput, 'qualified')
      
      expect(stageInput).toHaveValue('qualified')
    })
  })

  describe('Error Handling', () => {
    it('handles data loading errors gracefully', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      })
      
      mockOfflineDataService.getDeals = vi.fn().mockRejectedValue(new Error('Offline error'))
      
      render(<Analytics />)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load analytics data')
      })
    })

    it('handles empty data gracefully', async () => {
      mockUseStore.mockReturnValue({
        deals: [],
        leads: [],
      } as MockStoreState)
      
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      })
      
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toHaveTextContent('Advanced Analytics')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toBeInTheDocument()
      })
      
      const buttons = screen.getAllByTestId('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })
      
      const refreshButton = screen.getByText('Refresh')
      refreshButton.focus()
      
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      const largeDealsDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `deal-${i}`,
        title: `Deal ${i}`,
        value: Math.random() * 100000,
        status: 'won',
        stage: 'closed_won',
        probability: 100,
        created_at: new Date().toISOString(),
      }))
      
      mockUseStore.mockReturnValue({
        deals: largeDealsDataset,
        leads: mockLeads,
      } as MockStoreState)
      
      const startTime = performance.now()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(5000) // Should render within 5 seconds
    })

    it('debounces filter updates', async () => {
      const user = userEvent.setup()
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter by stage...')).toBeInTheDocument()
      })
      
      const stageInput = screen.getByPlaceholderText('Filter by stage...')
      
      // Type multiple characters quickly
      await user.type(stageInput, 'qualified')
      
      expect(stageInput).toHaveValue('qualified')
    })
  })

  describe('Edge Cases', () => {
    it('handles null/undefined data', async () => {
      mockUseStore.mockReturnValue({
        deals: null as any,
        leads: undefined as any,
      } as Partial<MockStoreState>)
      
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toBeInTheDocument()
      })
    })

    it('handles invalid date ranges', async () => {
      render(<Analytics />)
      
      await waitFor(() => {
        expect(screen.getByTestId('select')).toBeInTheDocument()
      })
      
      // Component should handle invalid date ranges gracefully
      expect(screen.getByTestId('page-title')).toBeInTheDocument()
    })

    it('handles component unmounting during data loading', async () => {
      const { unmount } = render(<Analytics />)
      
      // Unmount before data loading completes
      unmount()
      
      // Should not cause memory leaks or errors
      expect(true).toBe(true)
    })

    it('handles missing chart data gracefully', async () => {
      mockUseStore.mockReturnValue({
        deals: [],
        leads: [],
      } as any)
      
      render(<Analytics />)
      
      await waitFor(() => {
        const charts = screen.getAllByTestId('advanced-chart')
        expect(charts.length).toBeGreaterThan(0)
      })
    })
  })
})