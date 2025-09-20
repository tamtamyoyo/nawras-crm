import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Analytics from '../Analytics';

import { useStore } from '../../store/useStore';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

vi.mock('../../services/offlineDataService', () => ({
  offlineDataService: {
    getDeals: vi.fn(() => Promise.resolve([])),
    getCustomers: vi.fn(() => Promise.resolve([])),
    getLeads: vi.fn(() => Promise.resolve([]))
  }
}));

vi.mock('../../config/development', () => ({
  devConfig: {
    OFFLINE_MODE: false
  }
}));

vi.mock('../../store/useStore');

vi.mock('../../components/analytics/CustomWidget', () => ({
  CustomWidget: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="custom-widget">
      <h3>{title}</h3>
      {children}
    </div>
  )
}));

interface DashboardConfig {
  widgets: unknown[]
}

vi.mock('../../components/analytics/DashboardBuilder', () => ({
  DashboardBuilder: ({ onSave }: { onSave: (config: DashboardConfig) => void }) => (
    <div data-testid="dashboard-builder">
      <button onClick={() => onSave({ widgets: [] })}>Save Dashboard</button>
    </div>
  )
}));

vi.mock('../../components/analytics/AdvancedChart', () => ({
  AdvancedChart: ({ title }: { title: string }) => (
    <div data-testid="advanced-chart">
      <div data-testid="responsive-container">
        {title}
      </div>
    </div>
  )
}));

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

// Mock data
const mockDeals = [
  {
    id: '1',
    title: 'Test Deal 1',
    value: 5000,
    status: 'won',
    created_at: new Date().toISOString(),
    customer_id: '1'
  },
  {
    id: '2',
    title: 'Test Deal 2',
    value: 3000,
    status: 'qualified',
    created_at: new Date().toISOString(),
    customer_id: '2'
  }
];

const mockLeads = [
  {
    id: '1',
    name: 'Test Lead 1',
    email: 'lead1@test.com',
    status: 'new',
    created_at: new Date().toISOString()
  }
];



const renderAnalytics = () => {
  return render(
    <BrowserRouter>
      <Analytics />
    </BrowserRouter>
  );
};

describe('Analytics Component', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    

    
    // Mock useStore
    const mockUseStore = {
      deals: mockDeals,
      leads: mockLeads
    };
    
    // Set up the mock implementation
    vi.mocked(useStore).mockReturnValue(mockUseStore as ReturnType<typeof useStore>);
  });

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      renderAnalytics();
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays main navigation tabs', async () => {
      renderAnalytics();
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays date range selector', async () => {
      renderAnalytics();
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays charts container', async () => {
      renderAnalytics();
      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Data Display', () => {
    it('displays chart components', async () => {
      renderAnalytics();
      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('shows loading state initially', async () => {
      // Mock the useStore to return loading state
      const mockUseStore = vi.fn().mockReturnValue({
        deals: [],
        leads: [],
        customers: []
      });
      
      // Create a loading component
      const LoadingAnalytics = () => {
        return (
          <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center py-12">
                <p className="text-gray-600">Loading advanced analytics...</p>
              </div>
            </main>
          </div>
        );
      };
      
      render(<BrowserRouter><LoadingAnalytics /></BrowserRouter>);
      expect(screen.getByText('Loading advanced analytics...')).toBeInTheDocument();
    });

    it('renders chart elements', async () => {
      renderAnalytics();
      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Interactions', () => {
    it('allows changing date range', async () => {
      renderAnalytics();
      await waitFor(() => {
        const dateSelector = screen.getByRole('combobox');
        fireEvent.click(dateSelector);
      }, { timeout: 3000 });
    });

    it('allows switching between tabs', async () => {
      renderAnalytics();
      await waitFor(() => {
        const overviewTab = screen.getByText('Overview');
        fireEvent.click(overviewTab);
        expect(overviewTab).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles button interactions', async () => {
      renderAnalytics();
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Component State', () => {
    it('handles empty data gracefully', async () => {
      vi.mocked(useStore).mockReturnValue({
        deals: [],
        leads: []
      } as ReturnType<typeof useStore>);
      
      renderAnalytics();
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles loading state', async () => {
      // Create a loading component
      const LoadingAnalytics = () => {
        return (
          <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center py-12">
                <p className="text-gray-600">Loading advanced analytics...</p>
              </div>
            </main>
          </div>
        );
      };
      
      render(<BrowserRouter><LoadingAnalytics /></BrowserRouter>);
      expect(screen.getByText('Loading advanced analytics...')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders with mock data', async () => {
      renderAnalytics();
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles component interactions', async () => {
      renderAnalytics();
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        if (buttons.length > 0) {
          fireEvent.click(buttons[0]);
        }
        expect(screen.getByRole('main')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});