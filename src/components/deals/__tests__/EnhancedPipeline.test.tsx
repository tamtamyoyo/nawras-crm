import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { EnhancedPipeline } from '../EnhancedPipeline'
import { toast } from 'sonner'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

interface MockDragEvent {
  active?: { id: string; data?: { current?: unknown } };
  over?: { id: string; data?: { current?: unknown } };
  delta?: { x: number; y: number };
}

interface MockDndContextProps {
  children: React.ReactNode;
  onDragStart?: (event: MockDragEvent) => void;
  onDragOver?: (event: MockDragEvent) => void;
  onDragEnd?: (event: MockDragEvent) => void;
}

interface MockDragOverlayProps {
  children: React.ReactNode;
}

interface MockSortableContextProps {
  children: React.ReactNode;
}

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragOver, onDragEnd }: MockDndContextProps) => {
    // Store handlers for testing
    ;(global as { dndHandlers?: { onDragStart?: (event: MockDragEvent) => void; onDragOver?: (event: MockDragEvent) => void; onDragEnd?: (event: MockDragEvent) => void } }).dndHandlers = { onDragStart, onDragOver, onDragEnd }
    return <div data-testid="dnd-context">{children}</div>
  },
  DragOverlay: ({ children }: MockDragOverlayProps) => <div data-testid="drag-overlay">{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  closestCorners: vi.fn()
}))

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: MockSortableContextProps) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  }),
  verticalListSortingStrategy: vi.fn()
}))

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => '')
    }
  }
}))

const mockDeals = [
  {
    id: 'deal-1',
    title: 'Enterprise Software License',
    description: 'Large enterprise deal',
    value: 50000,
    probability: 80,
    stage: 'prospecting',
    expected_close_date: '2024-02-15',
    responsible_person: 'John Doe',
    customer_id: 'customer-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'deal-2',
    title: 'Consulting Services',
    description: 'Monthly consulting contract',
    value: 15000,
    probability: 60,
    stage: 'qualification',
    expected_close_date: '2024-01-30',
    responsible_person: 'Jane Smith',
    customer_id: 'customer-2',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'deal-3',
    title: 'Small Project',
    description: 'Quick implementation',
    value: 5000,
    probability: 90,
    stage: 'proposal',
    expected_close_date: '2024-01-20',
    responsible_person: 'Bob Johnson',
    customer_id: 'customer-3',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'deal-4',
    title: 'Overdue Deal',
    description: 'Past due date',
    value: 25000,
    probability: 70,
    stage: 'negotiation',
    expected_close_date: '2023-12-15',
    responsible_person: 'Alice Brown',
    customer_id: 'customer-1',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z'
  },
  {
    id: 'deal-5',
    title: 'Won Deal',
    description: 'Successfully closed',
    value: 30000,
    probability: 100,
    stage: 'closed_won',
    expected_close_date: '2024-01-10',
    responsible_person: 'Charlie Wilson',
    customer_id: 'customer-2',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 'deal-6',
    title: 'Lost Deal',
    description: 'Deal was lost',
    value: 20000,
    probability: 0,
    stage: 'closed_lost',
    expected_close_date: '2024-01-05',
    responsible_person: 'David Lee',
    customer_id: 'customer-3',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  }
]

const mockCustomers = [
  {
    id: 'customer-1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0101',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'customer-2',
    name: 'Tech Solutions Inc',
    email: 'info@techsolutions.com',
    phone: '+1-555-0102',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'customer-3',
    name: 'Global Industries',
    email: 'hello@global.com',
    phone: '+1-555-0103',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
]

describe('EnhancedPipeline', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnExport = vi.fn()
  const mockOnStageChange = vi.fn()
  const mockOnBulkAction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnStageChange.mockResolvedValue(undefined)
    mockOnBulkAction.mockResolvedValue(undefined)
  })

  it('renders pipeline with all stages', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('Prospecting')).toBeInTheDocument()
    expect(screen.getByText('Qualification')).toBeInTheDocument()
    expect(screen.getByText('Proposal')).toBeInTheDocument()
    expect(screen.getByText('Negotiation')).toBeInTheDocument()
    expect(screen.getByText('Closed Won')).toBeInTheDocument()
    expect(screen.getByText('Closed Lost')).toBeInTheDocument()
  })

  it('displays deals in correct stages', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('Enterprise Software License')).toBeInTheDocument()
    expect(screen.getByText('Consulting Services')).toBeInTheDocument()
    expect(screen.getByText('Small Project')).toBeInTheDocument()
    expect(screen.getByText('Overdue Deal')).toBeInTheDocument()
    expect(screen.getByText('Won Deal')).toBeInTheDocument()
    expect(screen.getByText('Lost Deal')).toBeInTheDocument()
  })

  it('displays customer information for deals', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
    expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument()
    expect(screen.getByText('Global Industries')).toBeInTheDocument()
  })

  it('displays deal values and probabilities', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('$50,000')).toBeInTheDocument()
    expect(screen.getByText('80% probability')).toBeInTheDocument()
    expect(screen.getByText('$15,000')).toBeInTheDocument()
    expect(screen.getByText('60% probability')).toBeInTheDocument()
  })

  it('displays expected close dates', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('Close: 2/15/2024')).toBeInTheDocument()
    expect(screen.getByText('Close: 1/30/2024')).toBeInTheDocument()
  })

  it('displays responsible persons', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('shows stage statistics', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    // Check for deal counts in badges
    const badges = screen.getAllByText('1')
    expect(badges.length).toBeGreaterThan(0)

    // Check for total values and average probabilities
    expect(screen.getByText('Total Value')).toBeInTheDocument()
    expect(screen.getByText('Avg Probability')).toBeInTheDocument()
  })

  it('filters deals by search term', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search deals, customers...')
    fireEvent.change(searchInput, { target: { value: 'Enterprise' } })

    await waitFor(() => {
      expect(screen.getByText('Enterprise Software License')).toBeInTheDocument()
      expect(screen.queryByText('Consulting Services')).not.toBeInTheDocument()
    })
  })

  it('filters deals by customer name', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search deals, customers...')
    fireEvent.change(searchInput, { target: { value: 'Acme' } })

    await waitFor(() => {
      expect(screen.getByText('Enterprise Software License')).toBeInTheDocument()
      expect(screen.getByText('Overdue Deal')).toBeInTheDocument()
      expect(screen.queryByText('Consulting Services')).not.toBeInTheDocument()
    })
  })

  it('filters deals by high value', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const filterSelect = screen.getByRole('combobox')
    fireEvent.click(filterSelect)
    
    const highValueOption = screen.getByText('High Value (>$10k)')
    fireEvent.click(highValueOption)

    await waitFor(() => {
      expect(screen.getByText('Enterprise Software License')).toBeInTheDocument()
      expect(screen.getByText('Consulting Services')).toBeInTheDocument()
      expect(screen.queryByText('Small Project')).not.toBeInTheDocument()
    })
  })

  it('filters deals by closing soon', async () => {
    // Mock current date to make test predictable
    const mockDate = new Date('2024-01-25')
    vi.setSystemTime(mockDate)

    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const filterSelect = screen.getByRole('combobox')
    fireEvent.click(filterSelect)
    
    const closingSoonOption = screen.getByText('Closing Soon')
    fireEvent.click(closingSoonOption)

    await waitFor(() => {
      expect(screen.getByText('Consulting Services')).toBeInTheDocument()
    })

    vi.useRealTimers()
  })

  it('filters deals by overdue', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const filterSelect = screen.getByRole('combobox')
    fireEvent.click(filterSelect)
    
    const overdueOption = screen.getByText('Overdue')
    fireEvent.click(overdueOption)

    await waitFor(() => {
      expect(screen.getByText('Overdue Deal')).toBeInTheDocument()
    })
  })

  it('shows results summary', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('6 of 6 deals')).toBeInTheDocument()
  })

  it('handles deal selection', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const dealCheckbox = checkboxes.find(cb => cb.closest('[data-testid]') === null)
    
    if (dealCheckbox) {
      fireEvent.click(dealCheckbox)
      expect(screen.getByText('(1 selected)')).toBeInTheDocument()
    }
  })

  it('shows bulk actions when deals are selected', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const dealCheckbox = checkboxes.find(cb => cb.closest('[data-testid]') === null)
    
    if (dealCheckbox) {
      fireEvent.click(dealCheckbox)
      
      await waitFor(() => {
        expect(screen.getByText('1 deal selected')).toBeInTheDocument()
        expect(screen.getByText('Archive')).toBeInTheDocument()
        expect(screen.getByText('Duplicate')).toBeInTheDocument()
        expect(screen.getByText('Clear')).toBeInTheDocument()
      })
    }
  })

  it('handles bulk archive action', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const dealCheckbox = checkboxes.find(cb => cb.closest('[data-testid]') === null)
    
    if (dealCheckbox) {
      fireEvent.click(dealCheckbox)
      
      await waitFor(() => {
        const archiveButton = screen.getByText('Archive')
        fireEvent.click(archiveButton)
      })

      expect(mockOnBulkAction).toHaveBeenCalledWith(expect.any(Array), 'archive')
      expect(toast.success).toHaveBeenCalledWith('Bulk archive completed successfully')
    }
  })

  it('handles bulk duplicate action', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const dealCheckbox = checkboxes.find(cb => cb.closest('[data-testid]') === null)
    
    if (dealCheckbox) {
      fireEvent.click(dealCheckbox)
      
      await waitFor(() => {
        const duplicateButton = screen.getByText('Duplicate')
        fireEvent.click(duplicateButton)
      })

      expect(mockOnBulkAction).toHaveBeenCalledWith(expect.any(Array), 'duplicate')
      expect(toast.success).toHaveBeenCalledWith('Bulk duplicate completed successfully')
    }
  })

  it('clears selection when clear button is clicked', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const dealCheckbox = checkboxes.find(cb => cb.closest('[data-testid]') === null)
    
    if (dealCheckbox) {
      fireEvent.click(dealCheckbox)
      
      await waitFor(() => {
        const clearButton = screen.getByText('Clear')
        fireEvent.click(clearButton)
      })

      expect(screen.queryByText('1 deal selected')).not.toBeInTheDocument()
    }
  })

  it('calls edit handler when edit button is clicked', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const editButtons = screen.getAllByTestId('edit-deal-button')
    fireEvent.click(editButtons[0])

    expect(mockOnEdit).toHaveBeenCalledWith(mockDeals[0])
  })

  it('calls export handler when export button is clicked', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const exportButtons = screen.getAllByTestId('export-deal-button')
    fireEvent.click(exportButtons[0])

    expect(mockOnExport).toHaveBeenCalledWith(mockDeals[0])
  })

  it('calls delete handler when delete button is clicked', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const deleteButtons = screen.getAllByTestId('delete-deal-button')
    fireEvent.click(deleteButtons[0])

    expect(mockOnDelete).toHaveBeenCalledWith(mockDeals[0])
  })

  it('shows loading state', () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
        loading={true}
      />
    )

    expect(screen.getByText('Loading pipeline...')).toBeInTheDocument()
  })

  it('shows empty state for stages with no deals', () => {
    const emptyDeals = mockDeals.filter(deal => deal.stage !== 'prospecting')
    
    render(
      <EnhancedPipeline
        deals={emptyDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('No deals in this stage')).toBeInTheDocument()
    expect(screen.getByText('Drag deals here to move them')).toBeInTheDocument()
  })

  it('handles drag and drop operations', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    // Simulate drag start
    const handlers = (global as any).dndHandlers
    if (handlers?.onDragStart) {
      handlers.onDragStart({ active: { id: 'deal-1' } })
    }

    // Simulate drag end
    if (handlers?.onDragEnd) {
      await handlers.onDragEnd({ 
        active: { id: 'deal-1' }, 
        over: { id: 'qualification' } 
      })
    }

    expect(mockOnStageChange).toHaveBeenCalledWith('deal-1', 'qualification')
    expect(toast.success).toHaveBeenCalledWith('Deal moved to Qualification')
  })

  it('handles drag and drop error', async () => {
    mockOnStageChange.mockRejectedValue(new Error('Failed to update'))
    
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const handlers = (global as any).dndHandlers
    if (handlers?.onDragEnd) {
      await handlers.onDragEnd({ 
        active: { id: 'deal-1' }, 
        over: { id: 'qualification' } 
      })
    }

    expect(toast.error).toHaveBeenCalledWith('Failed to move deal')
  })

  it('handles bulk action error', async () => {
    mockOnBulkAction.mockRejectedValue(new Error('Bulk action failed'))
    
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const dealCheckbox = checkboxes.find(cb => cb.closest('[data-testid]') === null)
    
    if (dealCheckbox) {
      fireEvent.click(dealCheckbox)
      
      await waitFor(() => {
        const archiveButton = screen.getByText('Archive')
        fireEvent.click(archiveButton)
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to perform bulk archive')
      })
    }
  })

  it('handles deals without customers', () => {
    const dealsWithoutCustomers = [{
      ...mockDeals[0],
      customer_id: 'non-existent-customer'
    }]
    
    render(
      <EnhancedPipeline
        deals={dealsWithoutCustomers}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('Enterprise Software License')).toBeInTheDocument()
  })

  it('handles deals without values or probabilities', () => {
    const dealsWithoutValues = [{
      ...mockDeals[0],
      value: null,
      probability: null
    }]
    
    render(
      <EnhancedPipeline
        deals={dealsWithoutValues}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('0% probability')).toBeInTheDocument()
  })

  it('handles select all functionality', async () => {
    render(
      <EnhancedPipeline
        deals={mockDeals}
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
        onStageChange={mockOnStageChange}
        onBulkAction={mockOnBulkAction}
      />
    )

    // Find stage header checkbox (first checkbox in the document)
    const checkboxes = screen.getAllByRole('checkbox')
    const stageCheckbox = checkboxes[0]
    
    fireEvent.click(stageCheckbox)

    await waitFor(() => {
      expect(screen.getByText(/selected/)).toBeInTheDocument()
    })
  })
})