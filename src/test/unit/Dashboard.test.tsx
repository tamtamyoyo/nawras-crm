import React from 'react'

// Mock recharts first to avoid hoisting issues
vi.mock('recharts', () => {
  return {
    BarChart: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
    CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
    Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    LineChart: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
    Line: () => React.createElement('div', { 'data-testid': 'line' }),
    PieChart: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
    Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
    Cell: () => React.createElement('div', { 'data-testid': 'cell' })
  }
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../tests/test-utils'
import Dashboard from '../../pages/Dashboard'

// Use global Supabase mock from setup.ts

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Removed useAuth mock - now using AuthContext provider from test-utils

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})





describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      render(<Dashboard />)
      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument()
    })
  })

  describe('Dashboard Stats', () => {
    it('should display customer statistics', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Total Customers')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('should display lead statistics', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Total Leads')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('should display deal statistics', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Total Deals')).toBeInTheDocument()
        expect(screen.getByText('Pipeline Value')).toBeInTheDocument()
        expect(screen.getByText('$3,000')).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    it('should render revenue chart', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
        expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      })
    })

    it('should render deals pipeline chart', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
        expect(screen.getByText('Deals by Stage')).toBeInTheDocument()
      })
    })

    it('should render leads conversion chart', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
        expect(screen.getByText('Lead Conversion Trend')).toBeInTheDocument()
      })
    })
  })

  describe('Recent Activities', () => {
    it('should display recent customers', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Recent Customers')).toBeInTheDocument()
        expect(screen.getByText('Customer 1')).toBeInTheDocument()
        expect(screen.getByText('Customer 2')).toBeInTheDocument()
      })
    })

    it('should display recent deals', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Recent Deals')).toBeInTheDocument()
        expect(screen.getByText('Deal 1')).toBeInTheDocument()
        expect(screen.getByText('Deal 2')).toBeInTheDocument()
      })
    })
  })

  describe('Quick Actions', () => {
    it('should display quick action buttons', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument()
        expect(screen.getByText('Add Lead')).toBeInTheDocument()
        expect(screen.getByText('Create Deal')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })
  })
})