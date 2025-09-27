import React, { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DollarSign,
  Calendar,
  User,
  Building,
  Edit,
  Trash2,
  GripVertical,
  Globe,
  TrendingUp,
  Clock,
  Target,
  Search,
  Filter,
  Copy,
  Archive,
  CheckSquare,
  X
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Database } from '../../lib/database.types'
import { toast } from 'sonner'

type Deal = Database['public']['Tables']['deals']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

const DEAL_STAGES = [
  { 
    id: 'prospecting', 
    title: 'Prospecting', 
    color: 'bg-blue-50 border-blue-200', 
    headerColor: 'bg-blue-100',
    icon: Target,
    description: 'Initial contact and qualification'
  },
  { 
    id: 'qualification', 
    title: 'Qualification', 
    color: 'bg-yellow-50 border-yellow-200', 
    headerColor: 'bg-yellow-100',
    icon: User,
    description: 'Needs assessment and budget confirmation'
  },
  { 
    id: 'proposal', 
    title: 'Proposal', 
    color: 'bg-orange-50 border-orange-200', 
    headerColor: 'bg-orange-100',
    icon: Clock,
    description: 'Proposal preparation and presentation'
  },
  { 
    id: 'negotiation', 
    title: 'Negotiation', 
    color: 'bg-purple-50 border-purple-200', 
    headerColor: 'bg-purple-100',
    icon: TrendingUp,
    description: 'Terms discussion and finalization'
  },
  { 
    id: 'closed_won', 
    title: 'Closed Won', 
    color: 'bg-green-50 border-green-200', 
    headerColor: 'bg-green-100',
    icon: DollarSign,
    description: 'Deal successfully closed'
  },
  { 
    id: 'closed_lost', 
    title: 'Closed Lost', 
    color: 'bg-red-50 border-red-200', 
    headerColor: 'bg-red-100',
    icon: Trash2,
    description: 'Deal lost or cancelled'
  },
]

interface EnhancedDealCardProps {
  deal: Deal
  customer?: Customer
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
  onExport: (deal: Deal) => void
  onSelect?: (dealId: string, selected: boolean) => void
  isSelected?: boolean
  isDragging?: boolean
}

const EnhancedDealCard = React.memo(function EnhancedDealCard({ 
  deal, 
  customer, 
  onEdit, 
  onDelete, 
  onExport, 
  onSelect,
  isSelected = false,
  isDragging 
}: EnhancedDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isBeingDragged = isDragging || isSortableDragging

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-3 transition-all duration-200 hover:shadow-lg cursor-pointer group",
        isBeingDragged && "opacity-50 rotate-2 scale-105 shadow-xl z-50",
        isSelected && "ring-2 ring-blue-500 bg-blue-50"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(deal.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-gray-900 truncate">
                {deal.title}
              </CardTitle>
              {customer && (
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{customer.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <button
              {...attributes}
              {...listeners}
              className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 rounded transition-colors"
              aria-label="Drag to move deal"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Deal Value and Probability */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium text-green-600">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>${deal.value?.toLocaleString() || '0'}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {deal.probability || 0}% probability
            </Badge>
          </div>
          
          {/* Expected Close Date */}
          {deal.expected_close_date && (
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
            </div>
          )}
          
          {/* Responsible Person */}
          {deal.responsible_person && (
            <div className="flex items-center text-xs text-gray-600">
              <User className="h-3 w-3 mr-1" />
              <span>{deal.responsible_person}</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(deal)
              }}
              className="h-7 w-7 p-0"
              data-testid="edit-deal-button"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onExport(deal)
              }}
              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
              data-testid="export-deal-button"
            >
              <Globe className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(deal)
              }}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
              data-testid="delete-deal-button"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

interface EnhancedKanbanColumnProps {
  stage: typeof DEAL_STAGES[0]
  deals: Deal[]
  customers: Customer[]
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
  onExport: (deal: Deal) => void
  onSelectDeal?: (dealId: string, selected: boolean) => void
  onSelectAll?: (stage: string, selected: boolean) => void
  selectedDeals?: Set<string>
  isOver?: boolean
  isDraggedOver?: boolean
}

const EnhancedKanbanColumn = React.memo(function EnhancedKanbanColumn({
  stage,
  deals,
  customers,
  onEdit,
  onDelete,
  onExport,
  onSelectDeal,
  onSelectAll,
  selectedDeals = new Set(),
  isOver = false,
  isDraggedOver = false
}: EnhancedKanbanColumnProps) {
  const stageDeals = deals.filter(deal => deal && deal.stage === stage.id)
  const totalValue = stageDeals.reduce((sum, deal) => sum + (deal?.value || 0), 0)
  const avgProbability = stageDeals.length > 0 
    ? Math.round(stageDeals.reduce((sum, deal) => sum + (deal?.probability || 0), 0) / stageDeals.length)
    : 0

  const IconComponent = stage.icon

  const stageSelectedCount = stageDeals.filter(deal => selectedDeals.has(deal.id)).length
  const allStageSelected = stageDeals.length > 0 && stageSelectedCount === stageDeals.length
  const someStageSelected = stageSelectedCount > 0 && stageSelectedCount < stageDeals.length

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn(
        "rounded-t-lg p-4 border-b-2",
        stage.headerColor,
        isOver && "ring-2 ring-blue-400 ring-opacity-50",
        isDraggedOver && "bg-green-50 ring-2 ring-green-300 shadow-lg"
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {onSelectAll && stageDeals.length > 0 && (
              <Checkbox
                checked={allStageSelected}
                ref={(el) => {
                  if (el) {
                    const checkbox = el as HTMLInputElement
                    checkbox.indeterminate = someStageSelected
                  }
                }}
                onCheckedChange={(checked) => onSelectAll(stage.id, !!checked)}
                className="mr-1"
              />
            )}
            <IconComponent className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">{stage.title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {stageDeals.length}
            </Badge>
            {stageSelectedCount > 0 && (
              <Badge variant="outline" className="text-xs text-blue-600">
                {stageSelectedCount} selected
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mb-3">{stage.description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-gray-900">${totalValue.toLocaleString()}</div>
            <div className="text-gray-600">Total Value</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-gray-900">{avgProbability}%</div>
            <div className="text-gray-600">Avg Probability</div>
          </div>
        </div>
      </div>
      
      {/* Drop Zone */}
      <div className={cn(
        "flex-1 p-4 min-h-[500px] transition-all duration-200",
        stage.color,
        isOver && "bg-blue-50 border-blue-300 border-dashed border-2"
      )}>
        <SortableContext items={stageDeals.map(deal => deal.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {stageDeals.map((deal) => {
              const customer = customers.find(c => c.id === deal.customer_id)
              return (
                <EnhancedDealCard
                  key={deal.id}
                  deal={deal}
                  customer={customer}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onExport={onExport}
                  onSelect={onSelectDeal}
                  isSelected={selectedDeals.has(deal.id)}
                />
              )
            })}
            
            {stageDeals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-sm">No deals in this stage</div>
                <div className="text-xs mt-1">Drag deals here to move them</div>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
})

interface EnhancedPipelineProps {
  deals: Deal[]
  customers: Customer[]
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
  onExport: (deal: Deal) => void
  onStageChange: (dealId: string, newStage: string) => Promise<void>
  onBulkAction?: (dealIds: string[], action: string) => Promise<void>
  loading?: boolean
}

export function EnhancedPipeline({
  deals,
  customers,
  onEdit,
  onDelete,
  onExport,
  onStageChange,
  onBulkAction,
  loading = false
}: EnhancedPipelineProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'high-value' | 'closing-soon' | 'overdue'>('all')
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Enhanced filtering logic
  const filteredDeals = useMemo(() => {
    let filtered = deals

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(deal => 
        deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers.find(c => c.id === deal.customer_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Advanced filters
    switch (filterBy) {
      case 'high-value':
        filtered = filtered.filter(deal => (deal.value || 0) > 10000)
        break
      case 'closing-soon': {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        filtered = filtered.filter(deal => 
          deal.expected_close_date && new Date(deal.expected_close_date) <= nextWeek
        )
        break
      }
      case 'overdue': {
        const today = new Date()
        filtered = filtered.filter(deal => 
          deal.expected_close_date && new Date(deal.expected_close_date) < today
        )
        break
      }
    }

    return filtered
  }, [deals, searchTerm, filterBy, customers])

  // Bulk action handlers
  const handleSelectDeal = (dealId: string, selected: boolean) => {
    const newSelected = new Set(selectedDeals)
    if (selected) {
      newSelected.add(dealId)
    } else {
      newSelected.delete(dealId)
    }
    setSelectedDeals(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleSelectAll = (stage: string, selected: boolean) => {
    const stageDeals = filteredDeals.filter(deal => deal && deal.stage === stage)
    const newSelected = new Set(selectedDeals)
    
    stageDeals.forEach(deal => {
      if (selected) {
        newSelected.add(deal.id)
      } else {
        newSelected.delete(deal.id)
      }
    })
    
    setSelectedDeals(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleBulkAction = async (action: string) => {
    if (!onBulkAction || selectedDeals.size === 0) return
    
    try {
      await onBulkAction(Array.from(selectedDeals), action)
      setSelectedDeals(new Set())
      setShowBulkActions(false)
      toast.success(`Bulk ${action} completed successfully`)
    } catch {
      toast.error(`Failed to perform bulk ${action}`)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const deal = filteredDeals.find(d => d.id === event.active.id)
    if (deal) {
      setActiveDeal(deal)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    const overId = over ? over.id as string : null
    setOverId(overId)
    
    // Set dragged over stage for visual feedback
    if (overId && DEAL_STAGES.some(stage => stage.id === overId)) {
      setDraggedOverStage(overId)
    } else {
      setDraggedOverStage(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveDeal(null)
    setOverId(null)
    setDraggedOverStage(null)
    
    if (!over) return
    
    const dealId = active.id as string
    const newStage = over.id as string
    
    // Only update if the stage actually changed
    const deal = filteredDeals.find(d => d.id === dealId)
    if (deal && deal.stage !== newStage) {
      try {
        await onStageChange(dealId, newStage)
        toast.success(`Deal moved to ${DEAL_STAGES.find(s => s.id === newStage)?.title || newStage}`)
      } catch (error) {
        console.error('Failed to update deal stage:', error)
        toast.error('Failed to move deal')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search deals, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as typeof filterBy)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                <SelectItem value="high-value">High Value (&gt;$10k)</SelectItem>
                <SelectItem value="closing-soon">Closing Soon</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Results Summary */}
          <div className="text-sm text-gray-500">
            {filteredDeals.length} of {deals.length} deals
            {selectedDeals.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedDeals.size} selected)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedDeals.size} deal{selectedDeals.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('archive')}
                className="text-gray-600"
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('duplicate')}
                className="text-gray-600"
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDeals(new Set())
                  setShowBulkActions(false)
                }}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEAL_STAGES.map((stage) => {
            return (
              <EnhancedKanbanColumn
                key={stage.id}
                stage={stage}
                deals={filteredDeals}
                customers={customers}
                onEdit={onEdit}
                onDelete={onDelete}
                onExport={onExport}
                onSelectDeal={handleSelectDeal}
                onSelectAll={handleSelectAll}
                selectedDeals={selectedDeals}
                isOver={overId === stage.id}
                isDraggedOver={draggedOverStage === stage.id}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeDeal && (
            <EnhancedDealCard
              deal={activeDeal}
              customer={customers.find(c => c.id === activeDeal.customer_id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onExport={onExport}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}