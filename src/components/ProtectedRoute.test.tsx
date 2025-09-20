import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../hooks/useAuthHook'

// Mock the useAuth hook
vi.mock('../hooks/useAuthHook')

// Mock the Layout component
vi.mock('./Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  )
}))

// Mock react-router-dom Navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to)
      return <div data-testid="navigate" data-to={to}>Navigating to {to}</div>
    }
  }
})

const mockUseAuth = vi.mocked(useAuth)

describe('ProtectedRoute', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    phone: null,
    company: null,
    bio: null,
    role: 'sales_rep' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Reset environment
    Object.defineProperty(process, 'env', {
      value: { NODE_ENV: 'development' },
      writable: true
    })
    
    // Reset window properties
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      writable: true
    })
    
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        webdriver: false
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authentication states', () => {
    it('should show loading spinner when loading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: true
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('should render children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('layout')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  describe('role-based access control', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: { ...mockProfile, role: 'manager' },
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="manager">
            <div>Manager Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Manager Content')).toBeInTheDocument()
    })

    it('should allow access when user has higher role than required', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: { ...mockProfile, role: 'admin' },
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="manager">
            <div>Manager Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Manager Content')).toBeInTheDocument()
    })

    it('should deny access when user has lower role than required', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: { ...mockProfile, role: 'sales_rep' },
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="admin">
            <div>Admin Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument()
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })

    it('should allow access when no role is required', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: { ...mockProfile, role: 'sales_rep' },
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>General Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('General Content')).toBeInTheDocument()
    })
  })

  describe('testing environment bypass', () => {
    it('should bypass authentication in test environment', () => {
      Object.defineProperty(process, 'env', {
        value: { NODE_ENV: 'test' },
        writable: true
      })

      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Test Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })

    it('should bypass authentication with HeadlessChrome user agent', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      })
      
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/91.0.4472.124 Safari/537.36',
          webdriver: false
        },
        writable: true
      })

      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Headless Test Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Headless Test Content')).toBeInTheDocument()
    })

    it('should bypass authentication with Playwright user agent', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      })
      
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Playwright',
          webdriver: false
        },
        writable: true
      })

      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Playwright Test Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Playwright Test Content')).toBeInTheDocument()
    })

    it('should bypass authentication when webdriver is true', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      })
      
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          webdriver: true
        },
        writable: true
      })

      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Webdriver Test Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Webdriver Test Content')).toBeInTheDocument()
    })

    it('should not bypass authentication in production environment', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'production.com' },
        writable: true
      })

      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Production Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
      expect(screen.queryByText('Production Content')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle missing profile gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Content Without Profile</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Content Without Profile')).toBeInTheDocument()
    })

    it('should handle role check when profile is null', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
        loading: false
      })

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="admin">
            <div>Admin Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      // Should render content when profile is null (no role check possible)
      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })
  })
})