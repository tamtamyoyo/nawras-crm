import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Proposals from './Proposals'
import { useAuth } from '@/hooks/useAuthHook'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase-client'

// Mock dependencies
vi.mock('@/hooks/useAuthHook', () => ({
  useAuth: vi.fn()
}))
vi.mock('@/store/useStore')
vi.mock('@/hooks/use-toast')
vi.mock('@/lib/supabase-client')
interface MockProposalsTableProps {
  data: Array<{ id: string; title: string }>
  onView: (proposal: unknown) => void
  onEdit: (proposal: unknown) => void
  onDelete: (proposal: unknown) => void
  onStatusUpdate: (proposal: unknown, status: string) => void
}

vi.mock('@/components/proposals/proposals-table', () => ({
  ProposalsTable: ({ data, onView, onEdit, onDelete, onStatusUpdate }: MockProposalsTableProps) => (
    <div data-testid="proposals-table">
      {data.map((proposal) => (
        <div key={proposal.id} data-testid={`proposal-${proposal.id}`}>
          <span>{proposal.title}</span>
          <button onClick={() => onView(proposal)}>View</button>
          <button onClick={() => onEdit(proposal)}>Edit</button>
          <button onClick={() => onDelete(proposal)}>Delete</button>
          <button onClick={() => onStatusUpdate(proposal, 'sent')}>Update Status</button>
        </div>
      ))}
    </div>
  )
}))

const mockUser = {
  id: 'user-1',
  email: 'test@example.com'
}

const mockProposals = [
  {
    id: 'proposal-1',
    title: 'Test Proposal 1',
    deal_id: 'deal-1',
    customer_id: 'customer-1',
    content: 'Test content 1',
    status: 'draft',
    valid_until: '2024-12-31',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: 'user-1'
  },
  {
    id: 'proposal-2',
    title: 'Test Proposal 2',
    deal_id: 'deal-2',
    customer_id: 'customer-2',
    content: 'Test content 2',
    status: 'sent',
    valid_until: '2024-12-31',
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
    created_by: 'user-1'
  },
  {
    id: 'proposal-3',
    title: 'Test Proposal 3',
    deal_id: 'deal-3',
    customer_id: 'customer-3',
    content: 'Test content 3',
    status: 'accepted',
    valid_until: '2024-12-31',
    created_at: '2024-01-03',
    updated_at: '2024-01-03',
    created_by: 'user-1'
  }
]

const mockDeals = [
  {
    id: 'deal-1',
    title: 'Test Deal 1',
    customer_id: 'customer-1',
    value: 10000,
    status: 'open'
  },
  {
    id: 'deal-2',
    title: 'Test Deal 2',
    customer_id: 'customer-2',
    value: 20000,
    status: 'open'
  }
]

const mockCustomers = [
  {
    id: 'customer-1',
    name: 'Customer 1',
    email: 'customer1@example.com'
  },
  {
    id: 'customer-2',
    name: 'Customer 2',
    email: 'customer2@example.com'
  }
]

const mockToast = vi.fn()
const mockAddProposal = vi.fn()
const mockUpdateProposal = vi.fn()
const mockRemoveProposal = vi.fn()

const mockSupabaseFrom = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseOrder = vi.fn()
// Mock Supabase methods are set up in the beforeEach block

beforeEach(() => {
  vi.clearAllMocks()
  
  // Mock useAuth
  const mockUseAuth = vi.mocked(useAuth)
  mockUseAuth.mockReturnValue({
    user: mockUser,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    loading: false
  })
  
  // Mock useStore
  vi.mocked(useStore).mockReturnValue({
    addProposal: mockAddProposal,
    updateProposal: mockUpdateProposal,
    removeProposal: mockRemoveProposal
  } as ReturnType<typeof useStore>)
  
  // Mock useToast
  vi.mocked(useToast).mockReturnValue({
    toast: mockToast
  })
  
  // Mock Supabase client
  mockSupabaseOrder.mockReturnValue({ data: mockProposals, error: null })
  mockSupabaseSelect.mockReturnValue({ order: mockSupabaseOrder })
  mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })
  
  vi.mocked(supabase).from = mockSupabaseFrom
  
  // Setup different responses for different tables
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'proposals') {
      return {
        select: () => ({
          order: () => ({ data: mockProposals, error: null })
        }),
        insert: () => ({
          select: () => ({
            single: () => ({ data: mockProposals[0], error: null })
          })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({ data: mockProposals[0], error: null })
            })
          })
        }),
        delete: () => ({
          eq: () => ({ error: null })
        })
      }
    } else if (table === 'deals') {
      return {
        select: () => ({
          order: () => ({ data: mockDeals, error: null })
        })
      }
    } else if (table === 'customers') {
      return {
        select: () => ({
          order: () => ({ data: mockCustomers, error: null })
        })
      }
    }
    return { select: () => ({ order: () => ({ data: [], error: null }) }) }
  })
  
  // Mock window.confirm
  global.confirm = vi.fn(() => true)
})

describe('Proposals', () => {
  it('renders proposals page with header', async () => {
    render(<Proposals />)
    
    expect(screen.getByText('Proposals')).toBeInTheDocument()
    expect(screen.getByText('Create and manage proposals')).toBeInTheDocument()
    expect(screen.getByText('Create Proposal')).toBeInTheDocument()
  })
  
  it('displays loading state initially', () => {
    render(<Proposals />)
    
    expect(screen.getByText('Loading proposals...')).toBeInTheDocument()
  })
  
  it('displays proposals statistics correctly', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Proposals')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Total proposals
      expect(screen.getByText('Sent')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Sent proposals
      expect(screen.getByText('Accepted')).toBeInTheDocument()
      expect(screen.getByText('33%')).toBeInTheDocument() // Acceptance rate
    })
  })
  
  it('displays proposals table when data is loaded', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      expect(screen.getByTestId('proposals-table')).toBeInTheDocument()
      expect(screen.getByTestId('proposal-proposal-1')).toBeInTheDocument()
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument()
    })
  })
  
  it('displays empty state when no proposals exist', async () => {
    // Mock empty proposals
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'proposals') {
        return {
          select: () => ({
            order: () => ({ data: [], error: null })
          })
        }
      }
      return { select: () => ({ order: () => ({ data: [], error: null }) }) }
    })
    
    render(<Proposals />)
    
    await waitFor(() => {
      expect(screen.getByText('No proposals yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first proposal to get started')).toBeInTheDocument()
    })
  })
  
  it('opens add proposal modal when create button is clicked', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Proposal')
      fireEvent.click(createButton)
    })
    
    expect(screen.getByText('Create New Proposal')).toBeInTheDocument()
    expect(screen.getByText('Fill in the details to create a new proposal.')).toBeInTheDocument()
  })
  
  it('opens edit modal when edit button is clicked', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
    })
    
    expect(screen.getByText('Edit Proposal')).toBeInTheDocument()
    expect(screen.getByText('Update the proposal details below.')).toBeInTheDocument()
  })
  
  it('opens view modal when view button is clicked', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const viewButton = screen.getByText('View')
      fireEvent.click(viewButton)
    })
    
    expect(screen.getByText('Test Proposal 1')).toBeInTheDocument()
    expect(screen.getByText('View proposal details and content.')).toBeInTheDocument()
  })
  
  it('handles proposal creation successfully', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Proposal')
      fireEvent.click(createButton)
    })
    
    // Fill form
    const titleInput = screen.getByPlaceholderText('Enter proposal title')
    fireEvent.change(titleInput, { target: { value: 'New Proposal' } })
    
    const contentTextarea = screen.getByPlaceholderText('Enter proposal content...')
    fireEvent.change(contentTextarea, { target: { value: 'New proposal content' } })
    
    const submitButton = screen.getByText('Create Proposal')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAddProposal).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Proposal created successfully'
      })
    })
  })
  
  it('handles proposal update successfully', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
    })
    
    const titleInput = screen.getByDisplayValue('Test Proposal 1')
    fireEvent.change(titleInput, { target: { value: 'Updated Proposal' } })
    
    const submitButton = screen.getByText('Update Proposal')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockUpdateProposal).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Proposal updated successfully'
      })
    })
  })
  
  it('handles proposal deletion successfully', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
    })
    
    await waitFor(() => {
      expect(mockRemoveProposal).toHaveBeenCalledWith('proposal-1')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Proposal deleted successfully'
      })
    })
  })
  
  it('handles status update successfully', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const statusButton = screen.getByText('Update Status')
      fireEvent.click(statusButton)
    })
    
    await waitFor(() => {
      expect(mockUpdateProposal).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Proposal status updated to sent'
      })
    })
  })
  
  it('handles template selection', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Proposal')
      fireEvent.click(createButton)
    })
    
    const templateSelect = screen.getByText('Choose a template')
    fireEvent.click(templateSelect)
    
    const basicTemplate = screen.getByText('Basic Service Proposal')
    fireEvent.click(basicTemplate)
    
    // Check if content is populated with template
    const contentTextarea = screen.getByPlaceholderText('Enter proposal content...')
    expect(contentTextarea.value).toContain('# Service Proposal')
  })
  
  it('handles form validation errors', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Proposal')
      fireEvent.click(createButton)
    })
    
    // Try to submit without required fields
    const submitButton = screen.getByText('Create Proposal')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
      expect(screen.getByText('Content is required')).toBeInTheDocument()
    })
  })
  
  it('handles API errors gracefully', async () => {
    // Mock API error
    mockSupabaseFrom.mockImplementation(() => ({
      select: () => ({
        order: () => ({ data: null, error: new Error('API Error') })
      })
    }))
    
    render(<Proposals />)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      })
    })
  })
  
  it('cancels deletion when user declines confirmation', async () => {
    global.confirm = vi.fn(() => false)
    
    render(<Proposals />)
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
    })
    
    expect(mockRemoveProposal).not.toHaveBeenCalled()
  })
  
  it('closes modals when cancel is clicked', async () => {
    render(<Proposals />)
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Proposal')
      fireEvent.click(createButton)
    })
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(screen.queryByText('Create New Proposal')).not.toBeInTheDocument()
  })
})