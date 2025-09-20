import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../tests/test-utils'
import React from 'react'
import Login from '../../pages/Login'
import Dashboard from '../../pages/Dashboard'

// Removed useAuth mock - now using AuthContext provider from test-utils

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

vi.mock('../../lib/offlineDataService', () => ({
  offlineDataService: {
    getCustomers: vi.fn().mockResolvedValue([]),
    getLeads: vi.fn().mockResolvedValue([]),
    getDeals: vi.fn().mockResolvedValue([]),
    getProposals: vi.fn().mockResolvedValue([]),
    getInvoices: vi.fn().mockResolvedValue([])
  }
}))

vi.mock('../../config/development', () => ({
  devConfig: {
    OFFLINE_MODE: false,
    API_BASE_URL: 'http://localhost:3000',
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  },
  default: {
    OFFLINE_MODE: false,
    API_BASE_URL: 'http://localhost:3000',
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
  Line: () => React.createElement('div', { 'data-testid': 'line' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  BarChart: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
  PieChart: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
  Cell: () => React.createElement('div', { 'data-testid': 'cell' })
}))

// Using render from test-utils which includes AuthContext and BrowserRouter

describe('Authentication Flow E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Flow', () => {
    it('should render login form correctly', () => {
      render(<Login />)

      expect(screen.getByText('Welcome to Nawras CRM')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should handle successful login', async () => {
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should handle login errors', async () => {
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })
    })

    it('should show loading state during authentication', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      })

      renderWithRouter(<Login />)

      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })
  })

  describe('Sign Up Flow', () => {
    it('should switch to sign up mode', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      })

      renderWithRouter(<Login />)

      const signUpLink = screen.getByText(/don't have an account/i)
      fireEvent.click(signUpLink)

      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    })

    it('should handle successful sign up', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ error: null })
      
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: mockSignUp,
        signOut: vi.fn(),
        updateProfile: vi.fn()
      })

      renderWithRouter(<Login />)

      // Switch to sign up mode
      const signUpLink = screen.getByText(/don't have an account/i)
      fireEvent.click(signUpLink)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signUpButton = screen.getByRole('button', { name: /sign up/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(signUpButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'john@example.com',
          'password123',
          { full_name: 'John Doe' }
        )
      })
    })
  })

  describe('Dashboard Access', () => {
    it('should render dashboard when user is authenticated', () => {
      render(<Dashboard />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
    })

    it('should handle sign out from dashboard', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({ error: null })
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: mockSignOut,
        updateProfile: vi.fn()
      })

      renderWithRouter(<Dashboard />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      })

      renderWithRouter(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      })

      renderWithRouter(<Login />)

      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should validate password strength for sign up', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      })

      renderWithRouter(<Login />)

      // Switch to sign up mode
      const signUpLink = screen.getByText(/don't have an account/i)
      fireEvent.click(signUpLink)

      const passwordInput = screen.getByLabelText(/password/i)
      const signUpButton = screen.getByRole('button', { name: /sign up/i })

      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(signUpButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })
  })
})