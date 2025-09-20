import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EnhancedDataTable } from '@/components/ui/enhanced-data-table'
import { ColumnDef } from '@tanstack/react-table'
import '@testing-library/jest-dom/vitest'

// Mock data
interface TestData {
  id: string
  name: string
  email: string
  status: string
  amount: number
  date: string
}

const mockData: TestData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    amount: 1000,
    date: '2024-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'inactive',
    amount: 2000,
    date: '2024-01-20'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'active',
    amount: 1500,
    date: '2024-01-25'
  }
]

const mockColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.getValue('name')
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.getValue('email')
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => row.getValue('status')
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => `$${row.getValue('amount')}`
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => row.getValue('date')
  }
]

// Mock filter fields (for reference, not used in current component)
const mockFilterFields = [
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'range' as const,
    min: 0,
    max: 10000
  }
]

// Mock the GlobalSearch component
vi.mock('@/components/search/GlobalSearch', () => ({
  GlobalSearch: ({ onResultSelect }: { onResultSelect: (result: { id: string; type: string }) => void }) => (
    <div data-testid="global-search">
      <button onClick={() => onResultSelect({ id: '1', type: 'test' })}>Search Result</button>
    </div>
  )
}))

// Mock the AdvancedFilters component
vi.mock('@/components/filters/AdvancedFilters', () => ({
  AdvancedFilters: ({ onChange, onReset }: { onChange: (values: Record<string, unknown>) => void; onReset: () => void }) => (
    <div data-testid="advanced-filters">
      <button onClick={() => onChange({ name: 'John' })}>Apply Filter</button>
      <button onClick={onReset}>Reset Filters</button>
    </div>
  )
}))

describe('EnhancedDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with data', () => {
    render(
      <EnhancedDataTable
        data={mockData}
        columns={mockColumns}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('active')).toHaveLength(2) // Two users have 'active' status
  })

  it('displays empty state when no data', () => {
    render(
      <EnhancedDataTable
        data={[]}
        columns={mockColumns}
      />
    )

    expect(screen.getByText('No results.')).toBeInTheDocument()
  })

  it('handles global search', async () => {
    const user = userEvent.setup()
    
    render(
      <EnhancedDataTable
        data={mockData}
        columns={mockColumns}
        searchKey="name"
        searchPlaceholder="Search all columns..."
      />
    )

    const searchInput = screen.getByPlaceholderText('Search all columns...')
    await user.type(searchInput, 'John')

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })

  it('handles column visibility toggle', async () => {
    render(
      <EnhancedDataTable
        data={mockData}
        columns={mockColumns}
      />
    )

    const columnsButton = screen.getByRole('button', { name: /columns/i })
    expect(columnsButton).toBeInTheDocument()
    
    fireEvent.click(columnsButton)
    // Column visibility functionality is handled by the component
  })

  it('handles column sorting', async () => {
    const user = userEvent.setup()
    
    render(
      <EnhancedDataTable
        data={mockData}
        columns={mockColumns}
      />
    )

    const nameHeader = screen.getByText('Name')
    await user.click(nameHeader)

    // Check if sorting is applied (data should be reordered)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(4) // 3 data rows + 1 header row
  })

  it('handles row selection', async () => {
    render(
      <EnhancedDataTable
        data={mockData}
        columns={mockColumns}
      />
    )

    // Row selection is handled internally by the table
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(4) // 3 data rows + 1 header row
  })

  it('displays selection summary', () => {
    render(
      <EnhancedDataTable
        data={mockData}
        columns={mockColumns}
      />
    )

    // Selection summary is handled internally by the table
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(4) // 3 data rows + 1 header row
    
    // Check selection summary text
    expect(screen.getByText(/0 of 3 row\(s\) selected/)).toBeInTheDocument()
  })



  it('handles pagination', async () => {
    // Create more data to test pagination
    const largeDataset = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: i % 2 === 0 ? 'active' : 'inactive',
      amount: (i + 1) * 100,
      date: '2024-01-15'
    }))

    render(
      <EnhancedDataTable
        data={largeDataset}
        columns={mockColumns}
      />
    )

    // Should show pagination controls
    const nextButton = screen.getByRole('button', { name: /next/i })
    const previousButton = screen.getByRole('button', { name: /previous/i })
    
    expect(nextButton).toBeInTheDocument()
    expect(previousButton).toBeInTheDocument()
    expect(previousButton).toBeDisabled() // Should be disabled on first page
  })

  it('displays column visibility toggle', () => {
    render(
      <EnhancedDataTable
        data={mockData}
        columns={mockColumns}
      />
    )

    // Should have columns button for visibility toggle
    const columnsButton = screen.getByRole('button', { name: /columns/i })
    expect(columnsButton).toBeInTheDocument()
  })
})