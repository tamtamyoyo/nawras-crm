import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import DashboardBuilder from '../DashboardBuilder'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

interface MockCustomWidgetProps {
  config: {
    id: string;
    title: string;
    type: string;
    dataSource: string;
  };
  onUpdate: (config: { id: string; title: string; type: string; dataSource: string }) => void;
  onRemove: (id: string) => void;
  isEditing?: boolean;
}

// Mock CustomWidget component
vi.mock('../CustomWidget', () => ({
  CustomWidget: ({ config, onUpdate, onRemove, isEditing }: MockCustomWidgetProps) => (
    <div data-testid={`widget-${config.id}`}>
      <div>{config.title}</div>
      <div>{config.type}</div>
      <div>{config.dataSource}</div>
      {isEditing && (
        <>
          <button onClick={() => onUpdate({ ...config, title: 'Updated' })}>Update</button>
          <button onClick={() => onRemove(config.id)}>Remove</button>
        </>
      )}
    </div>
  )
}))

const mockData = {
  deals: [
    { name: 'Deal 1', value: 1000 },
    { name: 'Deal 2', value: 1500 }
  ],
  customers: [
    { name: 'Customer 1', value: 100 },
    { name: 'Customer 2', value: 150 }
  ],
  revenue: [
    { month: 'Jan', amount: 5000 },
    { month: 'Feb', amount: 6000 }
  ],
  leads: [
    { source: 'Website', count: 50 },
    { source: 'Email', count: 30 }
  ],
  performance: [
    { metric: 'Conversion', value: 0.15 },
    { metric: 'Retention', value: 0.85 }
  ]
}

const mockInitialConfig = {
  id: 'test-dashboard',
  name: 'Test Dashboard',
  widgets: [
    {
      id: 'widget-1',
      title: 'Test Widget',
      type: 'bar' as const,
      dataSource: 'deals',
      size: 'medium' as const,
      position: { x: 0, y: 0 }
    }
  ],
  layout: 'grid' as const,
  columns: 3
}

describe('DashboardBuilder', () => {
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard builder with default configuration', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    expect(screen.getByText('Dashboard Builder')).toBeInTheDocument()
    expect(screen.getByText('Create and customize your analytics dashboard')).toBeInTheDocument()
    expect(screen.getByDisplayValue('My Dashboard')).toBeInTheDocument()
    expect(screen.getByText('View Mode')).toBeInTheDocument()
  })

  it('renders with initial configuration', () => {
    render(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={mockInitialConfig}
      />
    )

    expect(screen.getByDisplayValue('Test Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('widget-widget-1')).toBeInTheDocument()
    expect(screen.getByText('Test Widget')).toBeInTheDocument()
  })

  it('shows empty state when no widgets are added', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    expect(screen.getByText('No widgets added')).toBeInTheDocument()
    expect(screen.getByText('Start building your dashboard by adding widgets')).toBeInTheDocument()
  })

  it('toggles edit mode when switch is clicked', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    
    expect(screen.getByText('View Mode')).toBeInTheDocument()
    
    fireEvent.click(editSwitch)
    
    expect(screen.getByText('Editing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add widget/i })).toBeInTheDocument()
  })

  it('updates dashboard name', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode first
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const nameInput = screen.getByDisplayValue('My Dashboard')
    fireEvent.change(nameInput, { target: { value: 'Updated Dashboard' } })

    expect(screen.getByDisplayValue('Updated Dashboard')).toBeInTheDocument()
  })

  it('changes dashboard columns', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode first
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const columnsSelect = screen.getByDisplayValue('3 Columns')
    fireEvent.click(columnsSelect)
    
    const fourColumnsOption = screen.getByText('4 Columns')
    fireEvent.click(fourColumnsOption)

    expect(screen.getByDisplayValue('4 Columns')).toBeInTheDocument()
  })

  it('opens add widget dialog when add widget button is clicked', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode first
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const addWidgetButton = screen.getByRole('button', { name: /add widget/i })
    fireEvent.click(addWidgetButton)

    expect(screen.getByText('Add New Widget')).toBeInTheDocument()
    expect(screen.getByText('Configure your new dashboard widget')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
  })

  it('adds a new widget through the dialog', async () => {
    const { toast } = await import('sonner')
    
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    // Open add widget dialog
    const addWidgetButton = screen.getByRole('button', { name: /add widget/i })
    fireEvent.click(addWidgetButton)

    // Fill in widget details
    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, { target: { value: 'New Test Widget' } })

    const chartTypeSelect = screen.getByDisplayValue('Bar Chart')
    fireEvent.click(chartTypeSelect)
    const lineChartOption = screen.getByText('Line Chart')
    fireEvent.click(lineChartOption)

    const dataSourceSelect = screen.getByDisplayValue('Deals')
    fireEvent.click(dataSourceSelect)
    const customersOption = screen.getByText('Customers')
    fireEvent.click(customersOption)

    const sizeSelect = screen.getByDisplayValue('Medium')
    fireEvent.click(sizeSelect)
    const largeOption = screen.getByText('Large')
    fireEvent.click(largeOption)

    // Add the widget
    const addButton = screen.getByRole('button', { name: 'Add Widget' })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Widget added successfully')
    })

    expect(screen.getByText('New Test Widget')).toBeInTheDocument()
  })

  it('shows error when trying to add widget without title', async () => {
    const { toast } = await import('sonner')
    
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    // Open add widget dialog
    const addWidgetButton = screen.getByRole('button', { name: /add widget/i })
    fireEvent.click(addWidgetButton)

    // Try to add widget without title
    const addButton = screen.getByRole('button', { name: 'Add Widget' })
    fireEvent.click(addButton)

    expect(toast.error).toHaveBeenCalledWith('Please enter a widget title')
  })

  it('cancels widget addition when cancel button is clicked', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    // Open add widget dialog
    const addWidgetButton = screen.getByRole('button', { name: /add widget/i })
    fireEvent.click(addWidgetButton)

    // Fill in title
    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, { target: { value: 'Test Widget' } })

    // Cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    // Dialog should be closed and no widget added
    expect(screen.queryByText('Add New Widget')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Widget')).not.toBeInTheDocument()
  })

  it('adds default widgets when add defaults button is clicked', async () => {
    const { toast } = await import('sonner')
    
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const addDefaultsButton = screen.getByRole('button', { name: /add defaults/i })
    fireEvent.click(addDefaultsButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(5) // 5 default widgets
    })

    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Deals Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Customer Growth')).toBeInTheDocument()
    expect(screen.getByText('Lead Sources')).toBeInTheDocument()
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument()
  })

  it('resets dashboard when reset button is clicked', async () => {
    const { toast } = await import('sonner')
    
    render(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={mockInitialConfig}
      />
    )

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    // Verify widget exists
    expect(screen.getByTestId('widget-widget-1')).toBeInTheDocument()

    const resetButton = screen.getByRole('button', { name: /reset/i })
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Dashboard reset successfully')
    })

    expect(screen.queryByTestId('widget-widget-1')).not.toBeInTheDocument()
    expect(screen.getByText('No widgets added')).toBeInTheDocument()
  })

  it('saves dashboard when save button is clicked', async () => {
    const { toast } = await import('sonner')
    
    render(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={mockInitialConfig}
      />
    )

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Dashboard saved successfully')
    })

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-dashboard',
        name: 'Test Dashboard',
        widgets: expect.arrayContaining([
          expect.objectContaining({ id: 'widget-1' })
        ])
      })
    )

    expect(screen.getByText('View Mode')).toBeInTheDocument()
  })

  it('updates widget when widget update is triggered', async () => {
    const { toast } = await import('sonner')
    
    render(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={mockInitialConfig}
      />
    )

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const updateButton = screen.getByRole('button', { name: 'Update' })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Widget updated successfully')
    })

    expect(screen.getByText('Updated')).toBeInTheDocument()
  })

  it('removes widget when widget remove is triggered', async () => {
    const { toast } = await import('sonner')
    
    render(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={mockInitialConfig}
      />
    )

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const removeButton = screen.getByRole('button', { name: 'Remove' })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Widget removed successfully')
    })

    expect(screen.queryByTestId('widget-widget-1')).not.toBeInTheDocument()
    expect(screen.getByText('No widgets added')).toBeInTheDocument()
  })

  it('shows add first widget button in empty state when editing', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    expect(screen.getByRole('button', { name: /add your first widget/i })).toBeInTheDocument()
  })

  it('opens add widget dialog when add first widget button is clicked', () => {
    render(<DashboardBuilder data={mockData} onSave={mockOnSave} />)

    // Enable edit mode
    const editSwitch = screen.getByRole('switch', { name: /toggle edit mode/i })
    fireEvent.click(editSwitch)

    const addFirstWidgetButton = screen.getByRole('button', { name: /add your first widget/i })
    fireEvent.click(addFirstWidgetButton)

    expect(screen.getByText('Add New Widget')).toBeInTheDocument()
  })

  it('applies correct grid classes based on column count', () => {
    const { container, rerender } = render(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={{ ...mockInitialConfig, columns: 2 }}
      />
    )

    let gridElement = container.querySelector('.grid')
    expect(gridElement).toHaveClass('grid-cols-1', 'md:grid-cols-2')

    rerender(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={{ ...mockInitialConfig, columns: 4 }}
      />
    )

    gridElement = container.querySelector('.grid')
    expect(gridElement).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('disables controls when not in edit mode', () => {
    render(
      <DashboardBuilder
        data={mockData}
        onSave={mockOnSave}
        initialConfig={mockInitialConfig}
      />
    )

    const nameInput = screen.getByDisplayValue('Test Dashboard')
    const columnsSelect = screen.getByDisplayValue('3 Columns')

    expect(nameInput).toBeDisabled()
    expect(columnsSelect).toBeDisabled()
    expect(screen.queryByRole('button', { name: /add widget/i })).not.toBeInTheDocument()
  })

  it('handles missing data sources gracefully', () => {
    const incompleteData = { deals: mockData.deals }
    
    render(
      <DashboardBuilder
        data={incompleteData}
        onSave={mockOnSave}
        initialConfig={{
          ...mockInitialConfig,
          widgets: [
            {
              id: 'widget-1',
              title: 'Missing Data Widget',
              type: 'bar' as const,
              dataSource: 'nonexistent',
              size: 'medium' as const,
              position: { x: 0, y: 0 }
            }
          ]
        }}
      />
    )

    expect(screen.getByTestId('widget-widget-1')).toBeInTheDocument()
    expect(screen.getByText('Missing Data Widget')).toBeInTheDocument()
  })
})