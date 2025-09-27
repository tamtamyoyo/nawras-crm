import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { FilterValue } from '@/components/search/FilterPanel'
import { DateRange } from 'react-day-picker'

export interface SearchResult {
  id: string
  type: 'lead' | 'customer' | 'deal' | 'task' | 'proposal' | 'workflow'
  title: string
  subtitle?: string
  description?: string
  status?: string
  priority?: string
  value?: number
  date?: string
  assignedTo?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  relevanceScore?: number
}

export interface SearchOptions {
  query?: string
  types?: string[]
  filters?: FilterValue
  sortBy?: 'relevance' | 'date' | 'title' | 'status' | 'priority' | 'value'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface SearchState {
  results: SearchResult[]
  loading: boolean
  error: string | null
  totalCount: number
  hasMore: boolean
}

interface UseAdvancedSearchReturn extends SearchState {
  search: (options: SearchOptions) => Promise<void>
  loadMore: () => Promise<void>
  clearResults: () => void
  refetch: () => Promise<void>
}

export function useAdvancedSearch(): UseAdvancedSearchReturn {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
    totalCount: 0,
    hasMore: false
  })

  const [lastSearchOptions, setLastSearchOptions] = useState<SearchOptions | null>(null)

  const buildSearchQuery = useCallback((table: string, options: SearchOptions) => {
    let query = (supabase as any).from(table).select('*', { count: 'exact' })

    // Text search
    if (options.query) {
      const searchTerm = options.query.toLowerCase()
      switch (table) {
        case 'leads':
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
          break
        case 'customers':
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
          break
        case 'deals':
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`)
          break
        case 'tasks':
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          break
        case 'proposals':
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`)
          break
        case 'workflows':
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          break
      }
    }

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return

        switch (key) {
          case 'status':
            query = query.eq('status', value)
            break
          case 'priority':
            query = query.eq('priority', value)
            break
          case 'assignedTo':
            query = query.eq('assigned_to', value)
            break
          case 'dateRange': {
            const dateRange = value as DateRange
            if (dateRange?.from) {
              query = query.gte('created_at', dateRange.from.toISOString())
            }
            if (dateRange?.to) {
              query = query.lte('created_at', dateRange.to.toISOString())
            }
            break
          }
          case 'valueRange': {
            const range = value as { min?: string; max?: string }
            if (range.min) {
              query = query.gte('value', parseFloat(range.min))
            }
            if (range.max) {
              query = query.lte('value', parseFloat(range.max))
            }
            break
          }
          case 'tags':
            if (Array.isArray(value) && value.length > 0) {
              query = query.overlaps('tags', value)
            }
            break
          case 'company':
            query = query.ilike('company', `%${value}%`)
            break
        }
      })
    }

    // Apply sorting
    if (options.sortBy && options.sortBy !== 'relevance') {
      const ascending = options.sortOrder === 'asc'
      switch (options.sortBy) {
        case 'date':
          query = query.order('created_at', { ascending })
          break
        case 'title': {
          const titleField = table === 'deals' || table === 'tasks' || table === 'proposals' ? 'title' : 'name'
          query = query.order(titleField, { ascending })
          break
        }
        case 'status':
          query = query.order('status', { ascending })
          break
        case 'priority':
          query = query.order('priority', { ascending })
          break
        case 'value':
          query = query.order('value', { ascending })
          break
      }
    } else {
      // Default sort by created_at desc
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const limit = options.limit || 20
    const offset = options.offset || 0
    query = query.range(offset, offset + limit - 1)

    return query
  }, [])

  const transformResult = useCallback((item: Record<string, unknown>, type: SearchResult['type']): SearchResult => {
    const baseResult: SearchResult = {
      id: item.id as string,
      type,
      title: '',
      date: item.created_at as string,
      status: item.status as string,
      priority: item.priority as string,
      assignedTo: item.assigned_to as string,
      tags: (item.tags as string[]) || [],
      metadata: item
    }

    switch (type) {
      case 'lead':
      case 'customer':
        return {
          ...baseResult,
          title: (item.name as string) || 'Unnamed Contact',
          subtitle: item.company as string,
          description: (item.email as string) || (item.phone as string),
          value: item.value as number
        }
      case 'deal':
        return {
          ...baseResult,
          title: (item.title as string) || 'Untitled Deal',
          subtitle: item.customer_name as string,
          description: item.description as string,
          value: item.value as number
        }
      case 'task':
        return {
          ...baseResult,
          title: (item.title as string) || 'Untitled Task',
          subtitle: item.type as string,
          description: item.description as string,
          date: (item.due_date as string) || (item.created_at as string)
        }
      case 'proposal':
        return {
          ...baseResult,
          title: (item.title as string) || 'Untitled Proposal',
          subtitle: item.customer_name as string,
          description: item.description as string,
          value: item.total_amount as number
        }
      case 'workflow':
        return {
          ...baseResult,
          title: (item.name as string) || 'Untitled Workflow',
          subtitle: item.trigger_type as string,
          description: item.description as string
        }
      default:
        return baseResult
    }
  }, [])

  const calculateRelevanceScore = useCallback((result: SearchResult, query?: string): number => {
    if (!query) return 1

    const searchTerm = query.toLowerCase()
    let score = 0

    // Title match (highest weight)
    if (result.title.toLowerCase().includes(searchTerm)) {
      score += 10
      if (result.title.toLowerCase().startsWith(searchTerm)) {
        score += 5
      }
    }

    // Subtitle match
    if (result.subtitle?.toLowerCase().includes(searchTerm)) {
      score += 5
    }

    // Description match
    if (result.description?.toLowerCase().includes(searchTerm)) {
      score += 3
    }

    // Tags match
    if (result.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
      score += 2
    }

    // Status/Priority match
    if (result.status?.toLowerCase().includes(searchTerm) || 
        result.priority?.toLowerCase().includes(searchTerm)) {
      score += 1
    }

    return score
  }, [])

  const search = useCallback(async (options: SearchOptions) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    setLastSearchOptions(options)

    try {
      const searchTypes = options.types || ['lead', 'customer', 'deal', 'task', 'proposal', 'workflow']
      const tableMap: Record<string, string> = {
        lead: 'leads',
        customer: 'customers',
        deal: 'deals',
        task: 'tasks',
        proposal: 'proposals',
        workflow: 'workflows'
      }

      const searchPromises = searchTypes.map(async (type) => {
        const table = tableMap[type]
        if (!table) return { data: [], count: 0 }

        const query = buildSearchQuery(table, options)
        const { data, error, count } = await query

        if (error) {
          console.error(`Error searching ${table}:`, error)
          return { data: [], count: 0 }
        }

        return {
          data: (data || []).map(item => transformResult(item, type as SearchResult['type'])),
          count: count || 0
        }
      })

      const results = await Promise.all(searchPromises)
      
      // Combine and process results
      let allResults: SearchResult[] = []
      let totalCount = 0

      results.forEach(({ data, count }) => {
        allResults = [...allResults, ...data]
        totalCount += count
      })

      // Calculate relevance scores and sort if needed
      if (options.sortBy === 'relevance' || !options.sortBy) {
        allResults = allResults.map(result => ({
          ...result,
          relevanceScore: calculateRelevanceScore(result, options.query)
        })).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      }

      // Apply client-side pagination if needed
      const limit = options.limit || 20
      const offset = options.offset || 0
      const paginatedResults = allResults.slice(offset, offset + limit)
      const hasMore = allResults.length > offset + limit

      setState(prev => ({
        ...prev,
        results: offset === 0 ? paginatedResults : [...prev.results, ...paginatedResults],
        loading: false,
        error: null,
        totalCount,
        hasMore
      }))
    } catch (error) {
      console.error('Search error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }))
      toast.error('Search failed. Please try again.')
    }
  }, [buildSearchQuery, transformResult, calculateRelevanceScore])

  const loadMore = useCallback(async () => {
    if (!lastSearchOptions || state.loading || !state.hasMore) return

    const currentOffset = state.results.length
    await search({
      ...lastSearchOptions,
      offset: currentOffset
    })
  }, [lastSearchOptions, state.loading, state.hasMore, state.results.length, search])

  const clearResults = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
      totalCount: 0,
      hasMore: false
    })
    setLastSearchOptions(null)
  }, [])

  const refetch = useCallback(async () => {
    if (!lastSearchOptions) return
    await search({ ...lastSearchOptions, offset: 0 })
  }, [lastSearchOptions, search])

  return {
    ...state,
    search,
    loadMore,
    clearResults,
    refetch
  }
}

export default useAdvancedSearch