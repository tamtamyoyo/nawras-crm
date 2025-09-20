import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// Mock Sentry - must be at the top level
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withErrorBoundary: vi.fn((component) => component),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  addBreadcrumb: vi.fn(),
  configureScope: vi.fn(),
  getCurrentHub: vi.fn(() => ({
    getClient: vi.fn(() => ({
      getOptions: vi.fn(() => ({}))
    }))
  })),
  startTransaction: vi.fn(() => ({
    setStatus: vi.fn(),
    finish: vi.fn()
  }))
}))

// Make React and hooks available globally for tests
global.React = React
global.useState = useState
global.useEffect = useEffect
global.useCallback = useCallback
global.useMemo = useMemo
global.useRef = useRef

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn()
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock fetch
global.fetch = vi.fn()

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-url')
})

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
})

// Mock performance.now
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now())
  }
})

// Mock DragEvent
class MockDragEvent extends Event {
  dataTransfer: DataTransfer
  
  constructor(type: string, eventInitDict?: DragEventInit) {
    super(type, eventInitDict)
    this.dataTransfer = {
      dropEffect: 'none',
      effectAllowed: 'all',
      files: [] as FileList,
      items: [] as DataTransferItemList,
      types: [],
      clearData: vi.fn(),
      getData: vi.fn(),
      setData: vi.fn(),
      setDragImage: vi.fn()
    } as DataTransfer
  }
}

global.DragEvent = MockDragEvent as typeof DragEvent

// Mock HTMLElement.prototype methods
HTMLElement.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()
HTMLElement.prototype.setPointerCapture = vi.fn()

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => React.createElement('div', { 'data-testid': 'card', className, ...props }, children),
  CardHeader: ({ children, className, ...props }: any) => React.createElement('div', { 'data-testid': 'card-header', className, ...props }, children),
  CardContent: ({ children, className, ...props }: any) => React.createElement('div', { 'data-testid': 'card-content', className, ...props }, children),
  CardTitle: ({ children, className, ...props }: any) => React.createElement('h3', { 'data-testid': 'card-title', className, ...props }, children)
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => React.createElement('button', { 'data-testid': 'button', onClick, className, ...props }, children)
}))

vi.mock('@/components/ui/select', () => {
  const SelectContext = React.createContext<{ onValueChange?: (value: string) => void }>({});
  
  return {
    Select: ({ children, onValueChange, ...props }: any) => 
      React.createElement(SelectContext.Provider, { value: { onValueChange } },
        React.createElement('div', { 'data-testid': 'select', ...props }, children)
      ),
    SelectContent: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'select-content', ...props }, children),
    SelectItem: ({ children, value, ...props }: any) => {
      const context = React.useContext(SelectContext);
      return React.createElement('div', { 
        'data-testid': 'select-item', 
        'data-value': value, 
        role: 'option',
        onClick: () => context.onValueChange?.(value),
        ...props 
      }, children);
    },
    SelectTrigger: ({ children, ...props }: any) => React.createElement('button', { 'data-testid': 'select-trigger', role: 'combobox', 'aria-expanded': false, ...props }, children),
    SelectValue: ({ placeholder, ...props }: any) => React.createElement('span', { 'data-testid': 'select-value', ...props }, placeholder)
  }
})

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => React.createElement('span', { 'data-testid': 'badge', className, ...props }, children)
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => React.createElement('input', { 'data-testid': 'switch', type: 'checkbox', checked, onChange: (e: any) => onCheckedChange?.(e.target.checked), ...props })
}))

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))

// Mock AdvancedChart component to avoid Recharts DOM issues
vi.mock('@/components/analytics/AdvancedChart', () => ({
  AdvancedChart: ({ data, config, onConfigChange, className }: any) => {
    return React.createElement('div', { 'data-testid': 'advanced-chart', className },
      React.createElement('div', { 'data-testid': 'card' },
        React.createElement('div', { 'data-testid': 'card-header' },
          React.createElement('div', { 'data-testid': 'card-title' }, config?.title || 'Chart'),
          React.createElement('span', { 'data-testid': 'badge' }, config?.type || 'bar')
        ),
        React.createElement('div', { 'data-testid': 'card-content' },
          React.createElement('div', { 'data-testid': 'responsive-container' }, 'Chart Container'),
          React.createElement('button', { 'data-testid': 'button', onClick: () => {} }, 'Export'),
          React.createElement('button', { 'data-testid': 'button', onClick: () => {} }, 'Settings')
        )
      )
    )
  }
}))

// Mock DashboardBuilder component to avoid similar issues
vi.mock('@/components/analytics/DashboardBuilder', () => ({
  DashboardBuilder: ({ config, onConfigChange, className }: any) => {
    return React.createElement('div', { 'data-testid': 'dashboard-builder', className },
      React.createElement('div', { 'data-testid': 'card' },
        React.createElement('div', { 'data-testid': 'card-header' },
          React.createElement('div', { 'data-testid': 'card-title' }, 'Dashboard Builder')
        ),
        React.createElement('div', { 'data-testid': 'card-content' },
          React.createElement('button', { 'data-testid': 'button', onClick: () => {} }, 'Add Widget'),
          React.createElement('div', { 'data-testid': 'dashboard-grid' }, 'Dashboard Grid')
        )
      )
    )
  }
}))

// Mock AuthProvider and useAuth
vi.mock('@/hooks/useAuthHook', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      app_metadata: {},
      role: 'authenticated'
    },
    profile: {
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      phone: null,
      company: null,
      bio: null,
      role: 'sales_rep',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        role: 'authenticated'
      }
    },
    loading: false,
    signIn: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateProfile: vi.fn().mockResolvedValue({ error: null }),
    refreshProfile: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: []
  }))
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'search-icon', className, ...props }),
  Filter: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'filter-icon', className, ...props }),
  Download: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'download-icon', className, ...props }),
  Upload: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'upload-icon', className, ...props }),
  Plus: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'plus-icon', className, ...props }),
  Minus: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'minus-icon', className, ...props }),
  Edit: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'edit-icon', className, ...props }),
  Trash: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'trash-icon', className, ...props }),
  Eye: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'eye-icon', className, ...props }),
  EyeOff: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'eye-off-icon', className, ...props }),
  ChevronDown: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'chevron-down-icon', className, ...props }),
  ChevronUp: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'chevron-up-icon', className, ...props }),
  ChevronLeft: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'chevron-left-icon', className, ...props }),
  ChevronRight: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'chevron-right-icon', className, ...props }),
  MoreHorizontal: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'more-horizontal-icon', className, ...props }),
  Settings: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'settings-icon', className, ...props }),
  X: ({ className, ...props }: any) => React.createElement('svg', { 'data-testid': 'x-icon', className: `lucide-x ${className || ''}`, ...props }),
  Check: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'check-icon', className, ...props }),
  AlertTriangle: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'alert-triangle-icon', className, ...props }),
  Info: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'info-icon', className, ...props }),
  RefreshCw: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'refresh-cw-icon', className, ...props }),
  RotateCcw: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'rotate-ccw-icon', className, ...props }),
  Users: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'users-icon', className, ...props }),
  Building2: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'building2-icon', className, ...props }),
  Handshake: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'handshake-icon', className, ...props }),
  CheckSquare: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'check-square-icon', className, ...props }),
  FileText: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'file-text-icon', className, ...props }),
  Workflow: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'workflow-icon', className, ...props }),
  Star: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'star-icon', className, ...props }),
  DollarSign: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'dollar-sign-icon', className, ...props }),
  User: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'user-icon', className, ...props }),
  Calendar: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'calendar-icon', className, ...props }),
  Tag: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'tag-icon', className, ...props }),
  ExternalLink: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'external-link-icon', className, ...props }),
  TrendingUp: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'trending-up-icon', className, ...props }),
  SlidersHorizontal: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'sliders-horizontal-icon', className, ...props })
}))

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  BarChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  LineChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
  PieChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  AreaChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'area-chart' }, children),
  ComposedChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'composed-chart' }, children),
  ScatterChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'scatter-chart' }, children),
  RadarChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'radar-chart' }, children),
  FunnelChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'funnel-chart' }, children),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
  Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
  Line: () => React.createElement('div', { 'data-testid': 'line' }),
  Area: () => React.createElement('div', { 'data-testid': 'area' }),
  Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
  Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
  Scatter: () => React.createElement('div', { 'data-testid': 'scatter' }),
  PolarGrid: () => React.createElement('div', { 'data-testid': 'polar-grid' }),
  PolarAngleAxis: () => React.createElement('div', { 'data-testid': 'polar-angle-axis' }),
  PolarRadiusAxis: () => React.createElement('div', { 'data-testid': 'polar-radius-axis' }),
  Radar: () => React.createElement('div', { 'data-testid': 'radar' }),
  Funnel: () => React.createElement('div', { 'data-testid': 'funnel' }),
  LabelList: () => React.createElement('div', { 'data-testid': 'label-list' }),
  Brush: () => React.createElement('div', { 'data-testid': 'brush' })
}))

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})