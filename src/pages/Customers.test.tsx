import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Customers from './Customers'
import { useAuth } from '../hooks/useAuthHook'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase-client'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('../hooks/useAuthHook', () => ({
  useAuth: vi.fn(),
  AuthContext: vi.fn()
}))
vi.mock('../store/useStore')
vi.mock('../lib/supabase-client')
vi.mock('sonner')

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true
})

const mockUser = {
  id: '1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
}

const mockCustomers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    address: '123 Main St',
    status: 'active',
    notes: 'Important client',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: '1'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1-555-0456',
    company: 'Tech Solutions',
    address: '456 Oak Ave',
    status: 'prospect',
    notes: 'Potential new client',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    created_by: '1'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1-555-0789',
    company: 'Manufacturing Inc',
    address: '789 Pine Rd',
    status: 'inactive',
    notes: 'Former client',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    created_by: '1'
  }
]

const mockUseAuth = vi.mocked(useAuth)
const mockUseStore = useStore as ReturnType<typeof vi.fn>
const mockSupabase = vi.mocked(supabase)
const mockToast = vi.mocked(toast)

describe('Customers', () => {
  const mockSetCustomers = vi.fn()
  const mockAddCustomer = vi.fn()
  const mockUpdateCustomer = vi.fn()
  const mockRemoveCustomer = vi.fn()
  const mockSetLoading = vi.fn()

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      loading: false
    })

    mockUseStore.mockReturnValue({
      customers: mockCustomers,
      setCustomers: mockSetCustomers,
      addCustomer: mockAddCustomer,
      updateCustomer: mockUpdateCustomer,
      removeCustomer: mockRemoveCustomer,
      loading: false,
      setLoading: mockSetLoading,
      deals: [],
      leads: [],
      invoices: [],
      setDeals: vi.fn(),
      setLeads: vi.fn(),
      setInvoices: vi.fn()
    })

    // Mock successful Supabase responses
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockCustomers, error: null })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCustomers[0], error: null })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCustomers[0], error: null })
          })
        })
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    } as unknown as ReturnType<typeof supabase.from>)

    mockToast.success = vi.fn()
    mockToast.error = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render customers page title and description', async () => {
      render(<Customers />)
      
      expect(screen.getByTestId('page-title')).toHaveTextContent('Customers')
      expect(screen.getByText('Manage your customer relationships')).toBeInTheDocument()
    })

    it('should render add customer button', () => {
      render(<Customers />)
      
      expect(screen.getByTestId('add-customer-button')).toBeInTheDocument()
      expect(screen.getByText('Add Customer')).toBeInTheDocument()
    })

    it('should render search input and status filter', () => {
      render(<Customers />)
      
      expect(screen.getByTestId('customers-search-input')).toBeInTheDocument()
      expect(screen.getByTestId('customer-status-filter')).toBeInTheDocument()
    })

    it('should render customer list when customers exist', async () => {
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      })
    })

    it('should show loading state', () => {
      mockUseStore.mockReturnValue({
        customers: [],
        loading: true,
        setCustomers: mockSetCustomers,
        addCustomer: mockAddCustomer,
        updateCustomer: mockUpdateCustomer,
        removeCustomer: mockRemoveCustomer,
        setLoading: mockSetLoading,
        deals: [],
        leads: [],
        invoices: [],
        setDeals: vi.fn(),
        setLeads: vi.fn(),
        setInvoices: vi.fn()
      })

      render(<Customers />)
      
      expect(screen.getByText('Loading customers...')).toBeInTheDocument()
    })

    it('should show empty state when no customers', () => {
      mockUseStore.mockReturnValue({
        customers: [],
        loading: false,
        setCustomers: mockSetCustomers,
        addCustomer: mockAddCustomer,
        updateCustomer: mockUpdateCustomer,
        removeCustomer: mockRemoveCustomer,
        setLoading: mockSetLoading,
        deals: [],
        leads: [],
        invoices: [],
        setDeals: vi.fn(),
        setLeads: vi.fn(),
        setInvoices: vi.fn()
      })

      render(<Customers />)
      
      expect(screen.getByText('No customers yet')).toBeInTheDocument()
      expect(screen.getByText('Get started by adding your first customer')).toBeInTheDocument()
      expect(screen.getByTestId('add-customer-empty-state')).toBeInTheDocument()
    })
  })

  describe('customer display', () => {
    it('should display customer information correctly', async () => {
      render(<Customers />)
      
      await waitFor(() => {
        // Check customer names
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        
        // Check customer details
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.getByText('123 Main St')).toBeInTheDocument()
        
        // Check status badges
        expect(screen.getByText('active')).toBeInTheDocument()
        expect(screen.getByText('prospect')).toBeInTheDocument()
        expect(screen.getByText('inactive')).toBeInTheDocument()
      })
    })

    it('should show customer notes when available', async () => {
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('Important client')).toBeInTheDocument()
        expect(screen.getByText('Potential new client')).toBeInTheDocument()
      })
    })

    it('should render edit and delete buttons for each customer', async () => {
      render(<Customers />)
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-customer-button')
        const deleteButtons = screen.getAllByTestId('delete-customer-button')
        
        expect(editButtons).toHaveLength(3)
        expect(deleteButtons).toHaveLength(3)
      })
    })
  })

  describe('search functionality', () => {
    it('should filter customers by name', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByTestId('customers-search-input')
      await user.type(searchInput, 'John')
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('should filter customers by email', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByTestId('customers-search-input')
      await user.type(searchInput, 'jane@example.com')
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('should filter customers by company', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByTestId('customers-search-input')
      await user.type(searchInput, 'Acme')
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      const searchInput = screen.getByTestId('customers-search-input')
      await user.type(searchInput, 'nonexistent')
      
      expect(screen.getByText('No customers found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
    })
  })

  describe('status filtering', () => {
    it('should filter customers by active status', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const statusFilter = screen.getByTestId('customer-status-filter')
      await user.selectOptions(statusFilter, 'active')
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })

    it('should filter customers by prospect status', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
      
      const statusFilter = screen.getByTestId('customer-status-filter')
      await user.selectOptions(statusFilter, 'prospect')
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })

    it('should show all customers when filter is set to all', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const statusFilter = screen.getByTestId('customer-status-filter')
      await user.selectOptions(statusFilter, 'all')
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })
  })

  describe('add customer modal', () => {
    it('should open add customer modal when button is clicked', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      const addButton = screen.getByTestId('add-customer-button')
      await user.click(addButton)
      
      expect(screen.getByText('Add New Customer')).toBeInTheDocument()
      expect(screen.getByTestId('customer-name-input')).toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      const addButton = screen.getByTestId('add-customer-button')
      await user.click(addButton)
      
      const cancelButton = screen.getByTestId('customer-cancel-button')
      await user.click(cancelButton)
      
      expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      const addButton = screen.getByTestId('add-customer-button')
      await user.click(addButton)
      
      const saveButton = screen.getByTestId('customer-save-button')
      await user.click(saveButton)
      
      expect(screen.getByTestId('customer-name-error')).toHaveTextContent('Name is required')
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      const addButton = screen.getByTestId('add-customer-button')
      await user.click(addButton)
      
      const nameInput = screen.getByTestId('customer-name-input')
      const emailInput = screen.getByTestId('customer-email-input')
      
      await user.type(nameInput, 'Test Customer')
      await user.type(emailInput, 'invalid-email')
      
      const saveButton = screen.getByTestId('customer-save-button')
      await user.click(saveButton)
      
      expect(screen.getByTestId('customer-email-error')).toHaveTextContent('Please enter a valid email address')
    })

    it('should create new customer successfully', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      const addButton = screen.getByTestId('add-customer-button')
      await user.click(addButton)
      
      // Fill form
      await user.type(screen.getByTestId('customer-name-input'), 'New Customer')
      await user.type(screen.getByTestId('customer-email-input'), 'new@example.com')
      await user.type(screen.getByTestId('customer-phone-input'), '+1-555-9999')
      await user.type(screen.getByTestId('customer-company-input'), 'New Company')
      
      const saveButton = screen.getByTestId('customer-save-button')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockAddCustomer).toHaveBeenCalled()
        expect(mockToast.success).toHaveBeenCalledWith('Customer added successfully')
      })
    })
  })

  describe('edit customer modal', () => {
    it('should open edit modal with customer data', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByTestId('edit-customer-button')
      await user.click(editButtons[0])
      
      expect(screen.getByText('Edit Customer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })

    it('should update customer successfully', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByTestId('edit-customer-button')
      await user.click(editButtons[0])
      
      const nameInput = screen.getByTestId('customer-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated John Doe')
      
      const saveButton = screen.getByTestId('customer-save-button')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockUpdateCustomer).toHaveBeenCalled()
        expect(mockToast.success).toHaveBeenCalledWith('Customer updated successfully')
      })
    })
  })

  describe('delete customer', () => {
    it('should delete customer when confirmed', async () => {
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByTestId('delete-customer-button')
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(mockRemoveCustomer).toHaveBeenCalledWith('1')
        expect(mockToast.success).toHaveBeenCalledWith('Customer deleted successfully')
      })
    })

    it('should not delete customer when cancelled', async () => {
      vi.mocked(window.confirm).mockReturnValue(false)
      
      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByTestId('delete-customer-button')
      await user.click(deleteButtons[0])
      
      expect(mockRemoveCustomer).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle load customers error', async () => {
      const error = new Error('Database error')
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error })
        })
      })

      render(<Customers />)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load customers. Please try again.')
      })
    })

    it('should handle create customer error', async () => {
      const error = new Error('Create error')
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCustomers, error: null })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error })
          })
        })
      })

      const user = userEvent.setup()
      render(<Customers />)
      
      const addButton = screen.getByTestId('add-customer-button')
      await user.click(addButton)
      
      await user.type(screen.getByTestId('customer-name-input'), 'Test Customer')
      
      const saveButton = screen.getByTestId('customer-save-button')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to save customer')
      })
    })

    it('should handle delete customer error', async () => {
      const error = new Error('Delete error')
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCustomers, error: null })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error })
        })
      })

      const user = userEvent.setup()
      render(<Customers />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByTestId('delete-customer-button')
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to delete customer')
      })
    })
  })
})