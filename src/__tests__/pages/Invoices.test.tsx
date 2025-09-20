import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuthHook'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase-client'
import { offlineDataService } from '../../services/offlineDataService'
import { devConfig } from '../../config/development'
import { runComprehensiveTests, addDemoData } from '../../utils/test-runner'
import Layout from '../../components/Layout'
import InvoicesTable from '../../components/invoices/invoices-table'
import Invoices from '../../pages/Invoices'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({ data: [], error: null }))
        })),
        order: vi.fn(() => ({ data: [], error: null })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      }))
    }))
  }
}))

vi.mock('../../services/offline-data-service', () => ({
  offlineDataService: {
    getInvoices: vi.fn(() => Promise.resolve([])),
    getDeals: vi.fn(() => Promise.resolve([])),
    getCustomers: vi.fn(() => Promise.resolve([])),
    createInvoice: vi.fn(() => Promise.resolve()),
    updateInvoice: vi.fn(() => Promise.resolve()),
    deleteInvoice: vi.fn(() => Promise.resolve())
  }
}))

vi.mock('../../config/dev-config', () => ({
  devConfig: {
    OFFLINE_MODE: false
  }
}))

vi.mock('../../utils/test-runner', () => ({
  runComprehensiveTests: vi.fn(() => Promise.resolve()),
  addDemoData: vi.fn(() => Promise.resolve())
}))

vi.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

interface MockInvoice {
  id: string;
  invoice_number: string;
  [key: string]: unknown;
}

interface MockInvoicesTableProps {
  data: MockInvoice[];
  onView?: (invoice: MockInvoice) => void;
  onEdit?: (invoice: MockInvoice) => void;
  onDelete?: (invoice: MockInvoice) => void;
  onStatusUpdate?: (invoice: MockInvoice, status: string) => void;
}

vi.mock('../../components/invoices/invoices-table', () => ({
  default: function MockInvoicesTable({ data, onView, onEdit, onDelete, onStatusUpdate }: MockInvoicesTableProps) {
    return (
      <div data-testid="invoices-table">
        {data.map((invoice: MockInvoice) => (
          <div key={invoice.id} data-testid={`invoice-${invoice.id}`}>
            <span>{invoice.invoice_number}</span>
            <button onClick={() => onView?.(invoice)}>View</button>
            <button onClick={() => onEdit?.(invoice)}>Edit</button>
            <button onClick={() => onDelete?.(invoice)}>Delete</button>
            <button onClick={() => onStatusUpdate?.(invoice, 'paid')}>Mark Paid</button>
          </div>
        ))}
      </div>
    )
  }
}))

// Mock UI components
interface MockButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: unknown;
}

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: MockButtonProps) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size} 
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}))

interface MockCardProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, className }: MockCardProps) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-content">{children}</div>,
  CardDescription: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-description">{children}</div>,
  CardFooter: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-footer">{children}</div>,
  CardHeader: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-title">{children}</div>,
}))

interface MockDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MockDialogChildProps {
  children?: React.ReactNode;
}

vi.mock('../../components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: MockDialogProps) => 
    open ? <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>{children}</div> : null,
  DialogContent: ({ children }: MockDialogChildProps) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: MockDialogChildProps) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: MockDialogChildProps) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: MockDialogChildProps) => <p data-testid="dialog-description">{children}</p>
}))

interface MockFormProps {
  children?: React.ReactNode;
}

interface MockFormFieldProps {
  render: (props: { field: { onChange: vi.Mock; value: string } }) => React.ReactNode;
}

vi.mock('../../components/ui/form', () => ({
  Form: ({ children }: MockFormProps) => <form>{children}</form>,
  FormField: ({ render }: MockFormFieldProps) => render({ field: { onChange: vi.fn(), value: '' } }),
  FormItem: ({ children }: MockFormProps) => <div>{children}</div>,
  FormLabel: ({ children }: MockFormProps) => <label>{children}</label>,
  FormControl: ({ children }: MockFormProps) => <div>{children}</div>,
  FormMessage: () => <div data-testid="form-message"></div>
}))

interface MockInputProps {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  [key: string]: unknown;
}

vi.mock('../../components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

interface MockSelectProps {
  children?: React.ReactNode;
  onValueChange?: (value: string) => void;
  value?: string;
}

interface MockSelectChildProps {
  children?: React.ReactNode;
}

interface MockSelectItemProps {
  children?: React.ReactNode;
  value?: string;
}

interface MockSelectValueProps {
  placeholder?: string;
}

vi.mock('../../components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: MockSelectProps) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: MockSelectChildProps) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: MockSelectItemProps) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: MockSelectChildProps) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value" />,
}))

interface MockTextareaProps {
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  value?: string;
  [key: string]: unknown;
}

vi.mock('../../components/ui/textarea', () => ({
  default: function MockTextarea({ onChange, value, ...props }: MockTextareaProps) {
    return <textarea onChange={onChange} value={value} {...props} />
  }
}))

interface MockBadgeProps {
  children?: React.ReactNode;
  variant?: string;
  [key: string]: unknown;
}

vi.mock('../../components/ui/badge', () => ({
  Badge: ({ children, variant }: MockBadgeProps) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

// Mock icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
}))

// Mock react-hook-form
interface MockFormEvent {
  preventDefault: () => void;
}

interface MockControllerProps {
  render: (props: { field: { onChange: vi.Mock; value: string } }) => React.ReactNode;
}

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: (data: Record<string, unknown>) => void) => (e: MockFormEvent) => {
      e.preventDefault()
      fn({})
    },
    reset: vi.fn(),
    formState: { errors: {} }
  }),
  Controller: ({ render }: MockControllerProps) => render({ field: { onChange: vi.fn(), value: '' } })
}))

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User'
}

const mockInvoices = [
  {
    id: '1',
    invoice_number: 'INV-2024-001',
    deal_id: 'deal-1',
    amount: 1000,
    tax_amount: 100,
    total_amount: 1100,
    status: 'draft',
    payment_terms: 'net_30',
    due_date: '2024-12-31',
    notes: 'Test invoice',
    items: JSON.stringify([{ description: 'Service', quantity: 1, rate: 1000, amount: 1000 }]),
    tax_rate: 10,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
]

const mockDeals = [
  {
    id: 'deal-1',
    title: 'Test Deal',
    customer_id: 'customer-1',
    value: 1000,
    stage: 'proposal'
  }
]

const mockCustomers = [
  {
    id: 'customer-1',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '123-456-7890'
  }
]

const mockStore = {
  invoices: mockInvoices,
  deals: mockDeals,
  customers: mockCustomers,
  addInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  removeInvoice: vi.fn()
}

describe('Invoices Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthHook as any).mockReturnValue({ user: mockUser })
    ;(useStore as any).mockReturnValue(mockStore)
    ;(devConfig as any).OFFLINE_MODE = false
  })

  describe('Basic Rendering', () => {
    it('renders invoices page with header and stats', () => {
      render(<Invoices />)
      
      expect(screen.getByText('Invoices')).toBeInTheDocument()
      expect(screen.getByText('Manage invoices and payments')).toBeInTheDocument()
      expect(screen.getByText('Total Invoices')).toBeInTheDocument()
      expect(screen.getByText('Paid')).toBeInTheDocument()
      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    })

    it('displays correct stats', () => {
      render(<Invoices />)
      
      expect(screen.getByText('1')).toBeInTheDocument() // Total invoices
      expect(screen.getByText('0')).toBeInTheDocument() // Paid invoices
      expect(screen.getByText('$0')).toBeInTheDocument() // Total revenue
    })

    it('renders action buttons', () => {
      render(<Invoices />)
      
      expect(screen.getByText('Run All Tests')).toBeInTheDocument()
      expect(screen.getByText('Add Demo Data')).toBeInTheDocument()
      expect(screen.getByText('Create Invoice')).toBeInTheDocument()
    })
  })

  describe('Data Loading', () => {
    it('loads data on mount', async () => {
      ;(offlineDataService.getInvoices as any).mockResolvedValue(mockInvoices)
      ;(offlineDataService.getDeals as any).mockResolvedValue(mockDeals)
      ;(offlineDataService.getCustomers as any).mockResolvedValue(mockCustomers)
      
      render(<Invoices />)
      
      await waitFor(() => {
        expect(offlineDataService.getInvoices).toHaveBeenCalled()
        expect(offlineDataService.getDeals).toHaveBeenCalled()
        expect(offlineDataService.getCustomers).toHaveBeenCalled()
      })
    })

    it('shows loading state', () => {
      ;(offlineDataService.getInvoices as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      )
      
      render(<Invoices />)
      
      expect(screen.getByText('Loading invoices...')).toBeInTheDocument()
    })

    it('shows empty state when no invoices', async () => {
      ;(useStore as any).mockReturnValue({
        ...mockStore,
        invoices: []
      })
      
      render(<Invoices />)
      
      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
        expect(screen.getByText('Create your first invoice to get started')).toBeInTheDocument()
      })
    })
  })

  describe('Add Invoice Modal', () => {
    it('opens add invoice modal', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument()
      })
    })

    it('generates invoice number automatically', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const invoiceNumberInput = screen.getByDisplayValue(/INV-\d{6}-\d{3}/)
        expect(invoiceNumberInput).toBeInTheDocument()
      })
    })

    it('adds and removes invoice items', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const addItemButton = screen.getByText('Add Item')
        fireEvent.click(addItemButton)
        
        const descriptionInputs = screen.getAllByPlaceholderText('Description')
        expect(descriptionInputs).toHaveLength(2)
      })
    })

    it('calculates totals correctly', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const qtyInput = screen.getByPlaceholderText('Qty')
        const rateInput = screen.getByPlaceholderText('Rate')
        const taxInput = screen.getByDisplayValue('0')
        
        fireEvent.change(qtyInput, { target: { value: '2' } })
        fireEvent.change(rateInput, { target: { value: '100' } })
        fireEvent.change(taxInput, { target: { value: '10' } })
        
        expect(screen.getByText('$200.00')).toBeInTheDocument() // Subtotal
        expect(screen.getByText('$20.00')).toBeInTheDocument() // Tax
        expect(screen.getByText('$220.00')).toBeInTheDocument() // Total
      })
    })
  })

  describe('Edit Invoice Modal', () => {
    it('opens edit modal with invoice data', async () => {
      render(<Invoices />)
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit')
        fireEvent.click(editButton)
        
        expect(screen.getByText('Edit Invoice')).toBeInTheDocument()
        expect(screen.getByDisplayValue('INV-2024-001')).toBeInTheDocument()
      })
    })

    it('updates invoice successfully', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ data: mockInvoices[0], error: null })
      ;(supabase.from as any).mockReturnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: mockUpdate
            })
          })
        })
      })
      
      render(<Invoices />)
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit')
        fireEvent.click(editButton)
        
        const updateButton = screen.getByText('Update Invoice')
        fireEvent.click(updateButton)
      })
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Invoice updated successfully'
        })
      })
    })
  })

  describe('View Invoice Modal', () => {
    it('opens view modal with invoice details', async () => {
      render(<Invoices />)
      
      await waitFor(() => {
        const viewButton = screen.getByText('View')
        fireEvent.click(viewButton)
        
        expect(screen.getByText('Invoice INV-2024-001')).toBeInTheDocument()
        expect(screen.getByText('View invoice details and items.')).toBeInTheDocument()
      })
    })

    it('displays invoice items correctly', async () => {
      render(<Invoices />)
      
      await waitFor(() => {
        const viewButton = screen.getByText('View')
        fireEvent.click(viewButton)
        
        expect(screen.getByText('Service')).toBeInTheDocument()
        expect(screen.getByText('$1000.00')).toBeInTheDocument()
      })
    })
  })

  describe('Invoice Operations', () => {
    it('deletes invoice with confirmation', async () => {
      window.confirm = vi.fn(() => true)
      const mockDelete = vi.fn().mockResolvedValue({ error: null })
      ;(supabase.from as any).mockReturnValue({
        delete: () => ({
          eq: mockDelete
        })
      })
      
      render(<Invoices />)
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete')
        fireEvent.click(deleteButton)
      })
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete invoice INV-2024-001?'
      )
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Invoice deleted successfully'
        })
      })
    })

    it('updates invoice status', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ data: { ...mockInvoices[0], status: 'paid' }, error: null })
      ;(supabase.from as any).mockReturnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: mockUpdate
            })
          })
        })
      })
      
      render(<Invoices />)
      
      await waitFor(() => {
        const markPaidButton = screen.getByText('Mark Paid')
        fireEvent.click(markPaidButton)
      })
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Invoice status updated to paid'
        })
      })
    })
  })

  describe('Action Buttons', () => {
    it('runs comprehensive tests', async () => {
      render(<Invoices />)
      
      const testButton = screen.getByText('Run All Tests')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(runComprehensiveTests).toHaveBeenCalledWith(mockUser.id)
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'All tests completed successfully!'
        })
      })
    })

    it('adds demo data', async () => {
      render(<Invoices />)
      
      const demoButton = screen.getByText('Add Demo Data')
      fireEvent.click(demoButton)
      
      await waitFor(() => {
        expect(addDemoData).toHaveBeenCalledWith(mockUser.id)
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Demo data added successfully!'
        })
      })
    })

    it('handles test failures', async () => {
      ;(runComprehensiveTests as any).mockRejectedValue(new Error('Test failed'))
      
      render(<Invoices />)
      
      const testButton = screen.getByText('Run All Tests')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Some tests failed. Check console for details.',
          variant: 'destructive'
        })
      })
    })
  })

  describe('Offline Mode', () => {
    beforeEach(() => {
      ;(devConfig as any).OFFLINE_MODE = true
    })

    it('creates invoice in offline mode', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const saveButton = screen.getByText('Create Invoice')
        fireEvent.click(saveButton)
      })
      
      await waitFor(() => {
        expect(offlineDataService.createInvoice).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Invoice created successfully'
        })
      })
    })

    it('updates invoice in offline mode', async () => {
      render(<Invoices />)
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit')
        fireEvent.click(editButton)
        
        const updateButton = screen.getByText('Update Invoice')
        fireEvent.click(updateButton)
      })
      
      await waitFor(() => {
        expect(offlineDataService.updateInvoice).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Invoice updated successfully'
        })
      })
    })

    it('deletes invoice in offline mode', async () => {
      window.confirm = vi.fn(() => true)
      
      render(<Invoices />)
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete')
        fireEvent.click(deleteButton)
      })
      
      await waitFor(() => {
        expect(offlineDataService.deleteInvoice).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Invoice deleted successfully'
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('handles invoice creation errors', async () => {
      ;(supabase.from as any).mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Database error') })
          })
        })
      })
      
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const saveButton = screen.getByText('Create Invoice')
        fireEvent.click(saveButton)
      })
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Invoice created successfully (offline)'
        })
      })
    })

    it('handles data loading errors', async () => {
      ;(offlineDataService.getInvoices as any).mockRejectedValue(new Error('Load error'))
      
      render(<Invoices />)
      
      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
      })
    })

    it('handles unauthenticated user', () => {
      ;(useAuthHook as any).mockReturnValue({ user: null })
      
      render(<Invoices />)
      
      const testButton = screen.getByText('Run All Tests')
      fireEvent.click(testButton)
      
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Please log in to run tests',
        variant: 'destructive'
      })
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const invoiceNumberInput = screen.getByDisplayValue(/INV-\d{6}-\d{3}/)
        fireEvent.change(invoiceNumberInput, { target: { value: '' } })
        
        const saveButton = screen.getByText('Create Invoice')
        fireEvent.click(saveButton)
        
        expect(screen.getByTestId('form-message')).toBeInTheDocument()
      })
    })

    it('validates invoice items', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Description')
        expect(descriptionInput).toHaveAttribute('required')
        
        const qtyInput = screen.getByPlaceholderText('Qty')
        expect(qtyInput).toHaveAttribute('required')
        
        const rateInput = screen.getByPlaceholderText('Rate')
        expect(rateInput).toHaveAttribute('required')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Invoices />)
      
      expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /run all tests/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add demo data/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      await user.tab()
      expect(createButton).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      const largeInvoiceList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockInvoices[0],
        id: `invoice-${i}`,
        invoice_number: `INV-2024-${String(i).padStart(3, '0')}`
      }))
      
      ;(useStore as any).mockReturnValue({
        ...mockStore,
        invoices: largeInvoiceList
      })
      
      const startTime = performance.now()
      render(<Invoices />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should render within 1 second
    })

    it('debounces form inputs', async () => {
      const user = userEvent.setup()
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Description')
        user.type(descriptionInput, 'Test description')
        
        // Should not trigger multiple updates immediately
        expect(descriptionInput).toHaveValue('Test description')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles malformed invoice items JSON', async () => {
      const invoiceWithBadItems = {
        ...mockInvoices[0],
        items: 'invalid json'
      }
      
      ;(useStore as any).mockReturnValue({
        ...mockStore,
        invoices: [invoiceWithBadItems]
      })
      
      render(<Invoices />)
      
      await waitFor(() => {
        const viewButton = screen.getByText('View')
        fireEvent.click(viewButton)
        
        expect(screen.getByText('No items found')).toBeInTheDocument()
      })
    })

    it('handles missing deal or customer data', async () => {
      ;(useStore as any).mockReturnValue({
        ...mockStore,
        deals: [],
        customers: []
      })
      
      render(<Invoices />)
      
      await waitFor(() => {
        const viewButton = screen.getByText('View')
        fireEvent.click(viewButton)
        
        expect(screen.getByText('Deal: N/A')).toBeInTheDocument()
        expect(screen.getByText('Customer: N/A')).toBeInTheDocument()
      })
    })

    it('handles overdue invoice detection', () => {
      const overdueInvoice = {
        ...mockInvoices[0],
        due_date: '2020-01-01',
        status: 'sent'
      }
      
      ;(useStore as any).mockReturnValue({
        ...mockStore,
        invoices: [overdueInvoice]
      })
      
      render(<Invoices />)
      
      expect(screen.getByText('1')).toBeInTheDocument() // Overdue count
    })

    it('prevents removing last invoice item', async () => {
      render(<Invoices />)
      
      const createButton = screen.getByText('Create Invoice')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button')
        expect(deleteButton).toBeDisabled()
      })
    })

    it('handles network failures gracefully', async () => {
      ;(supabase.from as any).mockReturnValue({
        select: () => ({
          order: () => Promise.reject(new Error('Network error'))
        })
      })
      
      render(<Invoices />)
      
      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
      })
    })
  })
})