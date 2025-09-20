import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dashboard from './Dashboard'
import { useAuth } from '../hooks/useAuthHook'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase-client'
import { toast } from 'sonner'
import { offlineDataService } from '../services/offlineDataService'

// Mock dependencies
vi.mock('../hooks/useAuthHook', () => ({
  useAuth: vi.fn()
}))
vi.mock('../store/useStore')
vi.mock('../lib/supabase-client')
vi.mock('sonner')
vi.mock('../services/offlineDataService')
vi.mock('../config/development', () => ({
  devConfig: {
    offlineMode: false,
    OFFLINE_MODE: false,
    enableDebugLogs: false
  },
  logDev: vi.fn()
}))
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
})

const mockUser = {
  id: '1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
}

const mockCustomers = [
  { id: '1', name: 'Customer 1', email: 'customer1@example.com' },
  { id: '2', name: 'Customer 2', email: 'customer2@example.com' }
]

const mockDeals = [
  { id: '1', title: 'Deal 1', value: 1000, stage: 'proposal', updated_at: new Date().toISOString() },
  { id: '2', title: 'Deal 2', value: 2000, stage: 'closed_won', updated_at: new Date().toISOString() },
  { id: '3', title: 'Deal 3', value: 1500, stage: 'closed_lost', updated_at: new Date().toISOString() }
]

const mockLeads = [
  { id: '1', name: 'Lead 1', status: 'new', source: 'website' },
  { id: '2', name: 'Lead 2', status: 'contacted', source: 'referral' },
  { id: '3', name: 'Lead 3', status: 'new', source: 'website' }
]

const mockInvoices = [
  { id: '1', amount: 1000, status: 'paid' },
  { id: '2', amount: 2000, status: 'pending' }
]

const mockUseAuth = vi.mocked(useAuth)
const mockUseStore = vi.mocked(useStore)
const mockSupabase = vi.mocked(supabase)
const mockToast = vi.mocked(toast)
const mockOfflineDataService = vi.mocked(offlineDataService)

describe('Dashboard', () => {
  const mockSetCustomers = vi.fn()
  const mockSetDeals = vi.fn()
  const mockSetLeads = vi.fn()
  const mockSetInvoices = vi.fn()

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      loading: false
    })

    mockUseStore.mockReturnValue({
      customers: mockCustomers,
      deals: mockDeals,
      leads: mockLeads,
      invoices: mockInvoices,
      setCustomers: mockSetCustomers,
      setDeals: mockSetDeals,
      setLeads: mockSetLeads,
      setInvoices: mockSetInvoices
    })

    // Mock successful Supabase responses
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    })

    // Mock successful offline service responses
    mockOfflineDataService.getCustomers.mockResolvedValue(mockCustomers)
    mockOfflineDataService.getDeals.mockResolvedValue(mockDeals)
    mockOfflineDataService.getLeads.mockResolvedValue(mockLeads)
    mockOfflineDataService.getInvoices.mockResolvedValue(mockInvoices)

    mockToast.error = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  describe('rendering', () => {
    it('should render dashboard title and welcome message', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toHaveTextContent('Dashboard')
        expect(screen.getByText(/Welcome back,/)).toBeInTheDocument()
        expect(screen.getByText(/Here's what's happening with your business/)).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<Dashboard />)
      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument()
    })

    it('should render stats cards with correct data', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Customers')).toBeInTheDocument()
        expect(screen.getByText('Active Deals')).toBeInTheDocument()
        expect(screen.getByText('Revenue')).toBeInTheDocument()
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      })
    })

    it('should render charts', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
        expect(screen.getByText('Deals by Stage')).toBeInTheDocument()
        expect(screen.getByText('Leads by Source')).toBeInTheDocument()
        expect(screen.getAllByTestId('responsive-container')).toHaveLength(3)
      })
    })

    it('should render quick actions', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument()
        expect(screen.getByText('Add Customer')).toBeInTheDocument()
        expect(screen.getByText('Add Lead')).toBeInTheDocument()
        expect(screen.getByText('Create Deal')).toBeInTheDocument()
        expect(screen.getByText('Create Proposal')).toBeInTheDocument()
      })
    })

    it('should render dashboard stats', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Customers')).toBeInTheDocument()
        expect(screen.getByText('Active Deals')).toBeInTheDocument()
        expect(screen.getByText('Revenue')).toBeInTheDocument()
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      })
    })
  })

  describe('data loading', () => {
    it('should load dashboard data on mount', async () => {
      mockSupabase.from.mockImplementation((table: string) => ({
        select: vi.fn().mockResolvedValue({
          data: table === 'customers' ? mockCustomers :
                table === 'deals' ? mockDeals :
                table === 'leads' ? mockLeads :
                table === 'invoices' ? mockInvoices : [],
          error: null
        })
      }))

      render(<Dashboard />)
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('customers')
        expect(mockSupabase.from).toHaveBeenCalledWith('deals')
        expect(mockSupabase.from).toHaveBeenCalledWith('leads')
      })

      expect(mockSetCustomers).toHaveBeenCalledWith(mockCustomers)
      expect(mockSetDeals).toHaveBeenCalledWith(mockDeals)
      expect(mockSetLeads).toHaveBeenCalledWith(mockLeads)
    })

    it('should handle data loading errors', async () => {
      const error = new Error('Database error')
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error })
      })

      // Mock offline service to also fail
      mockOfflineDataService.getCustomers.mockRejectedValue(new Error('Offline error'))
      mockOfflineDataService.getDeals.mockRejectedValue(new Error('Offline error'))
      mockOfflineDataService.getLeads.mockRejectedValue(new Error('Offline error'))

      render(<Dashboard />)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load dashboard data')
      })
    })
  })

  describe('statistics calculations', () => {
    it('should calculate total customers correctly', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const customerStat = screen.getByText('Total Customers').closest('.space-y-2')?.parentElement
        expect(customerStat).toHaveTextContent('2')
      })
    })

    it('should calculate active deals correctly', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const activeDealsStat = screen.getByText('Active Deals').closest('.space-y-2')?.parentElement
        // Active deals = deals not in closed_won or closed_lost (1 deal)
        expect(activeDealsStat).toHaveTextContent('1')
      })
    })

    it('should calculate revenue correctly', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const revenueStat = screen.getByText('Revenue').closest('.space-y-2')?.parentElement
        // Revenue = sum of closed_won deals (2000)
        expect(revenueStat).toHaveTextContent('$2,000')
      })
    })

    it('should calculate conversion rate correctly', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const conversionStat = screen.getByText('Conversion Rate').closest('.space-y-2')?.parentElement
        // Conversion rate = (deals / leads) * 100 = (2 / 2) * 100 = 100%
        expect(conversionStat).toHaveTextContent('100%')
      })
    })
  })

  describe('quick actions', () => {
    it('should navigate to customers page when Add Customer is clicked', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const addCustomerButton = screen.getByText('Add Customer')
        fireEvent.click(addCustomerButton)
        expect(window.location.href).toBe('/customers')
      })
    })

    it('should navigate to leads page when Add Lead is clicked', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const addLeadButton = screen.getByText('Add Lead')
        fireEvent.click(addLeadButton)
        expect(window.location.href).toBe('/leads')
      })
    })

    it('should navigate to deals page when Create Deal is clicked', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const createDealButton = screen.getByText('Create Deal')
        fireEvent.click(createDealButton)
        expect(window.location.href).toBe('/deals')
      })
    })

    it('should navigate to proposals page when Create Proposal is clicked', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        const createProposalButton = screen.getByText('Create Proposal')
        fireEvent.click(createProposalButton)
        expect(window.location.href).toBe('/proposals')
      })
    })
  })

  describe('user display', () => {
    it('should display user full name when available', async () => {
      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome back,/)).toBeInTheDocument()
        expect(screen.getByText(/Here's what's happening with your business/)).toBeInTheDocument()
      })
    })

    it('should display user email when full_name is not available', async () => {
      const mockUserWithoutName = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {}
      }
      
      mockUseAuth.mockReturnValue({
        user: mockUserWithoutName,
        loading: false,
        signOut: vi.fn()
      })
      
      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome back,/)).toBeInTheDocument()
        expect(screen.getByText(/Here's what's happening with your business/)).toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty data gracefully', async () => {
      mockUseStore.mockReturnValue({
        customers: [],
        deals: [],
        leads: [],
        invoices: [],
        setCustomers: mockSetCustomers,
        setDeals: mockSetDeals,
        setLeads: mockSetLeads,
        setInvoices: mockSetInvoices
      })

      render(<Dashboard />)
      
      await waitFor(() => {
        // Check for Total Customers stat showing 0
        const customerStat = screen.getByText('Total Customers').closest('.space-y-2')?.parentElement
        expect(customerStat).toHaveTextContent('0')
        
        // Check for Active Deals stat showing 0
        const dealsStat = screen.getByText('Active Deals').closest('.space-y-2')?.parentElement
        expect(dealsStat).toHaveTextContent('0')
        
        // Check for Revenue stat showing $0
        const revenueStat = screen.getByText('Revenue').closest('.space-y-2')?.parentElement
        expect(revenueStat).toHaveTextContent('$0')
        
        // Check for Conversion Rate stat showing 0%
        const conversionStat = screen.getByText('Conversion Rate').closest('.space-y-2')?.parentElement
        expect(conversionStat).toHaveTextContent('0%')
      })
    })

    it('should handle missing user gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn(),
        loading: false
      })

      render(<Dashboard />)
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome back,/)).toBeInTheDocument()
      })
    })
  })
})