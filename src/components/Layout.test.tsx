import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { useAuth } from '../hooks/useAuthHook'

// Mock the useAuth hook
vi.mock('../hooks/useAuthHook', () => ({
  useAuth: vi.fn(),
  AuthContext: vi.fn()
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the Button component
vi.mock('./ui/button', () => ({
  Button: ({ children, onClick, className, 'data-testid': testId, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-testid={testId}
      {...props}
    >
      {children}
    </button>
  )
}))

const mockUseAuth = vi.mocked(useAuth)

describe('Layout', () => {
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

  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockSignOut.mockClear()
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      signOut: mockSignOut
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderLayout = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Layout>
          <div data-testid="page-content">Test Content</div>
        </Layout>
      </MemoryRouter>
    )
  }

  describe('basic rendering', () => {
    it('should render layout with children', () => {
      renderLayout()
      
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render CRM title in both desktop and mobile views', () => {
      renderLayout()
      
      const titles = screen.getAllByText('Nawras CRM')
      expect(titles).toHaveLength(3) // Desktop sidebar + mobile sidebar + mobile header
    })

    it('should render all navigation items', () => {
      renderLayout()
      
      const expectedNavItems = [
        'Dashboard', 'Customers', 'Leads', 'Deals',
        'Proposals', 'Invoices', 'Analytics', 'Calendar', 'Settings'
      ]
      
      expectedNavItems.forEach(item => {
        expect(screen.getByTestId(`desktop-nav-${item.toLowerCase()}`)).toBeInTheDocument()
        expect(screen.getByTestId(`mobile-nav-${item.toLowerCase()}`)).toBeInTheDocument()
      })
    })
  })

  describe('user information display', () => {
    it('should display user avatar with first letter of email', () => {
      renderLayout()
      
      const avatars = screen.getAllByText('T') // First letter of test@example.com
      expect(avatars.length).toBeGreaterThan(0)
    })

    it('should display full name when available', () => {
      renderLayout()
      
      expect(screen.getAllByText('Test User')).toHaveLength(2) // Desktop + mobile
    })

    it('should display email when full name is not available', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: { ...mockProfile, full_name: null },
        signOut: mockSignOut
      })
      
      renderLayout()
      
      expect(screen.getAllByText('test@example.com')).toHaveLength(2)
    })

    it('should display user role', () => {
      renderLayout()
      
      expect(screen.getAllByText('sales_rep')).toHaveLength(2)
    })

    it('should handle missing user email gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, email: null },
        profile: mockProfile,
        signOut: mockSignOut
      })
      
      renderLayout()
      
      // Should not crash and should still render layout
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })
  })

  describe('navigation active states', () => {
    it('should highlight active navigation item', () => {
      renderLayout('/customers')
      
      const desktopCustomersLink = screen.getByTestId('desktop-nav-customers')
      const mobileCustomersLink = screen.getByTestId('mobile-nav-customers')
      
      expect(desktopCustomersLink).toHaveClass('bg-blue-100', 'text-blue-900')
      expect(mobileCustomersLink).toHaveClass('bg-blue-100', 'text-blue-900')
    })

    it('should not highlight inactive navigation items', () => {
      renderLayout('/customers')
      
      const desktopDashboardLink = screen.getByTestId('desktop-nav-dashboard')
      const mobileDashboardLink = screen.getByTestId('mobile-nav-dashboard')
      
      expect(desktopDashboardLink).toHaveClass('text-gray-600')
      expect(mobileDashboardLink).toHaveClass('text-gray-600')
    })
  })

  describe('mobile sidebar functionality', () => {
    it('should open mobile sidebar when menu button is clicked', () => {
      renderLayout()
      
      const menuButton = screen.getByTestId('mobile-menu-button')
      const mobileSidebarContainer = document.querySelector('.fixed.inset-0.z-50.lg\\:hidden')
      
      // Initially hidden
      expect(mobileSidebarContainer).toHaveClass('hidden')
      
      // Click menu button
      fireEvent.click(menuButton)
      
      // Should be visible
      expect(mobileSidebarContainer).toHaveClass('block')
    })

    it('should close mobile sidebar when X button is clicked', () => {
      renderLayout()
      
      const menuButton = screen.getByTestId('mobile-menu-button')
      fireEvent.click(menuButton)
      
      const closeButton = screen.getByRole('button', { name: /close sidebar/i })
      const mobileSidebarContainer = document.querySelector('.fixed.inset-0.z-50.lg\\:hidden')
      
      fireEvent.click(closeButton)
      
      expect(mobileSidebarContainer).toHaveClass('hidden')
    })

    it('should close mobile sidebar when overlay is clicked', () => {
      renderLayout()
      
      const menuButton = screen.getByTestId('mobile-menu-button')
      fireEvent.click(menuButton)
      
      const overlay = document.querySelector('.bg-gray-600.bg-opacity-75')
      const mobileSidebarContainer = document.querySelector('.fixed.inset-0.z-50.lg\\:hidden')
      
      fireEvent.click(overlay!)
      
      expect(mobileSidebarContainer).toHaveClass('hidden')
    })

    it('should close mobile sidebar when navigation link is clicked', () => {
      renderLayout()
      
      const menuButton = screen.getByTestId('mobile-menu-button')
      fireEvent.click(menuButton)
      
      const mobileNavLink = screen.getByTestId('mobile-nav-customers')
      const mobileSidebarContainer = document.querySelector('.fixed.inset-0.z-50.lg\\:hidden')
      
      fireEvent.click(mobileNavLink)
      
      expect(mobileSidebarContainer).toHaveClass('hidden')
    })
  })

  describe('sign out functionality', () => {
    it('should call signOut and navigate to login on desktop sign out', async () => {
      mockSignOut.mockResolvedValue(undefined)
      
      renderLayout()
      
      const desktopSignOutButton = screen.getByTestId('desktop-sign-out-button')
      fireEvent.click(desktopSignOutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('should call signOut and navigate to login on mobile sign out', async () => {
      mockSignOut.mockResolvedValue(undefined)
      
      renderLayout()
      
      const mobileSignOutButton = screen.getByTestId('mobile-sign-out-button')
      fireEvent.click(mobileSignOutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('should handle sign out errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockRejectedValue(new Error('Sign out failed'))
      
      renderLayout()
      
      const signOutButton = screen.getByTestId('desktop-sign-out-button')
      fireEvent.click(signOutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing out:', expect.any(Error))
      })
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('responsive design', () => {
    it('should show mobile header only on small screens', () => {
      renderLayout()
      
      const mobileHeader = screen.getByTestId('mobile-menu-button').closest('.lg\\:hidden')
      expect(mobileHeader).toBeInTheDocument()
    })

    it('should show desktop sidebar only on large screens', () => {
      renderLayout()
      
      const desktopSidebar = screen.getByTestId('desktop-nav-dashboard').closest('.hidden.lg\\:fixed')
      expect(desktopSidebar).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle missing user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        signOut: mockSignOut
      })
      
      renderLayout()
      
      // Should not crash
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })

    it('should handle missing profile gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
        signOut: mockSignOut
      })
      
      renderLayout()
      
      // Should display email instead of full name
      expect(screen.getAllByText('test@example.com')).toHaveLength(2)
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })
  })
})