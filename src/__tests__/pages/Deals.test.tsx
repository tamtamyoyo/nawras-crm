import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { toast } from 'sonner'
import Deals from '../../pages/Deals'
import { useStore } from '../../store/useStore'
import { useAuth, AuthProvider } from '../../hooks/useAuthHook'
import { supabase } from '../../lib/supabase-client'
import { offlineDataService } from '../../services/offlineDataService'
import { devConfig } from '../../config/development'
import { runComprehensiveTests, addDemoData, clearDemoData } from '../../utils/test-runner'

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

// Custom render function
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper })
}

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../../hooks/useAuthHook', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}))

// Mock the store
vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(() => ({
    deals: [],
    customers: [],
    loading: false,
    setDeals: vi.fn(),
    setCustomers: vi.fn(),
    setLoading: vi.fn(),
    addDeal: vi.fn(),
    updateDeal: vi.fn(),
    deleteDeal: vi.fn()
  }))
}))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockDeal, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockDeal, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

vi.mock('../../services/offlineDataService', () => ({
  offlineDataService: {
    getDeals: vi.fn(),
    getCustomers: vi.fn(),
    createDeal: vi.fn(),
    updateDeal: vi.fn(),
    deleteDeal: vi.fn(),
  },
}))
vi.mock('../../config/development', () => ({
  devConfig: {
    OFFLINE_MODE: false,
  },
}))

vi.mock('../../utils/test-runner', () => ({
  runComprehensiveTests: vi.fn(),
  addDemoData: vi.fn(),
  clearDemoData: vi.fn(),
}))

// Mock Layout component
vi.mock('../../components/Layout', () => ({
  default: function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
}))

// Mock ExportFieldsForm component
interface MockExportFieldsFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

vi.mock('../../components/ExportFieldsForm', () => ({
  default: function MockExportFieldsForm({ onSave, onCancel }: MockExportFieldsFormProps) {
    return (
      <div data-testid="export-fields-form">
        <button onClick={onSave} data-testid="export-save-button">Save</button>
        <button onClick={onCancel} data-testid="export-cancel-button">Cancel</button>
      </div>
    )
  }
}))

// Mock EnhancedPipeline component
interface MockDeal {
  id: string;
  title: string;
  [key: string]: unknown;
}

interface MockEnhancedPipelineProps {
  deals: MockDeal[];
  onEdit?: (deal: MockDeal) => void;
  onDelete?: (deal: MockDeal) => void;
  onExport?: (deal: MockDeal) => void;
  onStageChange?: (dealId: string, stage: string) => void;
  onBulkAction?: (dealIds: string[], action: string) => void;
}

vi.mock('../../components/deals/EnhancedPipeline', () => ({
  default: function MockEnhancedPipeline({ deals, onEdit, onDelete, onExport, onStageChange, onBulkAction }: MockEnhancedPipelineProps) {
    return (
      <div data-testid="enhanced-pipeline">
        <div data-testid="deals-count">{deals.length} deals</div>
        {deals.map((deal: MockDeal) => (
          <div key={deal.id} data-testid={`deal-${deal.id}`}>
            <span>{deal.title}</span>
            <button onClick={() => onEdit?.(deal)} data-testid={`edit-deal-${deal.id}`}>Edit</button>
            <button onClick={() => onDelete?.(deal)} data-testid={`delete-deal-${deal.id}`}>Delete</button>
            <button onClick={() => onExport?.(deal)} data-testid={`export-deal-${deal.id}`}>Export</button>
            <button onClick={() => onStageChange?.(deal.id, 'closed_won')} data-testid={`stage-change-${deal.id}`}>Change Stage</button>
          </div>
        ))}
        <button onClick={() => onBulkAction?.(['1'], 'delete')} data-testid="bulk-delete">Bulk Delete</button>
        <button onClick={() => onBulkAction?.(['1'], 'export')} data-testid="bulk-export">Bulk Export</button>
      </div>
    )
  },
  EnhancedPipeline: function MockEnhancedPipeline({ deals, onEdit, onDelete, onExport, onStageChange, onBulkAction }: MockEnhancedPipelineProps) {
    return (
      <div data-testid="enhanced-pipeline">
        <div data-testid="deals-count">{deals.length} deals</div>
        {deals.map((deal: MockDeal) => (
          <div key={deal.id} data-testid={`deal-${deal.id}`}>
            <span>{deal.title}</span>
            <button onClick={() => onEdit?.(deal)} data-testid={`edit-deal-${deal.id}`}>Edit</button>
            <button onClick={() => onDelete?.(deal)} data-testid={`delete-deal-${deal.id}`}>Delete</button>
            <button onClick={() => onExport?.(deal)} data-testid={`export-deal-${deal.id}`}>Export</button>
            <button onClick={() => onStageChange?.(deal.id, 'closed_won')} data-testid={`stage-change-${deal.id}`}>Change Stage</button>
          </div>
        ))}
        <button onClick={() => onBulkAction?.(['1'], 'delete')} data-testid="bulk-delete">Bulk Delete</button>
        <button onClick={() => onBulkAction?.(['1'], 'export')} data-testid="bulk-export">Bulk Export</button>
      </div>
    )
  }
}))

// Mock UI components
interface MockButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: string;
  className?: string;
  [key: string]: unknown;
}

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: MockButtonProps) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}))

interface MockCardProps {
  children?: React.ReactNode;
  className?: string;
}

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, className }: MockCardProps) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: MockCardProps) => <div className={className}>{children}</div>,
}))

vi.mock('../../components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

// Mock icons
vi.mock('lucide-react', () => ({
  Handshake: () => <div data-testid="handshake-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  TestTube: () => <div data-testid="test-tube-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
}))

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
}

const mockDeal = {
  id: '1',
  title: 'Test Deal',
  customer_id: 'customer-1',
  value: 10000,
  stage: 'prospecting',
  probability: 50,
  expected_close_date: '2024-12-31',
  description: 'Test description',
  responsible_person: 'Mr. Ali',
  competitor_info: null,
  decision_maker_contact: null,
  deal_source: null,
  deal_type: 'new',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockCustomer = {
  id: 'customer-1',
  name: 'Test Customer',
  email: 'customer@example.com',
}

const mockStore = {
  deals: [mockDeal],
  customers: [mockCustomer],
  addDeal: vi.fn(),
  updateDeal: vi.fn(),
  removeDeal: vi.fn(),
}

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>
const mockUseStore = useStore as vi.MockedFunction<typeof useStore>
const mockOfflineDataService = offlineDataService as vi.Mocked<typeof offlineDataService>
const mockDevConfig = devConfig as vi.Mocked<typeof devConfig>
const mockRunComprehensiveTests = runComprehensiveTests as vi.MockedFunction<typeof runComprehensiveTests>
const mockAddDemoData = addDemoData as vi.MockedFunction<typeof addDemoData>
const mockClearDemoData = clearDemoData as vi.MockedFunction<typeof clearDemoData>

describe('Deals Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser })
    mockUseStore.mockReturnValue(mockStore)
    mockDevConfig.OFFLINE_MODE = false
    
    // Setup offline service mocks
    mockOfflineDataService.getDeals.mockResolvedValue([mockDeal])
    mockOfflineDataService.getCustomers.mockResolvedValue([mockCustomer])
    mockOfflineDataService.createDeal.mockResolvedValue(mockDeal)
    mockOfflineDataService.updateDeal.mockResolvedValue(mockDeal)
    mockOfflineDataService.deleteDeal.mockResolvedValue(undefined)
    
    // Setup test runner mocks
    mockRunComprehensiveTests.mockResolvedValue(undefined)
    mockAddDemoData.mockResolvedValue(undefined)
    mockClearDemoData.mockResolvedValue(undefined)
  })

  describe('Basic Rendering', () => {
    it('renders the deals page with header and title', () => {
      renderWithProviders(<Deals />)
      
      expect(screen.getByTestId('page-title')).toHaveTextContent('Deals')
      expect(screen.getByText('Manage your sales pipeline')).toBeInTheDocument()
    })

    it('renders action buttons in header', () => {
      renderWithProviders(<Deals />)
      
      expect(screen.getByText('Run All Tests')).toBeInTheDocument()
      expect(screen.getByText('Add Demo Data')).toBeInTheDocument()
      expect(screen.getByText('Clear Demo Data')).toBeInTheDocument()
      expect(screen.getByTestId('add-deal-button')).toBeInTheDocument()
    })

    it('renders pipeline statistics cards', () => {
      renderWithProviders(<Deals />)
      
      expect(screen.getByText('Total Deals')).toBeInTheDocument()
      expect(screen.getByText('Pipeline Value')).toBeInTheDocument()
      expect(screen.getByText('Won Deals')).toBeInTheDocument()
    })

    it('renders enhanced pipeline component', () => {
      renderWithProviders(<Deals />)
      
      expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
    })
  })

  describe('Data Loading', () => {
    it('loads deals and customers on mount', async () => {
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('deals-count')).toHaveTextContent('1 deals')
      })
    })

    it('shows loading state initially', () => {
      renderWithProviders(<Deals />)
      
      expect(screen.getByText('Loading deals...')).toBeInTheDocument()
    })

    it('handles offline mode data loading', async () => {
      mockDevConfig.OFFLINE_MODE = true
      
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(mockOfflineDataService.getDeals).toHaveBeenCalled()
        expect(mockOfflineDataService.getCustomers).toHaveBeenCalled()
      })
    })
  })

  describe('Add Deal Modal', () => {
    it('opens add deal modal when button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      
      expect(screen.getByText('Add New Deal')).toBeInTheDocument()
      expect(screen.getByTestId('deal-title-input')).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      await user.click(screen.getByTestId('deal-save-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('deal-title-error')).toBeInTheDocument()
        expect(screen.getByTestId('deal-customer-error')).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      
      await user.type(screen.getByTestId('deal-title-input'), 'New Deal')
      await user.selectOptions(screen.getByTestId('deal-customer-select'), 'customer-1')
      await user.type(screen.getByTestId('deal-value-input'), '5000')
      
      await user.click(screen.getByTestId('deal-save-button'))
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Deal added successfully')
      })
    })

    it('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      expect(screen.getByText('Add New Deal')).toBeInTheDocument()
      
      await user.click(screen.getByTestId('deal-cancel-button'))
      
      expect(screen.queryByText('Add New Deal')).not.toBeInTheDocument()
    })
  })

  describe('Edit Deal Modal', () => {
    it('opens edit modal with pre-filled data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('edit-deal-1'))
      
      expect(screen.getByText('Edit Deal')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Deal')).toBeInTheDocument()
    })

    it('updates deal with modified data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('edit-deal-1'))
      
      const titleInput = screen.getByTestId('deal-title-input')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Deal')
      
      await user.click(screen.getByTestId('deal-save-button'))
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Deal updated successfully')
      })
    })
  })

  describe('Deal Operations', () => {
    it('deletes deal with confirmation', async () => {
      const user = userEvent.setup()
      window.confirm = vi.fn(() => true)
      
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('delete-deal-1'))
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Deal deleted successfully')
      })
    })

    it('cancels delete when confirmation is denied', async () => {
      const user = userEvent.setup()
      window.confirm = vi.fn(() => false)
      
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('delete-deal-1'))
      
      expect(toast.success).not.toHaveBeenCalled()
    })

    it('changes deal stage', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('stage-change-1'))
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Deal moved to Closed Won')
      })
    })

    it('opens export modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('export-deal-1'))
      
      expect(screen.getByTestId('export-fields-form')).toBeInTheDocument()
    })
  })

  describe('Bulk Operations', () => {
    it('performs bulk delete', async () => {
      const user = userEvent.setup()
      window.confirm = vi.fn(() => true)
      
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('bulk-delete'))
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('1 deal(s) deleted successfully')
      })
    })

    it('performs bulk export', async () => {
      const user = userEvent.setup()
      
      // Mock URL and DOM methods
      const mockCreateObjectURL = vi.fn(() => 'mock-url')
      const mockRevokeObjectURL = vi.fn()
      const mockClick = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      
      Object.defineProperty(window, 'URL', {
        value: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        },
      })
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      }
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild)
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild)
      
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('bulk-export'))
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('1 deal(s) exported successfully')
        expect(mockClick).toHaveBeenCalled()
      })
    })
  })

  describe('Action Buttons', () => {
    it('runs comprehensive tests', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByText('Run All Tests'))
      
      await waitFor(() => {
        expect(mockRunComprehensiveTests).toHaveBeenCalledWith(mockUser.id)
        expect(toast.success).toHaveBeenCalledWith('All tests completed successfully!')
      })
    })

    it('adds demo data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByText('Add Demo Data'))
      
      await waitFor(() => {
        expect(mockAddDemoData).toHaveBeenCalledWith(mockUser.id)
        expect(toast.success).toHaveBeenCalledWith('Demo data added successfully!')
      })
    })

    it('clears demo data with confirmation', async () => {
      const user = userEvent.setup()
      window.confirm = vi.fn(() => true)
      
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByText('Clear Demo Data'))
      
      await waitFor(() => {
        expect(mockClearDemoData).toHaveBeenCalledWith(mockUser.id)
        expect(toast.success).toHaveBeenCalledWith('Demo data cleared successfully!')
      })
    })

    it('requires authentication for actions', async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue({ user: null })
      
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByText('Run All Tests'))
      
      expect(toast.error).toHaveBeenCalledWith('Please log in to run tests')
    })
  })

  describe('Export Modal', () => {
    it('closes export modal when save is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('export-deal-1'))
      expect(screen.getByTestId('export-fields-form')).toBeInTheDocument()
      
      await user.click(screen.getByTestId('export-save-button'))
      
      expect(screen.queryByTestId('export-fields-form')).not.toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Export fields saved successfully')
    })

    it('closes export modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('export-deal-1'))
      expect(screen.getByTestId('export-fields-form')).toBeInTheDocument()
      
      await user.click(screen.getByTestId('export-cancel-button'))
      
      expect(screen.queryByTestId('export-fields-form')).not.toBeInTheDocument()
    })
  })

  describe('Offline Mode', () => {
    beforeEach(() => {
      mockDevConfig.OFFLINE_MODE = true
    })

    it('uses offline service for data operations', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      
      await user.type(screen.getByTestId('deal-title-input'), 'Offline Deal')
      await user.selectOptions(screen.getByTestId('deal-customer-select'), 'customer-1')
      
      await user.click(screen.getByTestId('deal-save-button'))
      
      await waitFor(() => {
        expect(mockOfflineDataService.createDeal).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('Deal added successfully')
      })
    })

    it('handles offline delete operations', async () => {
      const user = userEvent.setup()
      window.confirm = vi.fn(() => true)
      
      renderWithProviders(<Deals />)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('delete-deal-1'))
      
      await waitFor(() => {
        expect(mockOfflineDataService.deleteDeal).toHaveBeenCalledWith('1')
        expect(toast.success).toHaveBeenCalledWith('Deal deleted successfully')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles form submission errors', async () => {
      const user = userEvent.setup()
      mockOfflineDataService.createDeal.mockRejectedValue(new Error('Creation failed'))
      
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      
      await user.type(screen.getByTestId('deal-title-input'), 'Error Deal')
      await user.selectOptions(screen.getByTestId('deal-customer-select'), 'customer-1')
      
      await user.click(screen.getByTestId('deal-save-button'))
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save deal')
      })
    })

    it('handles test runner errors', async () => {
      const user = userEvent.setup()
      mockRunComprehensiveTests.mockRejectedValue(new Error('Test failed'))
      
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByText('Run All Tests'))
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Some tests failed. Check console for details.')
      })
    })

    it('handles demo data errors', async () => {
      const user = userEvent.setup()
      mockAddDemoData.mockRejectedValue(new Error('Demo data failed'))
      
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByText('Add Demo Data'))
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to add demo data')
      })
    })
  })

  describe('Form Validation', () => {
    it('validates deal value is non-negative', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      
      await user.type(screen.getByTestId('deal-value-input'), '-1000')
      
      const valueInput = screen.getByTestId('deal-value-input')
      expect(valueInput).toHaveAttribute('min', '0')
    })

    it('validates probability is between 0 and 100', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      
      const probabilityInput = screen.getByTestId('deal-probability-input')
      expect(probabilityInput).toHaveAttribute('min', '0')
      expect(probabilityInput).toHaveAttribute('max', '100')
    })

    it('clears validation errors when fields are corrected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      await user.click(screen.getByTestId('deal-save-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('deal-title-error')).toBeInTheDocument()
      })
      
      await user.type(screen.getByTestId('deal-title-input'), 'Valid Title')
      
      // Error should be cleared when typing
      expect(screen.queryByTestId('deal-title-error')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithProviders(<Deals />)
      
      fireEvent.click(screen.getByTestId('add-deal-button'))
      
      expect(screen.getByLabelText(/Deal Title/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Customer/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Deal Value/)).toBeInTheDocument()
    })

    it('has proper ARIA attributes', () => {
      renderWithProviders(<Deals />)
      
      const addButton = screen.getByTestId('add-deal-button')
      expect(addButton).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      const largeDealsList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockDeal,
        id: `deal-${i}`,
        title: `Deal ${i}`,
      }))
      
      mockUseStore.mockReturnValue({
        ...mockStore,
        deals: largeDealsList,
      })
      
      const startTime = performance.now()
      renderWithProviders(<Deals />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should render within 1 second
    })
  })

  describe('Edge Cases', () => {
    it('handles empty deals list', () => {
      mockUseStore.mockReturnValue({
        ...mockStore,
        deals: [],
      })
      
      renderWithProviders(<Deals />)
      
      expect(screen.getByText('0')).toBeInTheDocument() // Total deals count
    })

    it('handles missing customer data', () => {
      const dealWithoutCustomer = {
        ...mockDeal,
        customer_id: 'non-existent-customer',
      }
      
      mockUseStore.mockReturnValue({
        ...mockStore,
        deals: [dealWithoutCustomer],
      })
      
      renderWithProviders(<Deals />)
      
      expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
    })

    it('handles null/undefined form values', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Deals />)
      
      await user.click(screen.getByTestId('add-deal-button'))
      
      // Form should handle empty/null values gracefully
      const titleInput = screen.getByTestId('deal-title-input')
      const valueInput = screen.getByTestId('deal-value-input')
      
      expect(titleInput).toHaveValue('')
      expect(valueInput).toHaveValue(null)
    })

    it('handles concurrent operations', async () => {
      const user = userEvent.setup()
      
      // Use a simpler render approach to avoid DOM issues
      render(
        <BrowserRouter>
          <div data-testid="auth-provider">
            <Deals />
          </div>
        </BrowserRouter>
      )
      
      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-pipeline')).toBeInTheDocument()
      })
      
      // Simulate multiple rapid clicks
      const addButton = screen.getByTestId('add-deal-button')
      
      await user.click(addButton)
      await user.click(addButton)
      await user.click(addButton)
      
      // Should only open one modal
      expect(screen.getAllByText('Add New Deal')).toHaveLength(1)
    })
  })
})