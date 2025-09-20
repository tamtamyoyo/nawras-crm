import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window.matchMedia
const matchMediaMock = vi.fn()

// Mock document.documentElement
const documentElementMock = {
  classList: {
    add: vi.fn(),
    remove: vi.fn()
  }
}

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true
    })
    
    Object.defineProperty(document, 'documentElement', {
      value: documentElementMock,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme')
    })

    it('should initialize with system preference when no saved theme', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: true })
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('should default to light theme when system preference is light', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: false })
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    it('should apply theme class to document element on initialization', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      renderHook(() => useTheme())
      
      expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark')
      expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })
  })

  describe('theme toggling', () => {
    it('should toggle from light to dark', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('light')
      expect(result.current.isDark).toBe(false)
      
      act(() => {
        result.current.toggleTheme()
      })
      
      expect(result.current.theme).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    it('should toggle from dark to light', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('dark')
      expect(result.current.isDark).toBe(true)
      
      act(() => {
        result.current.toggleTheme()
      })
      
      expect(result.current.theme).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    it('should update document classes when theme changes', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useTheme())
      
      // Clear previous calls from initialization
      vi.clearAllMocks()
      
      act(() => {
        result.current.toggleTheme()
      })
      
      expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark')
      expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('should save theme to localStorage when changed', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useTheme())
      
      act(() => {
        result.current.toggleTheme()
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })
  })

  describe('multiple toggles', () => {
    it('should handle multiple theme toggles correctly', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('light')
      
      // Toggle to dark
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')
      expect(result.current.isDark).toBe(true)
      
      // Toggle back to light
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
      expect(result.current.isDark).toBe(false)
      
      // Toggle to dark again
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('isDark property', () => {
    it('should return true when theme is dark', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.isDark).toBe(true)
    })

    it('should return false when theme is light', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.isDark).toBe(false)
    })

    it('should update isDark when theme changes', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.isDark).toBe(false)
      
      act(() => {
        result.current.toggleTheme()
      })
      
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid saved theme gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')
      matchMediaMock.mockReturnValue({ matches: false })
      
      const { result } = renderHook(() => useTheme())
      
      // Should fall back to system preference
      expect(result.current.theme).toBe('light')
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      matchMediaMock.mockReturnValue({ matches: true })
      
      const { result } = renderHook(() => useTheme())
      
      // Should fall back to system preference
      expect(result.current.theme).toBe('dark')
    })

    it('should handle matchMedia errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia error')
      })
      
      // Should not crash and should have a default theme
      expect(() => {
        renderHook(() => useTheme())
      }).not.toThrow()
    })
  })
})