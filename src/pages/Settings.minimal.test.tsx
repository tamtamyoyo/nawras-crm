import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Settings from './Settings'
import { useAuth } from '../hooks/useAuthHook'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
vi.mock('../hooks/useAuthHook', () => ({
  useAuth: vi.fn()
}))
vi.mock('@/hooks/use-toast')
vi.mock('../lib/supabase')

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z'
}

const mockProfile = {
  id: 'user-1',
  full_name: 'John Doe',
  phone: '+1234567890',
  company: 'Test Company',
  role: 'manager' as const,
  bio: 'Test bio',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockToast = vi.fn()
const mockRefreshProfile = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  
  // Mock useAuth
  const mockUseAuth = vi.mocked(useAuth)
  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: mockProfile,
    refreshProfile: mockRefreshProfile,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
  })
  
  // Mock useToast
  vi.mocked(useToast).mockReturnValue({
    toast: mockToast
  })
})

describe('Settings - Minimal Test', () => {
  it('should render without crashing', () => {
    render(<Settings />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})