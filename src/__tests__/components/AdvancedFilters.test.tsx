import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdvancedFilters, FilterField } from '@/components/filters/AdvancedFilters'
import '@testing-library/jest-dom/vitest'

const mockFilterFields: FilterField[] = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Enter name...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  },
  {
    key: 'tags',
    label: 'Tags',
    type: 'multiselect',
    options: [
      { label: 'VIP', value: 'vip' },
      { label: 'New', value: 'new' },
      { label: 'Premium', value: 'premium' }
    ]
  },
  {
    key: 'created_date',
    label: 'Created Date',
    type: 'date'
  },
  {
    key: 'date_range',
    label: 'Date Range',
    type: 'daterange'
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'number',
    min: 0,
    max: 100000
  },
  {
    key: 'price_range',
    label: 'Price Range',
    type: 'numberrange',
    min: 0,
    max: 10000
  },
  {
    key: 'is_active',
    label: 'Is Active',
    type: 'boolean'
  }
]

describe('AdvancedFilters', () => {
  const mockOnChange = vi.fn()
  const mockOnReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter trigger button', () => {
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('opens filter popover when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
  })

  it('renders all filter fields', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('Created Date')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Price Range')).toBeInTheDocument()
    expect(screen.getByText('Is Active')).toBeInTheDocument()
  })

  it('handles text input changes', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    const nameInput = screen.getByPlaceholderText('Enter name...')
    await user.type(nameInput, 'John Doe')

    expect(mockOnChange).toHaveBeenCalledWith({
      name: 'John Doe'
    })
  })

  it('handles select changes', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    // Find and click the status select
    const statusSelect = screen.getByRole('combobox')
    await user.click(statusSelect)
    
    await user.click(screen.getByText('Active'))

    expect(mockOnChange).toHaveBeenCalledWith({
      status: 'active'
    })
  })

  it('handles boolean toggle', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    const booleanCheckbox = screen.getByLabelText('Is Active')
    await user.click(booleanCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      is_active: true
    })
  })

  it('handles number input changes', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    const amountInput = screen.getByLabelText('Amount')
    await user.type(amountInput, '5000')

    expect(mockOnChange).toHaveBeenCalledWith({
      amount: 5000
    })
  })

  it('displays active filter count', () => {
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{ name: 'John', status: 'active' }}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows active filters as badges', () => {
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{ name: 'John', status: 'active' }}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('Name: John')).toBeInTheDocument()
    expect(screen.getByText('Status: active')).toBeInTheDocument()
  })

  it('allows removing individual filters', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{ name: 'John', status: 'active' }}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    // Find the X buttons in the filter badges
    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg.lucide-x')
    )
    await user.click(removeButtons[0])

    expect(mockOnChange).toHaveBeenCalledWith({
      status: 'active'
    })
  })

  it('resets all filters when reset button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{ name: 'John', status: 'active' }}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    await user.click(screen.getByText('Reset'))

    expect(mockOnReset).toHaveBeenCalled()
  })

  it('handles date input changes', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    // Find the date input for 'Created Date'
    const dateInputs = screen.getAllByDisplayValue('')
    const createdDateInput = dateInputs.find(input => 
      input.getAttribute('type') === 'date'
    )
    
    expect(createdDateInput).toBeInTheDocument()
    
    // Set a date value
    if (createdDateInput) {
      await user.type(createdDateInput, '2024-01-15')
      expect(mockOnChange).toHaveBeenCalled()
    }
  })

  it('handles multiselect changes', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    // Find checkboxes for VIP and Premium
    const vipCheckbox = screen.getByLabelText('VIP')
    const premiumCheckbox = screen.getByLabelText('Premium')
    
    await user.click(vipCheckbox)
    await user.click(premiumCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      tags: ['vip', 'premium']
    })
  })

  it('renders number range slider', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{}}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    // Check that the price range field is rendered
    expect(screen.getByText('Price Range')).toBeInTheDocument()
  })

  it('preserves existing values when updating', async () => {
    const user = userEvent.setup()
    
    render(
      <AdvancedFilters
        fields={mockFilterFields}
        values={{ name: 'John' }}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Filters'))
    
    const statusSelect = screen.getByRole('combobox')
    await user.click(statusSelect)
    await user.click(screen.getByText('Active'))

    expect(mockOnChange).toHaveBeenCalledWith({
      name: 'John',
      status: 'active'
    })
  })
})