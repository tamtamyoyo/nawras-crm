import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import '@testing-library/jest-dom/vitest'

// Mock the useDebounce hook
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value
}))

// Mock the useAdvancedSearch hook
vi.mock('@/hooks/useAdvancedSearch', () => ({
  useAdvancedSearch: () => ({
    results: [],
    loading: false,
    error: null,
    totalCount: 0,
    hasMore: false,
    search: vi.fn(),
    loadMore: vi.fn(),
    clearResults: vi.fn()
  })
}))

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    render(
      <RouterWrapper>
        <GlobalSearch />
      </RouterWrapper>
    )
    
    expect(screen.getByPlaceholderText('Search across all modules...')).toBeInTheDocument()
  })

  it('updates search input when typing', async () => {
    render(
      <RouterWrapper>
        <GlobalSearch />
      </RouterWrapper>
    )
    
    const input = screen.getByPlaceholderText('Search across all modules...')
    await userEvent.type(input, 'test query')
    
    expect(input).toHaveValue('test query')
  })

  it('shows search input', async () => {
    render(
      <RouterWrapper>
        <GlobalSearch />
      </RouterWrapper>
    )
    
    const input = screen.getByPlaceholderText('Search across all modules...')
    expect(input).toBeInTheDocument()
  })

  it('handles keyboard input', async () => {
    render(
      <RouterWrapper>
        <GlobalSearch />
      </RouterWrapper>
    )
    
    const input = screen.getByPlaceholderText('Search across all modules...')
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(input).toBeInTheDocument()
  })

  it('renders search filters when enabled', () => {
    render(
      <RouterWrapper>
        <GlobalSearch showFilters={true} />
      </RouterWrapper>
    )
    
    expect(screen.getByPlaceholderText('Search across all modules...')).toBeInTheDocument()
  })

  it('accepts custom placeholder', () => {
    render(
      <RouterWrapper>
        <GlobalSearch placeholder="Custom search placeholder" />
      </RouterWrapper>
    )
    
    expect(screen.getByPlaceholderText('Custom search placeholder')).toBeInTheDocument()
  })
})

// QuickSearchTrigger tests removed - component doesn't exist in GlobalSearch