import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  FileText, 
  Filter,
  Grid,
  List as ListIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { ProposalTemplate } from './ProposalTemplateBuilder'
import { ProposalTemplatePreview } from './ProposalTemplatePreview'

interface ProposalTemplateLibraryProps {
  templates: ProposalTemplate[]
  onCreateNew: () => void
  onEdit: (template: ProposalTemplate) => void
  onDuplicate: (template: ProposalTemplate) => void
  onDelete: (template: ProposalTemplate) => void
  onUseTemplate: (template: ProposalTemplate) => void
  loading?: boolean
}

type ViewMode = 'grid' | 'list'
type SortBy = 'name' | 'category' | 'created_at' | 'updated_at'

const TEMPLATE_CATEGORIES = [
  'All Categories',
  'Standard Proposal',
  'Service Agreement',
  'Product Quote',
  'Consulting Proposal',
  'Partnership Agreement',
  'Custom'
]

export function ProposalTemplateLibrary({
  templates,
  onCreateNew,
  onEdit,
  onDuplicate,
  onDelete,
  onUseTemplate,
  loading = false
}: ProposalTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [sortBy, setSortBy] = useState<SortBy>('updated_at')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null)

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All Categories' || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category)
        case 'created_at':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'updated_at':
        default:
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      }
    })

  const handlePreview = useCallback((template: ProposalTemplate) => {
    setPreviewTemplate(template)
  }, [])

  const handleDuplicate = useCallback((template: ProposalTemplate) => {
    onDuplicate(template)
    toast.success(`Template "${template.name}" duplicated`)
  }, [onDuplicate])

  const handleDelete = useCallback((template: ProposalTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      onDelete(template)
      toast.success(`Template "${template.name}" deleted`)
    }
  }, [onDelete])

  const handleUseTemplate = useCallback((template: ProposalTemplate) => {
    onUseTemplate(template)
    toast.success(`Using template "${template.name}"`)
  }, [onUseTemplate])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proposal Templates</h2>
          <p className="text-muted-foreground">
            Manage and use your proposal templates
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Mode */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'All Categories'
                ? 'Try adjusting your search or filters'
                : 'Create your first proposal template to get started'}
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode={viewMode}
              onPreview={handlePreview}
              onEdit={onEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onUse={handleUseTemplate}
            />
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how this template will look in a proposal
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <ProposalTemplatePreview
              template={previewTemplate}
              onEdit={() => {
                setPreviewTemplate(null)
                onEdit(previewTemplate)
              }}
              showActions={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Template Card Component
interface TemplateCardProps {
  template: ProposalTemplate
  viewMode: ViewMode
  onPreview: (template: ProposalTemplate) => void
  onEdit: (template: ProposalTemplate) => void
  onDuplicate: (template: ProposalTemplate) => void
  onDelete: (template: ProposalTemplate) => void
  onUse: (template: ProposalTemplate) => void
}

function TemplateCard({
  template,
  viewMode,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
  onUse
}: TemplateCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{template.category}</Badge>
              <Badge variant="secondary">{template.sections.length} sections</Badge>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={() => onPreview(template)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(template)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDuplicate(template)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(template)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => onUse(template)}>
                  Use Template
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {template.description}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-3">
          <Badge variant="outline">{template.category}</Badge>
          <Badge variant="secondary">{template.sections.length} sections</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {template.updated_at && (
              <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => onPreview(template)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(template)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(template)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(template)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button className="w-full mt-3" onClick={() => onUse(template)}>
          Use Template
        </Button>
      </CardContent>
    </Card>
  )
}