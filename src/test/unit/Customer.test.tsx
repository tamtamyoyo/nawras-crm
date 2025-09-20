import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render } from '../../tests/test-utils'
import userEvent from '@testing-library/user-event'
import Customers from '../../pages/Customers'
import { toast } from 'sonner'
import React from 'react'

// Mock dependencies
vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: mockCustomer, error: null })
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: mockCustomer, error: null })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }))
    }))
  }
}))

vi.mock('sonner')
// Removed useAuth mock - now using AuthContext provider from test-utils

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-customer-id' })
  }
})

const mockCustomer = {
  id: 'test-customer-id',
  name: 'Test Customer',
  email: 'test@customer.com',
  phone: '+1234567890',
  company: 'Test Company',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}



describe('Customers Component', () => {
  let mockSupabase: ReturnType<typeof vi.mocked>

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase
    const { supabase } = await import('../../lib/supabase-client')
    mockSupabase = vi.mocked(supabase)

    // Setup default mock for customer fetch
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
            single: vi.fn().mockResolvedValue({ data: mockCustomer, error: null })
          })),
          insert: vi.fn().mockResolvedValue({ data: [mockCustomer], error: null }),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [mockCustomer], error: null })
          })),
          delete: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
      }
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching customer data', () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => new Promise(() => {})), // Never resolves
          single: vi.fn(() => new Promise(() => {}))
        }))
      }))

      render(<Customers />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Customer Display', () => {
    it('should display customer information correctly', async () => {
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
        expect(screen.getByText('test@customer.com')).toBeInTheDocument()
        expect(screen.getByText('+1234567890')).toBeInTheDocument()
        expect(screen.getByText('Test Company')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
    })

    it('should display customer status badge', async () => {
      render(<Customers />)

      await waitFor(() => {
        const statusBadge = screen.getByText('Active')
        expect(statusBadge).toBeInTheDocument()
        expect(statusBadge).toHaveClass('bg-green-100')
      })
    })
  })

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      expect(screen.getByDisplayValue('Test Customer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@customer.com')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should cancel edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      // Enter edit mode
      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      // Cancel edit mode
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(screen.getByText('Test Customer')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Test Customer')).not.toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    it('should save customer changes successfully', async () => {
      const user = userEvent.setup()
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      // Enter edit mode
      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      // Modify customer name
      const nameInput = screen.getByDisplayValue('Test Customer')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Customer')

      // Save changes
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('customers')
        expect(toast.success).toHaveBeenCalledWith('Customer updated successfully')
      })
    })

    it('should validate required fields before saving', async () => {
      const user = userEvent.setup()
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      // Enter edit mode
      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      // Clear required field
      const nameInput = screen.getByDisplayValue('Test Customer')
      await user.clear(nameInput)

      // Try to save
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Customer not found' }
          }),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Customer not found' }
          })
        }))
      }))

      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Error: Customer not found')).toBeInTheDocument()
      })
    })

    it('should handle save errors gracefully', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'customers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
              single: vi.fn().mockResolvedValue({ data: mockCustomer, error: null })
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' }
              })
            }))
          }
        }
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })) }
      })

      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Edit'))
      fireEvent.change(screen.getByDisplayValue('John Doe'), {
        target: { value: 'Jane Doe' }
      })
      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update customer')
      })
    })
  })

  describe('Delete Customer', () => {
    it('should delete customer when delete button is clicked', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this customer?')
        expect(mockSupabase.from).toHaveBeenCalledWith('customers')
        expect(toast.success).toHaveBeenCalledWith('Customer deleted successfully')
        expect(mockNavigate).toHaveBeenCalledWith('/customers')
      })
      
      confirmSpy.mockRestore()
    })

    it('should not delete customer when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })

    it('should handle delete errors gracefully', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'customers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
              single: vi.fn().mockResolvedValue({ data: mockCustomer, error: null })
            })),
            delete: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Delete failed' }
              })
            })) 
          }
        }
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })) }
      })

      const user = userEvent.setup()
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete customer')
      })
      
      confirmSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and structure', async () => {
      const user = userEvent.setup()
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      // Enter edit mode
      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone')).toBeInTheDocument()
      expect(screen.getByLabelText('Company')).toBeInTheDocument()
    })

    it('should have proper heading structure', async () => {
      render(<Customers />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Customer Details')
      })
    })
  })
})