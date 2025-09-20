import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Move, 
  Type, 
  Image, 
  Table, 
  List, 
  FileText,
  Eye,
  Save,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

export interface TemplateSection {
  id: string
  type: 'text' | 'image' | 'table' | 'list' | 'variable'
  title: string
  content: string
  variables?: string[]
  order: number
  required: boolean
}

export interface ProposalTemplate {
  id?: string
  name: string
  description: string
  category: string
  sections: TemplateSection[]
  variables: Record<string, string>
  created_at?: string
  updated_at?: string
}

interface ProposalTemplateBuilderProps {
  template?: ProposalTemplate
  onSave: (template: ProposalTemplate) => void
  onPreview: (template: ProposalTemplate) => void
}

const SECTION_TYPES = [
  { value: 'text', label: 'Text Block', icon: Type },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'table', label: 'Table', icon: Table },
  { value: 'list', label: 'List', icon: List },
  { value: 'variable', label: 'Dynamic Variable', icon: FileText }
]

const TEMPLATE_CATEGORIES = [
  'Standard Proposal',
  'Service Agreement',
  'Product Quote',
  'Consulting Proposal',
  'Partnership Agreement',
  'Custom'
]

const DEFAULT_VARIABLES = [
  '{{company_name}}',
  '{{client_name}}',
  '{{deal_title}}',
  '{{deal_value}}',
  '{{proposal_date}}',
  '{{valid_until}}',
  '{{contact_person}}',
  '{{contact_email}}',
  '{{contact_phone}}'
]

export function ProposalTemplateBuilder({ 
  template, 
  onSave, 
  onPreview 
}: ProposalTemplateBuilderProps) {
  const [templateData, setTemplateData] = useState<ProposalTemplate>(
    template || {
      name: '',
      description: '',
      category: 'Standard Proposal',
      sections: [],
      variables: {}
    }
  )

  const [selectedSectionType, setSelectedSectionType] = useState<string>('text')

  const addSection = useCallback(() => {
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      type: selectedSectionType as TemplateSection['type'],
      title: `New ${selectedSectionType} Section`,
      content: getSectionDefaultContent(selectedSectionType),
      variables: extractVariables(getSectionDefaultContent(selectedSectionType)),
      order: templateData.sections.length,
      required: false
    }

    setTemplateData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }, [selectedSectionType, templateData.sections.length])

  const removeSection = useCallback((sectionId: string) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }))
  }, [])

  const updateSection = useCallback((sectionId: string, updates: Partial<TemplateSection>) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              ...updates,
              variables: updates.content ? extractVariables(updates.content) : section.variables
            }
          : section
      )
    }))
  }, [])

  const onDragEnd = useCallback((result: { destination?: { index: number } | null; source: { index: number } }) => {
    if (!result.destination) return

    const items = Array.from(templateData.sections)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const reorderedSections = items.map((section, index) => ({
      ...section,
      order: index
    }))

    setTemplateData(prev => ({
      ...prev,
      sections: reorderedSections
    }))
  }, [templateData.sections])

  const handleSave = useCallback(() => {
    if (!templateData.name.trim()) {
      toast.error('Please enter a template name')
      return
    }

    if (templateData.sections.length === 0) {
      toast.error('Please add at least one section')
      return
    }

    onSave(templateData)
    toast.success('Template saved successfully')
  }, [templateData, onSave])

  const handlePreview = useCallback(() => {
    onPreview(templateData)
  }, [templateData, onPreview])

  const duplicateTemplate = useCallback(() => {
    const duplicated = {
      ...templateData,
      id: undefined,
      name: `${templateData.name} (Copy)`,
      created_at: undefined,
      updated_at: undefined
    }
    setTemplateData(duplicated)
    toast.success('Template duplicated')
  }, [templateData])

  return (
    <div className="space-y-6">
      {/* Template Header */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>
            Configure the basic information for your proposal template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={templateData.category}
                onValueChange={(value) => setTemplateData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={templateData.description}
              onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this template's purpose and use case"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Sections</CardTitle>
              <CardDescription>
                Build your proposal by adding and arranging sections
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedSectionType} onValueChange={setSelectedSectionType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map(type => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Button onClick={addSection}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templateData.sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sections added yet. Start building your template by adding sections above.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {templateData.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <SectionEditor
                          key={section.id}
                          section={section}
                          index={index}
                          onUpdate={updateSection}
                          onRemove={removeSection}
                        />
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Available Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
          <CardDescription>
            Use these variables in your content to make it dynamic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_VARIABLES.map(variable => (
              <Badge key={variable} variant="outline" className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(variable)
                  toast.success(`Copied ${variable} to clipboard`)
                }}
              >
                {variable}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={duplicateTemplate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper function to get default content for section types
function getSectionDefaultContent(type: string): string {
  switch (type) {
    case 'text':
      return 'Enter your text content here. You can use variables like {{company_name}} and {{client_name}}.'
    case 'image':
      return 'Image placeholder - upload or specify image URL'
    case 'table':
      return 'Item | Description | Quantity | Price\n--- | --- | --- | ---\nService 1 | {{service_description}} | 1 | {{service_price}}'
    case 'list':
      return '• First item\n• Second item\n• Third item with {{variable}}'
    case 'variable':
      return '{{custom_variable}}'
    default:
      return 'Default content'
  }
}

// Helper function to extract variables from content
function extractVariables(content: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g
  const matches = content.match(variableRegex) || []
  return [...new Set(matches)]
}

// Section Editor Component
interface SectionEditorProps {
  section: TemplateSection
  index: number
  onUpdate: (sectionId: string, updates: Partial<TemplateSection>) => void
  onRemove: (sectionId: string) => void
}

function SectionEditor({ section, index, onUpdate, onRemove }: SectionEditorProps) {
  const sectionType = SECTION_TYPES.find(t => t.value === section.type)
  const Icon = sectionType?.icon || FileText

  return (
    <Draggable draggableId={section.id} index={index}>
      {(provided) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="border-l-4 border-l-blue-500"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div {...provided.dragHandleProps} className="cursor-move">
                  <Move className="h-4 w-4 text-muted-foreground" />
                </div>
                <Icon className="h-4 w-4" />
                <Input
                  value={section.title}
                  onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                  className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                />
                <Badge variant="outline">{sectionType?.label}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(section.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={section.content}
              onChange={(e) => onUpdate(section.id, { content: e.target.value })}
              placeholder={`Enter ${section.type} content...`}
              rows={section.type === 'table' ? 6 : 4}
            />
            {section.variables && section.variables.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Variables in this section:</Label>
                <div className="flex flex-wrap gap-1">
                  {section.variables.map(variable => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  )
}