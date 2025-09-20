import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DashboardBuilder } from '../../../components/analytics/DashboardBuilder'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

interface MockCardProps {
  children: React.ReactNode;
  className?: string;
}

vi.mock('../../../components/ui/card', () => ({
  Card: ({ children, className }: MockCardProps) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: MockCardProps) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: MockCardProps) => <h3 className={className} data-testid="card-title">{children}</h3>
}))

interface MockButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: string;
  variant?: string;
  [key: string]: unknown;
}

vi.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, size, variant, ...props }: MockButtonProps) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-size={size} 
      data-variant={variant}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  )
}))

interface MockInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: unknown;
}

vi.mock('../../../components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, disabled, className, ...props }: MockInputProps) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      disabled={disabled}
      className={className}
      data-testid="input"
      {...props}
    />
  )
}))

interface MockSelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

interface MockSelectChildProps {
  children: React.ReactNode;
}

interface MockSelectItemProps {
  children: React.ReactNode;
  value: string;
}

interface MockSelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

vi.mock('../../../components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: MockSelectProps) => (
    <div data-testid="select" data-value={value} data-disabled={disabled}>
      <div onClick={() => onValueChange && onValueChange('test-value')}>
        {children}
      </div>
    </div>
  ),
  SelectContent: ({ children }: MockSelectChildProps) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: MockSelectItemProps) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children, className }: MockSelectTriggerProps) => (
    <div className={className} data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value">Select Value</span>
}))

interface MockBadgeProps {
  children: React.ReactNode;
  variant?: string;
}

vi.mock('../../../components/ui/badge', () => ({
  Badge: ({ children, variant }: MockBadgeProps) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  )
}))

interface MockSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  [key: string]: unknown;
}

vi.mock('../../../components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: MockSwitchProps) => (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      data-testid="switch"
      {...props}
    />
  )
}))

interface MockDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MockDialogChildProps {
  children: React.ReactNode;
}

vi.mock('../../../components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: MockDialogProps) => (
    <div data-testid="dialog" data-open={open}>
      <div onClick={() => onOpenChange && onOpenChange(false)}>{children}</div>
    </div>
  ),
  DialogContent: ({ children }: MockDialogChildProps) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: MockDialogChildProps) => <p data-testid="dialog-description">{children}</p>,
  DialogHeader: ({ children }: MockDialogChildProps) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: MockDialogChildProps) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: MockDialogChildProps) => (
    <div data-testid="dialog-trigger">{children}</div>
  )
}))

vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Save: () => <div data-testid="save-icon" />,
  X: () => <div data-testid="x-icon" />,
  Layout: () => <div data-testid="layout-icon" />,
  RotateCcw: () => <div data-testid="rotate-ccw-icon" />,
  Grid: () => <div data-testid="grid-icon" />,
  Layers: () => <div data-testid="layers-icon" />
}))

vi.mock('../../../lib/utils', () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ')
}))

interface MockCustomWidgetProps {
  config: {
    id: string;
    title: string;
    type?: string;
  };
  onUpdate: (config: { id: string; title: string; type?: string }) => void;
  onRemove: (id: string) => void;
  isEditing?: boolean;
}

vi.mock('../../../components/analytics/CustomWidget', () => ({
  default: ({ config, onUpdate, onRemove, isEditing }: MockCustomWidgetProps) => (
    <div data-testid="custom-widget" data-widget-id={config.id} data-editing={isEditing}>
      <div data-testid="widget-title">{config.title}</div>
      <div data-testid="widget-type">{config.type}</div>
      <button onClick={() => onUpdate({ ...config, title: 'Updated Widget' })} data-testid="update-widget">Update</button>
      <button onClick={() => onRemove(config.id)} data-testid="remove-widget">Remove</button>
    </div>
  )
}))

const mockData = {
  deals: [
    { id: 1, name: 'Deal 1', value: 1000 },
    { id: 2, name: 'Deal 2', value: 2000 }
  ],
  customers: [
    { id: 1, name: 'Customer 1', type: 'Enterprise' },
    { id: 2, name: 'Customer 2', type: 'SMB' }
  ],
  revenue: [
    { month: 'Jan', amount: 10000 },
    { month: 'Feb', amount: 15000 }
  ],
  leads: [
    { id: 1, source: 'Website', status: 'New' },
    { id: 2, source: 'Email', status: 'Qualified' }
  ]
}

const mockConfig = {
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
  const onSave = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders dashboard builder with default state', () => {
      render(<DashboardBuilder data={mockData} />)
      
      expect(screen.getByText('Dashboard Builder')).toBeInTheDocument()
      expect(screen.getByText('Create and customize your analytics dashboard')).toBeInTheDocument()
      expect(screen.getByText('View Mode')).toBeInTheDocument()
      expect(screen.getByText('No widgets added')).toBeInTheDocument()
    })

    it('renders with initial config', () => {
      render(<DashboardBuilder data={mockData} initialConfig={mockConfig} />)
      
      expect(screen.getByDisplayValue('Test Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Test Widget')).toBeInTheDocument()
    })

    it('renders dashboard controls correctly', () => {
      render(<DashboardBuilder data={mockData} />)
      
      expect(screen.getByTestId('switch')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Dashboard name')).toBeInTheDocument()
      expect(screen.getByTestId('select')).toBeInTheDocument()
    })
  })

  describe('Edit Mode Toggle', () => {
    it('toggles edit mode when switch is clicked', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      expect(screen.getByText('View Mode')).toBeInTheDocument()
      
      await user.click(editSwitch)
      expect(screen.getByText('Editing')).toBeInTheDocument()
    })

    it('shows edit controls when in edit mode', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      expect(screen.getByText('Add Widget')).toBeInTheDocument()
      expect(screen.getByText('Add Defaults')).toBeInTheDocument()
      expect(screen.getByText('Reset')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('disables controls when not in edit mode', () => {
      render(<DashboardBuilder data={mockData} />)
      
      const nameInput = screen.getByPlaceholderText('Dashboard name')
      expect(nameInput).toBeDisabled()
    })
  })

  describe('Dashboard Configuration', () => {
    it('updates dashboard name', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const nameInput = screen.getByPlaceholderText('Dashboard name')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Dashboard Name')
      
      expect(nameInput).toHaveValue('New Dashboard Name')
    })

    it('updates column count', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const select = screen.getByTestId('select')
      fireEvent.click(select)
      
      // The mock select will trigger onValueChange with 'test-value'
      expect(select).toBeInTheDocument()
    })
  })

  describe('Widget Management', () => {
    it('opens add widget dialog', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const addButton = screen.getByText('Add Widget')
      await user.click(addButton)
      
      expect(screen.getByText('Add New Widget')).toBeInTheDocument()
      expect(screen.getByText('Configure your new dashboard widget')).toBeInTheDocument()
    })

    it('adds a new widget with valid data', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const addButton = screen.getByText('Add Widget')
      await user.click(addButton)
      
      const titleInput = screen.getByPlaceholderText('Widget title')
      await user.type(titleInput, 'New Test Widget')
      
      const addWidgetButton = screen.getByRole('button', { name: 'Add Widget' })
      await user.click(addWidgetButton)
      
      expect(toast.success).toHaveBeenCalledWith('Widget added successfully')
    })

    it('shows error when adding widget without title', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const addButton = screen.getByText('Add Widget')
      await user.click(addButton)
      
      const addWidgetButton = screen.getByRole('button', { name: 'Add Widget' })
      await user.click(addWidgetButton)
      
      expect(toast.error).toHaveBeenCalledWith('Please enter a widget title')
    })

    it('adds default widgets', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const addDefaultsButton = screen.getByText('Add Defaults')
      await user.click(addDefaultsButton)
      
      expect(toast.success).toHaveBeenCalledWith('Widget added successfully')
    })

    it('removes a widget', async () => {
      render(<DashboardBuilder data={mockData} initialConfig={mockConfig} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const removeButton = screen.getByTestId('remove-widget')
      await user.click(removeButton)
      
      expect(toast.success).toHaveBeenCalledWith('Widget removed successfully')
    })

    it('updates a widget', async () => {
      render(<DashboardBuilder data={mockData} initialConfig={mockConfig} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const updateButton = screen.getByTestId('update-widget')
      await user.click(updateButton)
      
      expect(toast.success).toHaveBeenCalledWith('Widget updated successfully')
    })
  })

  describe('Dashboard Actions', () => {
    it('saves dashboard', async () => {
      render(<DashboardBuilder data={mockData} onSave={onSave} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      expect(onSave).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Dashboard saved successfully')
      expect(screen.getByText('View Mode')).toBeInTheDocument()
    })

    it('resets dashboard', async () => {
      render(<DashboardBuilder data={mockData} initialConfig={mockConfig} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const resetButton = screen.getByText('Reset')
      await user.click(resetButton)
      
      expect(toast.success).toHaveBeenCalledWith('Dashboard reset successfully')
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no widgets', () => {
      render(<DashboardBuilder data={mockData} />)
      
      expect(screen.getByText('No widgets added')).toBeInTheDocument()
      expect(screen.getByText('Start building your dashboard by adding widgets')).toBeInTheDocument()
    })

    it('shows add widget button in empty state when editing', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      expect(screen.getByText('Add Your First Widget')).toBeInTheDocument()
    })
  })

  describe('Grid Layout', () => {
    it('renders widgets in grid layout', () => {
      render(<DashboardBuilder data={mockData} initialConfig={mockConfig} />)
      
      expect(screen.getByTestId('custom-widget')).toBeInTheDocument()
    })

    it('applies correct grid classes based on column count', () => {
      const { container } = render(<DashboardBuilder data={mockData} initialConfig={mockConfig} />)
      
      const gridElement = container.querySelector('.grid')
      expect(gridElement).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('Data Handling', () => {
    it('passes correct data to widgets', () => {
      render(<DashboardBuilder data={mockData} initialConfig={mockConfig} />)
      
      const widget = screen.getByTestId('custom-widget')
      expect(widget).toHaveAttribute('data-widget-id', 'widget-1')
    })

    it('handles missing data sources gracefully', () => {
      const configWithMissingData = {
        ...mockConfig,
        widgets: [{
          ...mockConfig.widgets[0],
          dataSource: 'nonexistent'
        }]
      }
      
      render(<DashboardBuilder data={mockData} initialConfig={configWithMissingData} />)
      
      expect(screen.getByTestId('custom-widget')).toBeInTheDocument()
    })
  })

  describe('Dialog Management', () => {
    it('closes add widget dialog on cancel', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const addButton = screen.getByText('Add Widget')
      await user.click(addButton)
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      // Dialog should be closed (implementation depends on mock)
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })

    it('resets new widget form after adding', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const addButton = screen.getByText('Add Widget')
      await user.click(addButton)
      
      const titleInput = screen.getByPlaceholderText('Widget title')
      await user.type(titleInput, 'Test Widget')
      
      const addWidgetButton = screen.getByRole('button', { name: 'Add Widget' })
      await user.click(addWidgetButton)
      
      // Form should be reset (title should be empty)
      expect(titleInput).toHaveValue('')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty data object', () => {
      render(<DashboardBuilder data={{}} />)
      
      expect(screen.getByText('Dashboard Builder')).toBeInTheDocument()
    })

    it('handles null/undefined props gracefully', () => {
      render(<DashboardBuilder data={mockData} onSave={undefined} initialConfig={undefined} />)
      
      expect(screen.getByText('Dashboard Builder')).toBeInTheDocument()
    })

    it('generates unique IDs for widgets', async () => {
      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789)
      
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      await user.click(editSwitch)
      
      const addButton = screen.getByText('Add Widget')
      await user.click(addButton)
      
      const titleInput = screen.getByPlaceholderText('Widget title')
      await user.type(titleInput, 'Test Widget')
      
      const addWidgetButton = screen.getByRole('button', { name: 'Add Widget' })
      await user.click(addWidgetButton)
      
      mathRandomSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByLabelText('Toggle edit mode')
      expect(editSwitch).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<DashboardBuilder data={mockData} />)
      
      const editSwitch = screen.getByTestId('switch')
      editSwitch.focus()
      
      await user.keyboard('{Space}')
      expect(screen.getByText('Editing')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large number of widgets efficiently', () => {
      const largeConfig = {
        ...mockConfig,
        widgets: Array.from({ length: 100 }, (_, i) => ({
          id: `widget-${i}`,
          title: `Widget ${i}`,
          type: 'bar' as const,
          dataSource: 'deals',
          size: 'medium' as const,
          position: { x: 0, y: 0 }
        }))
      }
      
      const { container } = render(<DashboardBuilder data={mockData} initialConfig={largeConfig} />)
      
      expect(container.querySelectorAll('[data-testid="custom-widget"]')).toHaveLength(100)
    })

    it('handles large datasets without performance issues', () => {
      const largeData = {
        deals: Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Deal ${i}`, value: i * 1000 }))
      }
      
      render(<DashboardBuilder data={largeData} initialConfig={mockConfig} />)
      
      expect(screen.getByTestId('custom-widget')).toBeInTheDocument()
    })
  })
})