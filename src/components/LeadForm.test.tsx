import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LeadForm } from './LeadForm'
import { useStore } from '../store/useStore'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('../hooks/useStore')
vi.mock('sonner')

const mockUseStore = vi.mocked(useStore)
const mockToast = vi.mocked(toast)

const mockLead = {
  id: '1',
  name: 'Test Lead',
  email: 'lead@example.com',
  phone: '+1234567890',
  company: 'Lead Company',
  source: 'website' as const,
  status: 'new' as const,
  score: 75,
  notes: 'Test lead notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockStore = {
  leads: [mockLead],
  loading: false,
  addLead: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  convertLeadToCustomer: vi.fn(),
  fetchLeads: vi.fn()
}

describe('LeadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStore.mockReturnValue(mockStore)
  })

  describe('Rendering', () => {
    it('should render form fields correctly', () => {
      render(<LeadForm />)
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/source/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/score/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument()
    })

    it('should render source options in select dropdown', () => {
      render(<LeadForm />)
      
      const sourceSelect = screen.getByLabelText(/source/i)
      fireEvent.click(sourceSelect)
      
      expect(screen.getByText('Website')).toBeInTheDocument()
      expect(screen.getByText('Social Media')).toBeInTheDocument()
      expect(screen.getByText('Email Campaign')).toBeInTheDocument()
      expect(screen.getByText('Referral')).toBeInTheDocument()
      expect(screen.getByText('Cold Call')).toBeInTheDocument()
      expect(screen.getByText('Trade Show')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('should render status options in select dropdown', () => {
      render(<LeadForm />)
      
      const statusSelect = screen.getByLabelText(/status/i)
      fireEvent.click(statusSelect)
      
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Contacted')).toBeInTheDocument()
      expect(screen.getByText('Qualified')).toBeInTheDocument()
      expect(screen.getByText('Unqualified')).toBeInTheDocument()
      expect(screen.getByText('Converted')).toBeInTheDocument()
    })

    it('should render in edit mode when lead is provided', () => {
      render(<LeadForm lead={mockLead} />)
      
      expect(screen.getByDisplayValue('Test Lead')).toBeInTheDocument()
      expect(screen.getByDisplayValue('lead@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Lead Company')).toBeInTheDocument()
      expect(screen.getByDisplayValue('75')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test lead notes')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update lead/i })).toBeInTheDocument()
    })

    it('should show convert to customer button in edit mode', () => {
      render(<LeadForm lead={mockLead} />)
      
      expect(screen.getByRole('button', { name: /convert to customer/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      render(<LeadForm />)
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      render(<LeadForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('should validate phone number format', async () => {
      render(<LeadForm />)
      
      const phoneInput = screen.getByLabelText(/phone/i)
      fireEvent.change(phoneInput, { target: { value: '123' } })
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument()
      })
    })

    it('should validate score is between 0 and 100', async () => {
      render(<LeadForm />)
      
      const scoreInput = screen.getByLabelText(/score/i)
      fireEvent.change(scoreInput, { target: { value: '150' } })
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/score must be between 0 and 100/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call addLead when creating new lead', async () => {
      render(<LeadForm />)
      
      // Fill form
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Lead' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+1234567890' } })
      fireEvent.change(screen.getByLabelText(/company/i), { target: { value: 'New Company' } })
      
      const sourceSelect = screen.getByLabelText(/source/i)
      fireEvent.click(sourceSelect)
      fireEvent.click(screen.getByText('Website'))
      
      const statusSelect = screen.getByLabelText(/status/i)
      fireEvent.click(statusSelect)
      fireEvent.click(screen.getByText('New'))
      
      fireEvent.change(screen.getByLabelText(/score/i), { target: { value: '80' } })
      fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'New lead notes' } })
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockStore.addLead).toHaveBeenCalledWith({
          name: 'New Lead',
          email: 'new@example.com',
          phone: '+1234567890',
          company: 'New Company',
          source: 'website',
          status: 'new',
          score: 80,
          notes: 'New lead notes'
        })
      })
    })

    it('should call updateLead when editing existing lead', async () => {
      render(<LeadForm lead={mockLead} />)
      
      // Update name
      const nameInput = screen.getByDisplayValue('Test Lead')
      fireEvent.change(nameInput, { target: { value: 'Updated Lead' } })
      
      const submitButton = screen.getByRole('button', { name: /update lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockStore.updateLead).toHaveBeenCalledWith('1', {
          name: 'Updated Lead',
          email: 'lead@example.com',
          phone: '+1234567890',
          company: 'Lead Company',
          source: 'website',
          status: 'new',
          score: 75,
          notes: 'Test lead notes'
        })
      })
    })

    it('should reset form after successful submission', async () => {
      mockStore.addLead.mockResolvedValue(undefined)
      
      render(<LeadForm />)
      
      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Lead' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue('')
        expect(screen.getByLabelText(/email/i)).toHaveValue('')
      })
    })
  })

  describe('Lead Conversion', () => {
    it('should call convertLeadToCustomer when convert button is clicked', async () => {
      render(<LeadForm lead={mockLead} />)
      
      const convertButton = screen.getByRole('button', { name: /convert to customer/i })
      fireEvent.click(convertButton)
      
      await waitFor(() => {
        expect(mockStore.convertLeadToCustomer).toHaveBeenCalledWith('1')
      })
    })

    it('should show confirmation dialog before conversion', async () => {
      render(<LeadForm lead={mockLead} />)
      
      const convertButton = screen.getByRole('button', { name: /convert to customer/i })
      fireEvent.click(convertButton)
      
      expect(screen.getByText(/convert lead to customer/i)).toBeInTheDocument()
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    })

    it('should disable convert button for already converted leads', () => {
      const convertedLead = { ...mockLead, status: 'converted' as const }
      render(<LeadForm lead={convertedLead} />)
      
      const convertButton = screen.getByRole('button', { name: /convert to customer/i })
      expect(convertButton).toBeDisabled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      mockStore.loading = true
      mockUseStore.mockReturnValue({ ...mockStore, loading: true })
      
      render(<LeadForm />)
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show loading state during conversion', async () => {
      mockStore.loading = true
      mockUseStore.mockReturnValue({ ...mockStore, loading: true })
      
      render(<LeadForm lead={mockLead} />)
      
      const convertButton = screen.getByRole('button', { name: /convert to customer/i })
      expect(convertButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      mockStore.addLead.mockRejectedValue(new Error('Network error'))
      
      render(<LeadForm />)
      
      // Fill form
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Lead' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to save lead')
      })
    })

    it('should handle conversion errors gracefully', async () => {
      mockStore.convertLeadToCustomer.mockRejectedValue(new Error('Conversion error'))
      
      render(<LeadForm lead={mockLead} />)
      
      const convertButton = screen.getByRole('button', { name: /convert to customer/i })
      fireEvent.click(convertButton)
      
      // Confirm conversion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to convert lead')
      })
    })
  })

  describe('Score Visualization', () => {
    it('should display score with visual indicator', () => {
      render(<LeadForm lead={mockLead} />)
      
      const scoreInput = screen.getByLabelText(/score/i)
      expect(scoreInput).toHaveValue(75)
      
      // Should show score color indicator
      const scoreIndicator = screen.getByTestId('score-indicator')
      expect(scoreIndicator).toHaveClass('bg-yellow-500') // Medium score color
    })

    it('should update score color based on value', () => {
      render(<LeadForm />)
      
      const scoreInput = screen.getByLabelText(/score/i)
      const scoreIndicator = screen.getByTestId('score-indicator')
      
      // High score (green)
      fireEvent.change(scoreInput, { target: { value: '90' } })
      expect(scoreIndicator).toHaveClass('bg-green-500')
      
      // Low score (red)
      fireEvent.change(scoreInput, { target: { value: '20' } })
      expect(scoreIndicator).toHaveClass('bg-red-500')
    })
  })

  describe('Auto-scoring', () => {
    it('should calculate score based on form data', () => {
      render(<LeadForm />)
      
      const scoreInput = screen.getByLabelText(/score/i)
      
      // Fill form with high-value data
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ceo@bigcompany.com' } })
      fireEvent.change(screen.getByLabelText(/company/i), { target: { value: 'Fortune 500 Company' } })
      
      const sourceSelect = screen.getByLabelText(/source/i)
      fireEvent.click(sourceSelect)
      fireEvent.click(screen.getByText('Referral'))
      
      // Score should be automatically calculated
      expect(parseInt(scoreInput.value)).toBeGreaterThan(50)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LeadForm />)
      
      expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true')
    })

    it('should associate error messages with form fields', async () => {
      render(<LeadForm />)
      
      const submitButton = screen.getByRole('button', { name: /add lead/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i)
        const errorMessage = screen.getByText(/name is required/i)
        expect(nameInput).toHaveAttribute('aria-describedby', expect.stringContaining(errorMessage.id))
      })
    })

    it('should announce score changes to screen readers', () => {
      render(<LeadForm />)
      
      const scoreInput = screen.getByLabelText(/score/i)
      fireEvent.change(scoreInput, { target: { value: '85' } })
      
      expect(scoreInput).toHaveAttribute('aria-describedby', expect.stringContaining('score-description'))
    })
  })
})