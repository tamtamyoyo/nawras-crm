import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuth } from './useAuthHook'
import { AuthProvider } from './useAuthHook'
import { supabase } from '../lib/supabase-client'

// Mock Supabase
vi.mock('../lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}))

const mockSupabase = vi.mocked(supabase)

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
    })

    it('should set user when session exists', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Wait for the effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password')
        expect(response.error).toBe(null)
        expect(response.data?.user).toEqual(mockUser)
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
    })

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid credentials' }
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrongpassword')
        expect(response.error).toEqual(mockError)
        expect(response.data?.user).toBe(null)
      })
    })
  })

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password', 'Test User')
        expect(response.error).toBe(null)
        expect(response.data?.user).toEqual(mockUser)
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })
    })

    it('should handle sign up error', async () => {
      const mockError = { message: 'Email already exists' }
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        const response = await result.current.signUp('existing@example.com', 'password', 'Test User')
        expect(response.error).toEqual(mockError)
      })
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updatedUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Updated Name' }
      }
      
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: updatedUser },
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        const response = await result.current.updateProfile({ full_name: 'Updated Name' })
        expect(response.error).toBe(null)
        expect(response.data?.user).toEqual(updatedUser)
      })

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { full_name: 'Updated Name' }
      })
    })
  })
})