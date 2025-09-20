import React from 'react'
import { render } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import Dashboard from './Dashboard'

// Mock all dependencies
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    loading: false
  })
}))

vi.mock('../store/useStore', () => ({
  useStore: () => ({
    customers: [],
    deals: [],
    leads: [],
    invoices: [],
    setCustomers: vi.fn(),
    setDeals: vi.fn(),
    setLeads: vi.fn(),
    setInvoices: vi.fn()
  })
}))

vi.mock('../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}))

vi.mock('../services/offlineDataService', () => ({
  offlineDataService: {
    getCustomers: vi.fn(() => Promise.resolve([])),
    getDeals: vi.fn(() => Promise.resolve([])),
    getLeads: vi.fn(() => Promise.resolve([])),
    getInvoices: vi.fn(() => Promise.resolve([]))
  }
}))

vi.mock('../config/development', () => ({
  devConfig: {
    offlineMode: false
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
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

describe('Dashboard Simple Test', () => {
  it('should render without crashing', () => {
    render(<Dashboard />)
    expect(document.body).toBeInTheDocument()
  })
})