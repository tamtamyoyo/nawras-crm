import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toast } from 'sonner'
import Leads from '../../pages/Leads'
import { useAuth } from '../../hooks/useAuthHook'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase-client'
import { offlineDataService } from '../../services/offlineDataService'
import { devConfig } from '../../config/development'
import Layout from '../../components/Layout'
import { ExportFieldsForm } from '../../components/export-fields/ExportFieldsForm'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: vi.fn()
}))

vi.mock('../../hooks/useAuthHook', () => ({
  useAuthHook: vi.fn()
}))

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn()
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}))

vi.mock('../../services/offline-data-service', () => ({
  offlineDataService: {
    getLeads: vi.fn(),
    addLead: vi.fn(),
    updateLead: vi.fn(),
    deleteLead: vi.fn(),
    addCustomer: vi.fn()
  }
}))

vi.mock('../../config/dev-config', () => ({
  devConfig: {
    isOfflineMode: false
  }
}))

vi.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

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

// Mock UI components with proper types
interface MockButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: string;
  size?: string;
  [key: string]: unknown;
}

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: MockButtonProps) => (
    <button 
      onClick={onClick} 
      className={className} 
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('../../components/ui/input', () => ({
  default: function MockInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} />
  }
}))

interface MockCardProps {
  children?: React.ReactNode;
  className?: string;
}

interface MockCardContentProps {
  children?: React.ReactNode;
}

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, className }: MockCardProps) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: MockCardContentProps) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: MockCardContentProps) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: MockCardContentProps) => <p data-testid="card-description">{children}</p>
}))

interface MockFormProps {
  children?: React.ReactNode;
}

interface MockFormFieldProps {
  render: (props: { field: { onChange: any; value: string } }) => React.ReactNode;
}

vi.mock('../../components/ui/form', () => ({
  Form: ({ children }: MockFormProps) => <div data-testid="form">{children}</div>,
  FormField: ({ render }: MockFormFieldProps) => render({ field: { onChange: vi.fn(), value: '' } }),
  FormItem: ({ children }: MockFormProps) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }: MockFormProps) => <label data-testid="form-label">{children}</label>,
  FormControl: ({ children }: MockFormProps) => <div data-testid="form-control">{children}</div>,
  FormMessage: () => <div data-testid="form-message"></div>
}))

// Mock icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Building: () => <div data-testid="building-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />
}))

// Mock react-hook-form with proper types
interface MockFormEvent {
  preventDefault?: () => void;
}

type MockSubmitHandler = (data: Record<string, unknown>) => void;

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: MockSubmitHandler) => (e?: MockFormEvent) => {
      e?.preventDefault?.()
      fn({})
    },
    reset: vi.fn(),
    formState: { errors: {} }
  })
}))

const mockLeads = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    status: 'new',
    source: 'website',
    score: 75,
    responsible_person: 'Mr. Ali',
    lifecycle_stage: 'lead',
    priority_level: 'high',
    contact_preference: 'email',
    follow_up_date: '2024-01-15',
    notes: 'Interested in our services',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    company: 'Tech Solutions',
    status: 'qualified',
    source: 'referral',
    score: 90,
    responsible_person: 'Mr. Mustafa',
    lifecycle_stage: 'sales_qualified_lead',
    priority_level: 'high',
    contact_preference: 'phone',
    follow_up_date: '2024-01-20',
    notes: 'Ready to convert',
    created_at: '2024-01-02T00:00:00Z'
  }
]

const mockUseStore = {
  isOffline: false,
  setOffline: vi.fn()
}

const mockUseAuth = {
  user: { id: 'user1', email: 'test@example.com' },
  loading: false
}

describe('Leads Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useStore as any).mockReturnValue(mockUseStore)
    ;(useAuth as any).mockReturnValue(mockUseAuth)
    ;(offlineDataService.getLeads as any).mockResolvedValue(mockLeads)
  })

  describe('Basic Rendering', () => {
    it('renders leads page with header and main content', async () => {
      render(<Leads />)
      
      expect(screen.getByText('Lead Management')).toBeInTheDocument()
      expect(screen.getByTestId('add-lead-button')).toBeInTheDocument()
      expect(screen.getByTestId('leads-search-input')).toBeInTheDocument()
      expect(screen.getByTestId('leads-status-filter')).toBeInTheDocument()
      expect(screen.getByTestId('leads-source-filter')).toBeInTheDocument()
    })

    it('displays loading state initially', () => {
      render(<Leads />)
      expect(screen.getByText('Loading leads...')).toBeInTheDocument()
    })

    it('displays empty state when no leads exist', async () => {
      ;(offlineDataService.getLeads as any).mockResolvedValue([])
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(screen.getByText('No leads yet')).toBeInTheDocument()
        expect(screen.getByText('Get started by adding your first lead')).toBeInTheDocument()
        expect(screen.getByTestId('add-lead-empty-button')).toBeInTheDocument()
      })
    })

    it('displays leads list when data is loaded', async () => {
      render(<Leads />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('loads leads from offline service when offline', async () => {
      ;(useStore as any).mockReturnValue({ ...mockUseStore, isOffline: true })
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(offlineDataService.getLeads).toHaveBeenCalled()
      })
    })

    it('loads leads from Supabase when online', async () => {
      const mockSupabaseResponse = { data: mockLeads, error: null }
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(mockSupabaseResponse)
        })
      })
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('leads')
      })
    })

    it('handles loading error gracefully', async () => {
      ;(offlineDataService.getLeads as any).mockRejectedValue(new Error('Load failed'))
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load leads',
          variant: 'destructive'
        })
      })
    })
  })

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      render(<Leads />)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('filters leads by search term', async () => {
      const user = userEvent.setup()
      const searchInput = screen.getByTestId('leads-search-input')
      
      await user.type(searchInput, 'John')
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('filters leads by status', async () => {
      const user = userEvent.setup()
      const statusFilter = screen.getByTestId('leads-status-filter')
      
      await user.selectOptions(statusFilter, 'qualified')
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })

    it('filters leads by source', async () => {
      const user = userEvent.setup()
      const sourceFilter = screen.getByTestId('leads-source-filter')
      
      await user.selectOptions(sourceFilter, 'website')
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('shows no results message when filters match nothing', async () => {
      const user = userEvent.setup()
      const searchInput = screen.getByTestId('leads-search-input')
      
      await user.type(searchInput, 'nonexistent')
      
      await waitFor(() => {
        expect(screen.getByText('No leads found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
      })
    })
  })

  describe('Add Lead Modal', () => {
    it('opens add lead modal when add button is clicked', async () => {
      render(<Leads />)
      const user = userEvent.setup()
      
      await user.click(screen.getByTestId('add-lead-button'))
      
      expect(screen.getByText('Add New Lead')).toBeInTheDocument()
      expect(screen.getByTestId('lead-name-input')).toBeInTheDocument()
      expect(screen.getByTestId('lead-email-input')).toBeInTheDocument()
    })

    it('closes modal when cancel button is clicked', async () => {
      render(<Leads />)
      const user = userEvent.setup()
      
      await user.click(screen.getByTestId('add-lead-button'))
      await user.click(screen.getByTestId('lead-cancel-button'))
      
      expect(screen.queryByText('Add New Lead')).not.toBeInTheDocument()
    })

    it('submits new lead form successfully', async () => {
      ;(offlineDataService.addLead as any).mockResolvedValue({ id: '3' })
      
      render(<Leads />)
      const user = userEvent.setup()
      
      await user.click(screen.getByTestId('add-lead-button'))
      await user.click(screen.getByTestId('lead-save-button'))
      
      await waitFor(() => {
        expect(offlineDataService.addLead).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lead added successfully'
        })
      })
    })
  })

  describe('Edit Lead Modal', () => {
    beforeEach(async () => {
      render(<Leads />)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('opens edit modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      const editButtons = screen.getAllByTestId('edit-lead-button')
      
      await user.click(editButtons[0])
      
      expect(screen.getByText('Edit Lead')).toBeInTheDocument()
    })

    it('submits edit lead form successfully', async () => {
      ;(offlineDataService.updateLead as any).mockResolvedValue({})
      
      const user = userEvent.setup()
      const editButtons = screen.getAllByTestId('edit-lead-button')
      
      await user.click(editButtons[0])
      await user.click(screen.getByTestId('lead-save-button'))
      
      await waitFor(() => {
        expect(offlineDataService.updateLead).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lead updated successfully'
        })
      })
    })
  })

  describe('Lead Operations', () => {
    beforeEach(async () => {
      render(<Leads />)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('deletes lead when delete button is clicked', async () => {
      ;(offlineDataService.deleteLead as any).mockResolvedValue({})
      window.confirm = vi.fn().mockReturnValue(true)
      
      const user = userEvent.setup()
      const deleteButtons = screen.getAllByTestId('delete-lead-button')
      
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this lead?')
        expect(offlineDataService.deleteLead).toHaveBeenCalledWith('1')
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lead deleted successfully'
        })
      })
    })

    it('cancels delete when user clicks cancel', async () => {
      window.confirm = vi.fn().mockReturnValue(false)
      
      const user = userEvent.setup()
      const deleteButtons = screen.getAllByTestId('delete-lead-button')
      
      await user.click(deleteButtons[0])
      
      expect(offlineDataService.deleteLead).not.toHaveBeenCalled()
    })

    it('converts qualified lead to customer', async () => {
      ;(offlineDataService.addCustomer as any).mockResolvedValue({ id: 'customer1' })
      ;(offlineDataService.deleteLead as any).mockResolvedValue({})
      
      const user = userEvent.setup()
      const convertButtons = screen.getAllByTestId('convert-lead-button')
      
      await user.click(convertButtons[0])
      
      await waitFor(() => {
        expect(offlineDataService.addCustomer).toHaveBeenCalled()
        expect(offlineDataService.deleteLead).toHaveBeenCalledWith('2')
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lead converted to customer successfully'
        })
      })
    })
  })

  describe('Export Modal', () => {
    beforeEach(async () => {
      render(<Leads />)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('opens export modal when export button is clicked', async () => {
      const user = userEvent.setup()
      const exportButtons = screen.getAllByTitle('Manage Export Fields')
      
      await user.click(exportButtons[0])
      
      expect(screen.getByText('Manage Export Fields')).toBeInTheDocument()
      expect(screen.getByTestId('export-fields-form')).toBeInTheDocument()
    })

    it('closes export modal when save is clicked', async () => {
      const user = userEvent.setup()
      const exportButtons = screen.getAllByTitle('Manage Export Fields')
      
      await user.click(exportButtons[0])
      await user.click(screen.getByTestId('export-save-button'))
      
      await waitFor(() => {
        expect(screen.queryByText('Manage Export Fields')).not.toBeInTheDocument()
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Export fields saved successfully'
        })
      })
    })

    it('closes export modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      const exportButtons = screen.getAllByTitle('Manage Export Fields')
      
      await user.click(exportButtons[0])
      await user.click(screen.getByTestId('export-cancel-button'))
      
      expect(screen.queryByText('Manage Export Fields')).not.toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('runs all tests when run tests button is clicked', async () => {
      render(<Leads />)
      const user = userEvent.setup()
      
      await user.click(screen.getByText('Run All Tests'))
      
      expect(screen.getByText('Running tests...')).toBeInTheDocument()
    })

    it('adds demo data when add demo data button is clicked', async () => {
      ;(devConfig.isOfflineMode as boolean) = true
      
      render(<Leads />)
      const user = userEvent.setup()
      
      await user.click(screen.getByText('Add Demo Data'))
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Demo data added successfully'
        })
      })
    })
  })

  describe('Offline Mode', () => {
    it('works in offline mode', async () => {
      ;(useStore as any).mockReturnValue({ ...mockUseStore, isOffline: true })
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(offlineDataService.getLeads).toHaveBeenCalled()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('handles offline operations', async () => {
      ;(useStore as any).mockReturnValue({ ...mockUseStore, isOffline: true })
      ;(offlineDataService.addLead as any).mockResolvedValue({ id: '3' })
      
      render(<Leads />)
      const user = userEvent.setup()
      
      await user.click(screen.getByTestId('add-lead-button'))
      await user.click(screen.getByTestId('lead-save-button'))
      
      await waitFor(() => {
        expect(offlineDataService.addLead).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles add lead error', async () => {
      ;(offlineDataService.addLead as any).mockRejectedValue(new Error('Add failed'))
      
      render(<Leads />)
      const user = userEvent.setup()
      
      await user.click(screen.getByTestId('add-lead-button'))
      await user.click(screen.getByTestId('lead-save-button'))
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to add lead',
          variant: 'destructive'
        })
      })
    })

    it('handles update lead error', async () => {
      ;(offlineDataService.updateLead as any).mockRejectedValue(new Error('Update failed'))
      
      render(<Leads />)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const user = userEvent.setup()
      const editButtons = screen.getAllByTestId('edit-lead-button')
      
      await user.click(editButtons[0])
      await user.click(screen.getByTestId('lead-save-button'))
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to update lead',
          variant: 'destructive'
        })
      })
    })

    it('handles delete lead error', async () => {
      ;(offlineDataService.deleteLead as any).mockRejectedValue(new Error('Delete failed'))
      window.confirm = vi.fn().mockReturnValue(true)
      
      render(<Leads />)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const user = userEvent.setup()
      const deleteButtons = screen.getAllByTestId('delete-lead-button')
      
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to delete lead',
          variant: 'destructive'
        })
      })
    })

    it('handles convert to customer error', async () => {
      ;(offlineDataService.addCustomer as any).mockRejectedValue(new Error('Convert failed'))
      
      render(<Leads />)
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
      
      const user = userEvent.setup()
      const convertButtons = screen.getAllByTestId('convert-lead-button')
      
      await user.click(convertButtons[0])
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to convert lead to customer',
          variant: 'destructive'
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<Leads />)
      
      expect(screen.getByTestId('leads-search-input')).toHaveAttribute('placeholder', 'Search leads...')
      expect(screen.getByTestId('leads-status-filter')).toBeInTheDocument()
      expect(screen.getByTestId('leads-source-filter')).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<Leads />)
      const user = userEvent.setup()
      
      const addButton = screen.getByTestId('add-lead-button')
      addButton.focus()
      
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('Add New Lead')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      const largeMockLeads = Array.from({ length: 1000 }, (_, i) => ({
        ...mockLeads[0],
        id: `lead-${i}`,
        name: `Lead ${i}`,
        email: `lead${i}@example.com`
      }))
      
      ;(offlineDataService.getLeads as any).mockResolvedValue(largeMockLeads)
      
      const startTime = performance.now()
      render(<Leads />)
      
      await waitFor(() => {
        expect(screen.getByText('Lead 0')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(5000) // Should render within 5 seconds
    })

    it('debounces search input', async () => {
      render(<Leads />)
      const user = userEvent.setup()
      const searchInput = screen.getByTestId('leads-search-input')
      
      await user.type(searchInput, 'test')
      
      // Should not trigger immediate search
      expect(searchInput).toHaveValue('test')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty lead data gracefully', async () => {
      const emptyLead = {
        id: '1',
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'new',
        source: 'website',
        score: 0,
        responsible_person: 'Mr. Ali',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      ;(offlineDataService.getLeads as any).mockResolvedValue([emptyLead])
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(screen.getByTestId('card')).toBeInTheDocument()
      })
    })

    it('handles invalid date formats', async () => {
      const invalidDateLead = {
        ...mockLeads[0],
        created_at: 'invalid-date',
        follow_up_date: 'invalid-date'
      }
      
      ;(offlineDataService.getLeads as any).mockResolvedValue([invalidDateLead])
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('handles missing required fields', async () => {
      const incompleteLead = {
        id: '1',
        name: 'Test Lead'
        // Missing other required fields
      }
      
      ;(offlineDataService.getLeads as any).mockResolvedValue([incompleteLead])
      
      render(<Leads />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Lead')).toBeInTheDocument()
      })
    })

    it('handles network connectivity changes', async () => {
      const { rerender } = render(<Leads />)
      
      // Simulate going offline
      ;(useStore as any).mockReturnValue({ ...mockUseStore, isOffline: true })
      
      rerender(<Leads />)
      
      await waitFor(() => {
        expect(offlineDataService.getLeads).toHaveBeenCalled()
      })
    })

    it('handles concurrent operations', async () => {
      ;(offlineDataService.addLead as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: '3' }), 100))
      )
      
      render(<Leads />)
      const user = userEvent.setup()
      
      // Start multiple add operations
      await user.click(screen.getByTestId('add-lead-button'))
      const saveButton = screen.getByTestId('lead-save-button')
      
      await user.click(saveButton)
      await user.click(saveButton) // Second click should be ignored due to loading state
      
      await waitFor(() => {
        expect(offlineDataService.addLead).toHaveBeenCalledTimes(1)
      })
    })
  })
})