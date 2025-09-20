import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuthHook'
import { supabase } from '../lib/supabase-client'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

describe('useAuth Hook', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User'
    },
    created_at: '2023-01-01T00:00:00Z'
  }

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
    })

    it('should load existing session on mount', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.session).toEqual(mockSession)
      })
    })

    it('should handle session loading errors', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' }
      })

      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBe(null)
        expect(toast.error).toHaveBeenCalledWith('Failed to load session')
      })
    })

    it('should set up auth state change listener', () => {
      renderHook(() => useAuth())
      
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })
  })

  describe('Sign Up', () => {
    it('should successfully sign up a new user', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User')
      })

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })
      
      expect(toast.success).toHaveBeenCalledWith('Account created successfully!')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle sign up errors', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User')
      })

      expect(toast.error).toHaveBeenCalledWith('Email already registered')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should handle sign up with email confirmation required', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: { ...mockUser, email_confirmed_at: null },
          session: null
        },
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User')
      })

      expect(toast.success).toHaveBeenCalledWith(
        'Please check your email to confirm your account'
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Sign In', () => {
    it('should successfully sign in a user', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(toast.success).toHaveBeenCalledWith('Welcome back!')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle sign in errors', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword')
      })

      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should handle network errors during sign in', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      expect(toast.error).toHaveBeenCalledWith('Network error occurred')
    })
  })

  describe('Sign Out', () => {
    it('should successfully sign out a user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      // Set initial user state
      act(() => {
        result.current.user = mockUser
        result.current.session = mockSession
      })
      
      await act(async () => {
        await result.current.signOut()
      })

      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Signed out successfully')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('should handle sign out errors', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Sign out failed' }
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.signOut()
      })

      expect(toast.error).toHaveBeenCalledWith('Sign out failed')
    })
  })

  describe('Password Reset', () => {
    it('should successfully send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.resetPassword('test@example.com')
      })

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com'
      )
      expect(toast.success).toHaveBeenCalledWith(
        'Password reset email sent! Check your inbox.'
      )
    })

    it('should handle password reset errors', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: { message: 'Email not found' }
      })

      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.resetPassword('test@example.com')
      })

      expect(toast.error).toHaveBeenCalledWith('Email not found')
    })
  })

  describe('Auth State Changes', () => {
    it('should update state when user signs in', async () => {
      let authStateCallback: (event: string, session: Session | null) => void
      
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      const { result } = renderHook(() => useAuth())
      
      // Simulate auth state change
      act(() => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })

    it('should clear state when user signs out', async () => {
      let authStateCallback: (event: string, session: Session | null) => void
      
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      const { result } = renderHook(() => useAuth())
      
      // Set initial state
      act(() => {
        authStateCallback('SIGNED_IN', mockSession)
      })
      
      // Simulate sign out
      act(() => {
        authStateCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
    })
  })

  describe('Loading States', () => {
    it('should set loading to true during sign in', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: mockSession },
          error: null
        }), 100))
      )

      const { result } = renderHook(() => useAuth())
      
      act(() => {
        result.current.signIn('test@example.com', 'password123')
      })

      expect(result.current.loading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set loading to true during sign up', async () => {
      vi.mocked(supabase.auth.signUp).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: mockSession },
          error: null
        }), 100))
      )

      const { result } = renderHook(() => useAuth())
      
      act(() => {
        result.current.signUp('test@example.com', 'password123', 'Test User')
      })

      expect(result.current.loading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const mockUnsubscribe = vi.fn()
      
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      const { unmount } = renderHook(() => useAuth())
      
      unmount()
      
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})