import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Workflows from '@/pages/Workflows'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase-client'

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: []
  })
}))

vi.mock('@/hooks/useAuthHook', () => ({
  useAuthHook: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true
  })
}))

vi.mock('@/hooks/useWorkflowEngine', () => ({
  useWorkflowEngine: () => ({
    executeWorkflow: vi.fn().mockResolvedValue({})
  })
}))

vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}))

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
}))

interface MockWorkflowBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  workflow?: { name?: string };
}

vi.mock('@/components/workflows/WorkflowBuilder', () => ({
  WorkflowBuilder: ({ isOpen, onClose, onSave, workflow }: MockWorkflowBuilderProps) => 
    isOpen ? (
      <div data-testid="workflow-builder">
        <button onClick={onClose}>Close Builder</button>
        <button onClick={onSave}>Save Workflow</button>
        <div>Editing: {workflow?.name || 'New Workflow'}</div>
      </div>
    ) : null
}))

interface MockWorkflowExecutionsProps {
  executions: unknown[];
  onRefresh: () => void;
}

vi.mock('@/components/workflows/WorkflowExecutions', () => ({
  WorkflowExecutions: ({ executions, onRefresh }: MockWorkflowExecutionsProps) => (
    <div data-testid="workflow-executions">
      <button onClick={onRefresh}>Refresh Executions</button>
      <div>Executions: {executions.length}</div>
    </div>
  )
}))

vi.mock('@/components/workflows/WorkflowEngine', () => ({
  WorkflowEngineProvider: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="workflow-engine-provider">{children}</div>
}))

// Mock UI components
interface MockButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: string;
  size?: string;
  type?: string;
  [key: string]: unknown;
}

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, type, ...props }: MockButtonProps) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      data-size={size}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/input', () => ({
  default: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />
}))

vi.mock('@/components/ui/textarea', () => ({
  default: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />
}))

interface MockSelectProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface MockSelectChildProps {
  children: React.ReactNode;
}

interface MockSelectItemProps {
  children: React.ReactNode;
  value: string;
}

interface MockSelectValueProps {
  placeholder?: string;
}

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue }: MockSelectProps) => (
    <div data-testid="select" data-value={defaultValue}>
      <div onClick={() => onValueChange?.('manual')}>{children}</div>
    </div>
  ),
  SelectContent: ({ children }: MockSelectChildProps) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: MockSelectItemProps) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: MockSelectChildProps) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: MockSelectValueProps) => <div data-testid="select-value">{placeholder}</div>
}))

interface MockCardChildProps {
  children: React.ReactNode;
}

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: MockCardChildProps) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: MockCardChildProps) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: MockCardChildProps) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: MockCardChildProps) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: MockCardChildProps) => <div data-testid="card-title">{children}</div>
}))

interface MockBadgeProps {
  children: React.ReactNode;
  variant?: string;
}

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: MockBadgeProps) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  )
}))

interface MockTabsProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface MockTabsContentProps {
  children: React.ReactNode;
  value: string;
}

interface MockTabsChildProps {
  children: React.ReactNode;
}

interface MockTabsTriggerProps {
  children: React.ReactNode;
  value: string;
}

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: MockTabsProps) => (
    <div data-testid="tabs" data-value={value}>
      <div onClick={() => onValueChange?.('templates')}>{children}</div>
    </div>
  ),
  TabsContent: ({ children, value }: MockTabsContentProps) => <div data-value={value}>{children}</div>,
  TabsList: ({ children }: MockTabsChildProps) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: MockTabsTriggerProps) => <div data-value={value}>{children}</div>
}))

interface MockDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MockDialogChildProps {
  children: React.ReactNode;
}

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: MockDialogProps) => (
    <div data-testid="dialog" data-open={open}>
      <div onClick={() => onOpenChange?.(false)}>{children}</div>
    </div>
  ),
  DialogContent: ({ children }: MockDialogChildProps) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: MockDialogChildProps) => <div>{children}</div>,
  DialogHeader: ({ children }: MockDialogChildProps) => <div>{children}</div>,
  DialogTitle: ({ children }: MockDialogChildProps) => <div>{children}</div>,
  DialogTrigger: ({ children }: MockDialogChildProps) => <div>{children}</div>
}))

interface MockFormChildProps {
  children: React.ReactNode;
}

interface MockFormFieldProps {
  render: (props: { field: { onChange: () => void; value: string; name: string } }) => React.ReactNode;
  name: string;
}

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: MockFormChildProps) => <form>{children}</form>,
  FormControl: ({ children }: MockFormChildProps) => <div>{children}</div>,
  FormDescription: ({ children }: MockFormChildProps) => <div>{children}</div>,
  FormField: ({ render, name }: MockFormFieldProps) => {
    const field = { onChange: vi.fn(), value: '', name }
    return render({ field })
  },
  FormItem: ({ children }: MockFormChildProps) => <div>{children}</div>,
  FormLabel: ({ children }: MockFormChildProps) => <label>{children}</label>,
  FormMessage: () => <div></div>
}))

// Mock icons
vi.mock('lucide-react', () => ({
  Workflow: () => <div data-testid="workflow-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckSquare: () => <div data-testid="check-square-icon" />,
  Bell: () => <div data-testid="bell-icon" />
}))

interface MockFormData {
  name: string;
  description: string;
  trigger_type: string;
  trigger_conditions: string;
  actions: string;
  is_active: boolean;
}

interface MockEvent {
  preventDefault?: () => void;
}

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: (data: MockFormData) => void) => (e: MockEvent) => {
      e?.preventDefault?.()
      fn({
        name: 'Test Workflow',
        description: 'Test Description',
        trigger_type: 'manual',
        trigger_conditions: '{}',
        actions: '[{"type": "email"}]',
        is_active: true
      })
    },
    reset: vi.fn(),
    formState: { errors: {} }
  })
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => vi.fn()
}))

const mockWorkflows = [
  {
    id: 'workflow-1',
    name: 'Welcome Email Workflow',
    description: 'Send welcome email to new leads',
    trigger_type: 'lead_created',
    trigger_conditions: {},
    actions: [{ type: 'email', template: 'welcome' }],
    is_active: true,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'workflow-2',
    name: 'Deal Stage Notification',
    description: 'Notify when deal moves to proposal',
    trigger_type: 'deal_stage_changed',
    trigger_conditions: { from_stage: 'qualification', to_stage: 'proposal' },
    actions: [{ type: 'notification', message: 'Deal moved to proposal' }],
    is_active: false,
    created_by: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

const mockExecutions = [
  {
    id: 'execution-1',
    workflow_template_id: 'workflow-1',
    entity_type: 'lead',
    entity_id: 'lead-1',
    status: 'completed',
    execution_data: { trigger: 'lead_created' },
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    error_message: null,
    workflow_template: mockWorkflows[0]
  }
]

describe('Workflows Page', () => {
  // These are already mocked at the top of the file
  // const { toast } = require('@/hooks/use-toast')
  // const { supabase } = require('@/lib/supabase-client')

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default successful responses
    supabase.from.mockImplementation((table: string) => {
      if (table === 'workflow_templates') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockWorkflows, error: null }))
          })),
          insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }
      }
      if (table === 'workflow_executions') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: mockExecutions, error: null }))
            }))
          }))
        }
      }
      return {
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => Promise.resolve({ data: null, error: null })),
        delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders the workflows page correctly', async () => {
      render(<Workflows />)
      
      expect(screen.getByTestId('workflow-engine-provider')).toBeInTheDocument()
      expect(screen.getByTestId('layout')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('Workflow Automation')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Automate your lead nurturing and deal progression')).toBeInTheDocument()
    })

    it('displays loading state initially', () => {
      render(<Workflows />)
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })

    it('renders header buttons', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Workflow Builder')).toBeInTheDocument()
        expect(screen.getByText('Create Workflow')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('loads workflows and executions on mount', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('workflow_templates')
        expect(supabase.from).toHaveBeenCalledWith('workflow_executions')
      })
    })

    it('handles workflow loading errors', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: null, error: new Error('Load failed') }))
            }))
          }
        }
        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load workflows',
          variant: 'destructive'
        })
      })
    })

    it('displays workflow statistics correctly', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Workflows')).toBeInTheDocument()
        expect(screen.getByText('Active Workflows')).toBeInTheDocument()
        expect(screen.getByText('Executions Today')).toBeInTheDocument()
        expect(screen.getByText('Success Rate')).toBeInTheDocument()
      })
    })
  })

  describe('Create Workflow Modal', () => {
    it('opens create workflow modal', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Workflow')
        fireEvent.click(createButton)
      })
      
      expect(screen.getByText('Create New Workflow')).toBeInTheDocument()
      expect(screen.getByText('Create an automated workflow to streamline your business processes')).toBeInTheDocument()
    })

    it('renders form fields in create modal', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Workflow')
        fireEvent.click(createButton)
      })
      
      expect(screen.getByText('Workflow Name')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Trigger Type')).toBeInTheDocument()
      expect(screen.getByText('Trigger Conditions (JSON)')).toBeInTheDocument()
      expect(screen.getByText('Actions (JSON Array)')).toBeInTheDocument()
    })

    it('submits workflow creation form', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Workflow')
        fireEvent.click(createButton)
      })
      
      const submitButton = screen.getByRole('button', { name: /create workflow/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('workflow_templates')
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Workflow created successfully'
        })
      })
    })

    it('handles workflow creation errors', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockWorkflows, error: null }))
            })),
            insert: vi.fn(() => Promise.resolve({ data: null, error: new Error('Creation failed') }))
          }
        }
        return { select: vi.fn(() => Promise.resolve({ data: [], error: null })) }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Workflow')
        fireEvent.click(createButton)
      })
      
      const submitButton = screen.getByRole('button', { name: /create workflow/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to create workflow',
          variant: 'destructive'
        })
      })
    })

    it('validates JSON format in form fields', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Workflow')
        fireEvent.click(createButton)
      })
      
      // Mock invalid JSON
      const mockUseForm = require('react-hook-form').useForm
      mockUseForm.mockReturnValueOnce({
        control: {},
        handleSubmit: (fn: (data: MockFormData) => void) => (e: MockEvent) => {
          e?.preventDefault?.()
          fn({
            name: 'Test',
            trigger_conditions: 'invalid json',
            actions: 'invalid json'
          })
        },
        reset: vi.fn(),
        formState: { errors: {} }
      })
      
      const submitButton = screen.getByRole('button', { name: /create workflow/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Invalid JSON format in conditions or actions',
          variant: 'destructive'
        })
      })
    })
  })

  describe('Workflow Operations', () => {
    it('toggles workflow status', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const pauseButton = screen.getByText('Pause')
      fireEvent.click(pauseButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Workflow deactivated successfully'
        })
      })
    })

    it('executes workflow', async () => {
      const mockWorkflowEngine = require('@/hooks/useWorkflowEngine').useWorkflowEngine()
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const executeButton = screen.getByText('Execute')
      fireEvent.click(executeButton)
      
      await waitFor(() => {
        expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith({
          title: 'Workflow started',
          description: 'Welcome Email Workflow is now running.'
        })
      })
    })

    it('deletes workflow with confirmation', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm
      window.confirm = vi.fn(() => true)
      
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this workflow?')
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Workflow deleted successfully'
        })
      })
      
      window.confirm = originalConfirm
    })

    it('cancels workflow deletion', async () => {
      const originalConfirm = window.confirm
      window.confirm = vi.fn(() => false)
      
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      
      expect(window.confirm).toHaveBeenCalled()
      expect(supabase.from().delete).not.toHaveBeenCalled()
      
      window.confirm = originalConfirm
    })
  })

  describe('Workflow Builder Integration', () => {
    it('opens workflow builder', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const builderButton = screen.getByText('Workflow Builder')
        fireEvent.click(builderButton)
      })
      
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      expect(screen.getByText('New Workflow')).toBeInTheDocument()
    })

    it('opens workflow builder for editing', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      expect(screen.getByText('Editing: Welcome Email Workflow')).toBeInTheDocument()
    })

    it('closes workflow builder', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const builderButton = screen.getByText('Workflow Builder')
        fireEvent.click(builderButton)
      })
      
      const closeButton = screen.getByText('Close Builder')
      fireEvent.click(closeButton)
      
      expect(screen.queryByTestId('workflow-builder')).not.toBeInTheDocument()
    })

    it('saves workflow from builder', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const builderButton = screen.getByText('Workflow Builder')
        fireEvent.click(builderButton)
      })
      
      const saveButton = screen.getByText('Save Workflow')
      fireEvent.click(saveButton)
      
      expect(screen.queryByTestId('workflow-builder')).not.toBeInTheDocument()
    })
  })

  describe('Tabs and Navigation', () => {
    it('switches between tabs', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Workflow Templates')).toBeInTheDocument()
        expect(screen.getByText('Execution History')).toBeInTheDocument()
      })
      
      const executionsTab = screen.getByText('Execution History')
      fireEvent.click(executionsTab)
      
      expect(screen.getByTestId('workflow-executions')).toBeInTheDocument()
    })

    it('displays workflow executions', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const executionsTab = screen.getByText('Execution History')
        fireEvent.click(executionsTab)
      })
      
      expect(screen.getByTestId('workflow-executions')).toBeInTheDocument()
      expect(screen.getByText('Executions: 1')).toBeInTheDocument()
    })

    it('refreshes executions', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        const executionsTab = screen.getByText('Execution History')
        fireEvent.click(executionsTab)
      })
      
      const refreshButton = screen.getByText('Refresh Executions')
      fireEvent.click(refreshButton)
      
      expect(supabase.from).toHaveBeenCalledWith('workflow_executions')
    })
  })

  describe('Empty States', () => {
    it('displays empty state when no workflows exist', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }
        }
        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('No workflows yet')).toBeInTheDocument()
        expect(screen.getByText('Create your first automated workflow to get started')).toBeInTheDocument()
      })
    })

    it('allows creating workflow from empty state', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }
        }
        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        const createButton = screen.getAllByText('Create Workflow')[1] // Second one is in empty state
        fireEvent.click(createButton)
      })
      
      expect(screen.getByText('Create New Workflow')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles workflow execution errors', async () => {
      const mockWorkflowEngine = require('@/hooks/useWorkflowEngine').useWorkflowEngine()
      mockWorkflowEngine.executeWorkflow.mockRejectedValueOnce(new Error('Execution failed'))
      
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const executeButton = screen.getByText('Execute')
      fireEvent.click(executeButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to execute workflow.',
          variant: 'destructive'
        })
      })
    })

    it('handles workflow status toggle errors', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockWorkflows, error: null }))
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: new Error('Update failed') }))
            }))
          }
        }
        return { select: vi.fn(() => Promise.resolve({ data: [], error: null })) }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const pauseButton = screen.getByText('Pause')
      fireEvent.click(pauseButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to update workflow status',
          variant: 'destructive'
        })
      })
    })

    it('handles workflow deletion errors', async () => {
      const originalConfirm = window.confirm
      window.confirm = vi.fn(() => true)
      
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockWorkflows, error: null }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: new Error('Delete failed') }))
            }))
          }
        }
        return { select: vi.fn(() => Promise.resolve({ data: [], error: null })) }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to delete workflow',
          variant: 'destructive'
        })
      })
      
      window.confirm = originalConfirm
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create workflow/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /workflow builder/i })).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Workflows />)
      
      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create workflow/i })
        expect(createButton).toBeInTheDocument()
      })
      
      const createButton = screen.getByRole('button', { name: /create workflow/i })
      await user.tab()
      expect(createButton).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('handles large workflow lists efficiently', async () => {
      const largeWorkflowList = Array.from({ length: 100 }, (_, i) => ({
        ...mockWorkflows[0],
        id: `workflow-${i}`,
        name: `Workflow ${i}`
      }))
      
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: largeWorkflowList, error: null }))
            }))
          }
        }
        return { select: vi.fn(() => Promise.resolve({ data: [], error: null })) }
      })

      const startTime = performance.now()
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Workflow 0')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should render within 1 second
    })

    it('debounces rapid workflow operations', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const executeButton = screen.getByText('Execute')
      
      // Rapid clicks
      fireEvent.click(executeButton)
      fireEvent.click(executeButton)
      fireEvent.click(executeButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledTimes(1) // Should only execute once
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles workflows with missing data gracefully', async () => {
      const incompleteWorkflow = {
        id: 'incomplete-1',
        name: 'Incomplete Workflow',
        description: null,
        trigger_type: 'manual',
        trigger_conditions: {},
        actions: [],
        is_active: true,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [incompleteWorkflow], error: null }))
            }))
          }
        }
        return { select: vi.fn(() => Promise.resolve({ data: [], error: null })) }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Workflow')).toBeInTheDocument()
        expect(screen.getByText('Actions: 0')).toBeInTheDocument()
      })
    })

    it('handles network connectivity issues', async () => {
      supabase.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      render(<Workflows />)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load workflows',
          variant: 'destructive'
        })
      })
    })

    it('handles concurrent workflow operations', async () => {
      render(<Workflows />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email Workflow')).toBeInTheDocument()
      })
      
      const executeButton = screen.getByText('Execute')
      const pauseButton = screen.getByText('Pause')
      
      // Simulate concurrent operations
      fireEvent.click(executeButton)
      fireEvent.click(pauseButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledTimes(2)
      })
    })

    it('validates workflow execution prerequisites', async () => {
      const inactiveWorkflow = {
        ...mockWorkflows[0],
        is_active: false
      }
      
      supabase.from.mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [inactiveWorkflow], error: null }))
            }))
          }
        }
        return { select: vi.fn(() => Promise.resolve({ data: [], error: null })) }
      })

      render(<Workflows />)
      
      await waitFor(() => {
        const executeButton = screen.getByText('Execute')
        expect(executeButton).toBeDisabled()
      })
    })
  })
})