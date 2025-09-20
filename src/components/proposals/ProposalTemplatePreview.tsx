import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Download, Send, Edit } from 'lucide-react'
import { ProposalTemplate, TemplateSection } from './ProposalTemplateBuilder'

interface ProposalTemplatePreviewProps {
  template: ProposalTemplate
  sampleData?: Record<string, string>
  onEdit?: () => void
  onDownload?: () => void
  onSend?: () => void
  showActions?: boolean
}

const DEFAULT_SAMPLE_DATA = {
  '{{company_name}}': 'Acme Corporation',
  '{{client_name}}': 'John Smith',
  '{{deal_title}}': 'Enterprise Software Solution',
  '{{deal_value}}': '$50,000',
  '{{proposal_date}}': new Date().toLocaleDateString(),
  '{{valid_until}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  '{{contact_person}}': 'Sarah Johnson',
  '{{contact_email}}': 'sarah.johnson@acme.com',
  '{{contact_phone}}': '+1 (555) 123-4567',
  '{{service_description}}': 'Custom software development and implementation',
  '{{service_price}}': '$50,000',
  '{{custom_variable}}': 'Sample custom content'
}

export function ProposalTemplatePreview({
  template,
  sampleData = DEFAULT_SAMPLE_DATA,
  onEdit,
  onDownload,
  onSend,
  showActions = true
}: ProposalTemplatePreviewProps) {
  const processedSections = useMemo(() => {
    return template.sections
      .sort((a, b) => a.order - b.order)
      .map(section => ({
        ...section,
        processedContent: replaceVariables(section.content, sampleData)
      }))
  }, [template.sections, sampleData])

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <p className="text-muted-foreground">{template.description}</p>
          <Badge variant="outline" className="mt-2">{template.category}</Badge>
        </div>
        {showActions && (
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            {onSend && (
              <Button onClick={onSend}>
                <Send className="h-4 w-4 mr-2" />
                Send Proposal
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Preview Content */}
      <ScrollArea className="h-[600px] w-full">
        <div className="space-y-6 pr-4">
          {processedSections.map((section) => (
            <PreviewSection key={section.id} section={section} />
          ))}
        </div>
      </ScrollArea>

      {/* Template Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Template Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Sections:</span> {template.sections.length}
            </div>
            <div>
              <span className="font-medium">Category:</span> {template.category}
            </div>
            {template.created_at && (
              <div>
                <span className="font-medium">Created:</span> {new Date(template.created_at).toLocaleDateString()}
              </div>
            )}
            {template.updated_at && (
              <div>
                <span className="font-medium">Updated:</span> {new Date(template.updated_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Preview Section Component
interface PreviewSectionProps {
  section: TemplateSection & { processedContent: string }
}

function PreviewSection({ section }: PreviewSectionProps) {
  const renderContent = () => {
    switch (section.type) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            {section.processedContent.split('\n').map((line, index) => (
              <p key={index} className="mb-2">
                {line}
              </p>
            ))}
          </div>
        )
      
      case 'list':
        return (
          <ul className="list-disc list-inside space-y-1">
            {section.processedContent.split('\n').map((item, index) => {
              const cleanItem = item.replace(/^[•\-*]\s*/, '')
              return cleanItem.trim() ? (
                <li key={index}>{cleanItem}</li>
              ) : null
            })}
          </ul>
        )
      
      case 'table':
        return <TableRenderer content={section.processedContent} />
      
      case 'image':
        return (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <div className="text-muted-foreground">
              📷 {section.processedContent}
            </div>
          </div>
        )
      
      case 'variable':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-mono text-sm">{section.processedContent}</div>
          </div>
        )
      
      default:
        return <div>{section.processedContent}</div>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{section.title}</CardTitle>
        {section.required && (
          <Badge variant="secondary" className="w-fit">Required</Badge>
        )}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}

// Table Renderer Component
interface TableRendererProps {
  content: string
}

function TableRenderer({ content }: TableRendererProps) {
  const lines = content.split('\n').filter(line => line.trim())
  
  if (lines.length < 2) {
    return <div className="text-muted-foreground">Invalid table format</div>
  }

  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h)
  const separatorLine = lines[1]
  const rows = lines.slice(2).map(line => 
    line.split('|').map(cell => cell.trim()).filter(cell => cell)
  )

  // Validate table format
  if (!separatorLine.includes('---')) {
    return <div className="text-muted-foreground">Invalid table format</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((header, index) => (
              <th key={index} className="border border-border p-2 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-border p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Helper function to replace variables in content
function replaceVariables(content: string, data: Record<string, string>): string {
  let processedContent = content
  
  Object.entries(data).forEach(([variable, value]) => {
    const regex = new RegExp(variable.replace(/[{}]/g, '$&'), 'g')
    processedContent = processedContent.replace(regex, value)
  })
  
  return processedContent
}