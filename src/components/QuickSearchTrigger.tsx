import React from 'react'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface QuickSearchTriggerProps {
  onClick: () => void
}

export function QuickSearchTrigger({ onClick }: QuickSearchTriggerProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      data-testid="quick-search-trigger"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}

export default QuickSearchTrigger