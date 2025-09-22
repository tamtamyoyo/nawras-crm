import React, { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FilterPanel, FilterConfig, FilterValue } from '@/components/search/FilterPanel'
import { commonFilters } from '@/components/search/common-filters'
import { SearchResults } from '@/components/search/SearchResults'
import { useAdvancedSearch, SearchOptions, SearchResult } from '@/hooks/useAdvancedSearch'

import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'





interface GlobalSearchProps {
  className?: string
  placeholder?: string
  onResultSelect?: (result: SearchResult) => void
  showFilters?: boolean
  defaultFilters?: FilterValue
  isOpen?: boolean
  onClose?: () => void
}



export function GlobalSearch({ 
  className, 
  placeholder = "Search across all modules...", 
  onResultSelect,
  showFilters = true,
  defaultFilters = {},
  isOpen,
  onClose
}: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [filters, setFilters] = useState<FilterValue>(defaultFilters)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['lead', 'customer', 'deal', 'task', 'proposal', 'workflow'])
  
  const navigate = useNavigate()
  const { results, loading, error, totalCount, hasMore, search, loadMore, clearResults } = useAdvancedSearch()

  const performSearch = useCallback(async () => {
    const searchOptions: SearchOptions = {
      query: query.trim() || undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      filters,
      sortBy: 'relevance',
      limit: 20
    }
    
    await search(searchOptions)
  }, [query, selectedTypes, filters, search])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim() || Object.keys(filters).length > 0) {
        performSearch()
        setShowResults(true)
      } else {
        clearResults()
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, filters, selectedTypes, performSearch, clearResults])

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    setQuery('')
    
    // Navigate to the appropriate page
    const routeMap: Record<string, string> = {
      lead: '/leads',
      customer: '/customers', 
      deal: '/deals',
      task: '/tasks',
      proposal: '/proposals',
      workflow: '/workflows'
    }
    
    const route = routeMap[result.type]
    if (route) {
      navigate(`${route}?id=${result.id}`)
    }
    
    onResultSelect?.(result)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSelectedTypes(['lead', 'customer', 'deal', 'task', 'proposal', 'workflow'])
  }

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key]
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value !== undefined && value !== null && value !== ''
  }).length + (selectedTypes.length < 6 ? 1 : 0)

  // Filter configurations for the search
  const searchFilters: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'new', label: 'New' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'negotiation', label: 'Negotiation' },
        { value: 'closed_won', label: 'Closed Won' },
        { value: 'closed_lost', label: 'Closed Lost' },
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ]
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'date-range'
    },
    {
      id: 'valueRange',
      label: 'Value Range',
      type: 'number-range'
    },
    {
      id: 'assignedTo',
      label: 'Assigned To',
      type: 'select',
      options: []
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'multiselect',
      options: []
    },
    {
      id: 'company',
      label: 'Company',
      type: 'text'
    }
  ]

  return (
    <div className={cn('relative w-full', className)}>
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-20"
            onFocus={() => (query || Object.keys(filters).length > 0) && setShowResults(true)}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {showFilters && (
              <Popover open={showFilterPanel} onOpenChange={setShowFilterPanel}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <SlidersHorizontal className="h-3 w-3" />
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Search Filters</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear All
                      </Button>
                    </div>
                    
                    {/* Module Types */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Search In</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'lead', label: 'Leads' },
                          { value: 'customer', label: 'Customers' },
                          { value: 'deal', label: 'Deals' },
                          { value: 'task', label: 'Tasks' },
                          { value: 'proposal', label: 'Proposals' },
                          { value: 'workflow', label: 'Workflows' }
                        ].map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={type.value}
                              checked={selectedTypes.includes(type.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTypes(prev => [...prev, type.value])
                                } else {
                                  setSelectedTypes(prev => prev.filter(t => t !== type.value))
                                }
                              }}
                            />
                            <Label htmlFor={type.value} className="text-sm">
                              {type.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <FilterPanel
                    filters={searchFilters}
                    values={filters}
                    onChange={setFilters}
                    onClear={() => setFilters({})}
                    title="Advanced Filters"
                    className="border-t"
                    collapsible={false}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setShowResults(false)
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showResults && (
          <Card className="w-full max-h-96 overflow-y-auto">
            <CardContent className="p-4">
              <SearchResults
                results={results}
                loading={loading}
                error={error}
                totalCount={totalCount}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onResultClick={handleResultClick}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default GlobalSearch