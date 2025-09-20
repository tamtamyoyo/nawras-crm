import React from 'react'
import { SearchResult } from '@/hooks/useAdvancedSearch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Building2,
  Handshake,
  CheckSquare,
  FileText,
  Workflow,
  Calendar,
  DollarSign,
  User,
  Tag,
  ExternalLink,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  error: string | null
  totalCount: number
  hasMore: boolean
  onLoadMore: () => void
  onResultClick: (result: SearchResult) => void
  className?: string
}

const typeConfig = {
  lead: {
    icon: Users,
    label: 'Lead',
    color: 'bg-blue-100 text-blue-800',
    route: '/leads'
  },
  customer: {
    icon: Building2,
    label: 'Customer',
    color: 'bg-green-100 text-green-800',
    route: '/customers'
  },
  deal: {
    icon: Handshake,
    label: 'Deal',
    color: 'bg-purple-100 text-purple-800',
    route: '/deals'
  },
  task: {
    icon: CheckSquare,
    label: 'Task',
    color: 'bg-orange-100 text-orange-800',
    route: '/tasks'
  },
  proposal: {
    icon: FileText,
    label: 'Proposal',
    color: 'bg-indigo-100 text-indigo-800',
    route: '/proposals'
  },
  workflow: {
    icon: Workflow,
    label: 'Workflow',
    color: 'bg-gray-100 text-gray-800',
    route: '/workflows'
  }
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  new: 'bg-blue-100 text-blue-800',
  qualified: 'bg-green-100 text-green-800',
  proposal: 'bg-purple-100 text-purple-800',
  negotiation: 'bg-orange-100 text-orange-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

function SearchResultCard({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const config = typeConfig[result.type]
  const Icon = config.icon

  const formatValue = (value?: number) => {
    if (!value) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return null
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className={cn('text-white', config.color.replace('100', '500').replace('800', '50'))}>
                <Icon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn('text-xs', config.color)}>
                  {config.label}
                </Badge>
                {result.relevanceScore && result.relevanceScore > 5 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Star className="h-3 w-3 fill-current" />
                    <span>Relevant</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                {result.title}
              </h3>
              
              {result.subtitle && (
                <p className="text-sm text-gray-600 truncate mb-1">
                  {result.subtitle}
                </p>
              )}
              
              {result.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {result.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 flex-wrap">
                {result.status && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', statusColors[result.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800')}
                  >
                    {result.status.replace('_', ' ')}
                  </Badge>
                )}
                
                {result.priority && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', priorityColors[result.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800')}
                  >
                    {result.priority}
                  </Badge>
                )}
                
                {result.value && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatValue(result.value)}</span>
                  </div>
                )}
                
                {result.assignedTo && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <User className="h-3 w-3" />
                    <span>{result.assignedTo}</span>
                  </div>
                )}
                
                {result.date && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(result.date)}</span>
                  </div>
                )}
              </div>
              
              {result.tags && result.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <Tag className="h-3 w-3 text-gray-400" />
                  {result.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {result.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{result.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SearchResultSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SearchResults({
  results,
  loading,
  error,
  totalCount,
  hasMore,
  onLoadMore,
  onResultClick,
  className
}: SearchResultsProps) {
  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-red-600 mb-2">Search Error</div>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    )
  }

  if (!loading && results.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-gray-500 mb-2">No results found</div>
        <p className="text-sm text-gray-400">Try adjusting your search terms or filters</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {totalCount > 0 && (
        <div className="text-sm text-gray-600 mb-4">
          Found {totalCount.toLocaleString()} result{totalCount !== 1 ? 's' : ''}
        </div>
      )}
      
      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultCard
            key={`${result.type}-${result.id}`}
            result={result}
            onClick={() => onResultClick(result)}
          />
        ))}
        
        {loading && (
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <SearchResultSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}
      </div>
      
      {hasMore && !loading && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            Load More Results
          </Button>
        </div>
      )}
    </div>
  )
}