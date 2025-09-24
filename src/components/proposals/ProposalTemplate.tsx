import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFormValidation, proposalSchema } from '@/utils/validation'
import { Database } from '@/lib/database.types'
import {
  FileText,
  Edit3,
  Eye,
  Save,
  Download,
  Plus,
  Copy,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Package,
  Truck
} from 'lucide-react'
import { 
  PAYMENT_TERMS, 
  RESPONSIBLE_PERSONS, 
  calculateProposalTotals as calculateProformaInvoiceTotals
} from '../../lib/standardTemplate'

export interface ProposalSection {
  id: string
  type: 'text' | 'table' | 'list' | 'image' | 'pricing' | 'timeline'
  title: string
  content: Record<string, unknown>
  editable: boolean
  required: boolean
}

export interface ProposalTemplate {
  id: string
  name: string
  description: string
  category: string
  sections: ProposalSection[]
  variables: Record<string, unknown>
  styling: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    fontSize: string
    logoUrl?: string
  }
  createdAt: Date
  updatedAt: Date
}

interface ProposalTemplateProps {
  template?: ProposalTemplate
  dealData?: Record<string, unknown>
  customerData?: Record<string, unknown>
  onSave?: (template: ProposalTemplate) => void
  onGenerate?: (proposal: Record<string, unknown>) => void
  mode?: 'edit' | 'preview' | 'generate'
}

const DEFAULT_TEMPLATE: ProposalTemplate = {
  id: '',
  name: 'Standard Proforma Invoice',
  description: 'A comprehensive proforma invoice template',
  category: 'general',
  sections: [
    {
      id: 'header',
      type: 'text',
      title: 'Proforma Invoice Header',
      content: {
        title: 'PROFORMA INVOICE',
        invoiceNumber: 'PI-{{invoice_number}}',
        date: '{{current_date}}',
        validUntil: '{{valid_until_date}}',
        preparedBy: '{{sales_rep_name}}'
      },
      editable: true,
      required: true
    },
    {
      id: 'billing-info',
      type: 'text',
      title: 'Billing Information',
      content: {
        text: 'Bill To:\n{{customer_name}}\n{{customer_address}}\n{{customer_city}}, {{customer_state}} {{customer_zip}}\n{{customer_country}}\n\nShip To:\n{{shipping_address}}\n{{shipping_city}}, {{shipping_state}} {{shipping_zip}}\n{{shipping_country}}'
      },
      editable: true,
      required: true
    },
    {
      id: 'items-description',
      type: 'text',
      title: 'Items & Services',
      content: {
        text: 'This proforma invoice includes the following items and services for {{customer_name}}:\n\n• {{item_description_1}}\n• {{item_description_2}}\n• {{item_description_3}}\n\nAll items are subject to availability and final confirmation upon order placement.'
      },
      editable: true,
      required: true
    },
    {
      id: 'pricing',
      type: 'pricing',
      title: 'Pricing Details',
      content: {
        items: [
          { description: '{{item_1}}', quantity: 1, rate: '{{price_1}}', total: '{{total_1}}' },
          { description: '{{item_2}}', quantity: 1, rate: '{{price_2}}', total: '{{total_2}}' }
        ],
        subtotal: '{{subtotal}}',
        tax: '{{tax_amount}}',
        shipping: '{{shipping_cost}}',
        total: '{{total_amount}}'
      },
      editable: true,
      required: true
    },
    {
      id: 'delivery-terms',
      type: 'text',
      title: 'Delivery & Payment Terms',
      content: {
        text: 'Delivery Terms:\n• Estimated delivery: {{delivery_date}}\n• Shipping method: {{shipping_method}}\n• Delivery location: {{delivery_address}}\n\nPayment Terms:\n• Payment due: {{payment_terms}}\n• Accepted methods: {{payment_methods}}\n• Currency: {{currency}}\n\nThis proforma invoice is valid until {{valid_until_date}}.'
      },
      editable: true,
      required: true
    },
    {
      id: 'terms-conditions',
      type: 'text',
      title: 'Terms & Conditions',
      content: {
        text: 'Important Notes:\n\n1. This is a proforma invoice for quotation purposes only\n2. No payment is due until formal invoice is issued\n3. Prices are subject to change without notice\n4. Final invoice may vary based on actual quantities and specifications\n5. All sales are subject to our standard terms and conditions\n\nFor questions regarding this proforma invoice, please contact {{sales_rep_name}} at {{contact_email}}.'
      },
      editable: true,
      required: true
    }
  ],
  variables: {
    invoice_number: '001',
    customer_name: 'Valued Client',
    current_date: new Date().toLocaleDateString(),
    valid_until_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    sales_rep_name: 'Sales Representative',
    customer_address: 'Customer Address',
    delivery_date: 'TBD',
    payment_terms: '30 days',
    currency: 'USD'
  },
  styling: {
    primaryColor: '#0088FE',
    secondaryColor: '#00C49F',
    fontFamily: 'Inter',
    fontSize: '14px'
  },
  createdAt: new Date(),
  updatedAt: new Date()
}

const TEMPLATE_CATEGORIES = [
  { value: 'general', label: 'General Business' },
  { value: 'software', label: 'Software Development' },
  { value: 'consulting', label: 'Consulting Services' },
  { value: 'marketing', label: 'Marketing Services' },
  { value: 'design', label: 'Design Services' },
  { value: 'custom', label: 'Custom Template' }
]

const SECTION_TYPES = [
  { value: 'text', label: 'Text Content', icon: FileText },
  { value: 'pricing', label: 'Pricing Table', icon: DollarSign },
  { value: 'timeline', label: 'Project Timeline', icon: Calendar },
  { value: 'list', label: 'Bullet List', icon: Plus },
  { value: 'table', label: 'Data Table', icon: Plus }
]



// Using imported calculateProformaInvoiceTotals function from standardTemplate

export function ProposalTemplate({
  template: propTemplate,
  dealData,
  customerData,
  onSave,
  onGenerate,
  mode = 'edit'
}: ProposalTemplateProps) {
  const [template, setTemplate] = useState<ProposalTemplate>(propTemplate || DEFAULT_TEMPLATE)
  const [previewMode, setPreviewMode] = useState(false)
  const [variables, setVariables] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(template.variables).map(([key, value]) => [key, String(value || '')])
    )
  )
  
  // Form validation
  const { errors, validateAll: validateForm } = useFormValidation(proposalSchema)
  const [formData, setFormData] = useState({
    title: template.name || '',
    customer_id: '',
    content: '',
    total_amount: 0,
    valid_until: '',
    deal_id: '',
    terms: ''
  })

  useEffect(() => {
    if (dealData || customerData) {
      // Auto-populate variables from deal and customer data
      const autoVariables = {
        ...variables,
        customer_name: String(customerData?.name || customerData?.company || 'Valued Client'),
        invoice_number: String(dealData?.id || '001'),
        deal_value: String(dealData?.value || 0),
        sales_rep_name: String(dealData?.assigned_to || 'Sales Representative'),
        current_date: new Date().toLocaleDateString(),
        valid_until_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
      setVariables(autoVariables)
    }
  }, [dealData, customerData, variables])

  const handleTemplateChange = (field: keyof ProposalTemplate, value: unknown) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date()
    }))
  }

  const handleSectionChange = (sectionId: string, field: string, value: unknown) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, [field]: value }
          : section
      ),
      updatedAt: new Date()
    }))
  }

  const addSection = (type: ProposalSection['type']) => {
    const newSection: ProposalSection = {
      id: `section-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      content: type === 'text' ? { text: '' } : {},
      editable: true,
      required: false
    }

    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updatedAt: new Date()
    }))
  }

  const removeSection = (sectionId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId),
      updatedAt: new Date()
    }))
  }

  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = template.sections.find(s => s.id === sectionId)
    if (sectionToDuplicate) {
      const duplicatedSection = {
        ...sectionToDuplicate,
        id: `section-${Date.now()}`,
        title: `${sectionToDuplicate.title} (Copy)`
      }
      setTemplate(prev => ({
        ...prev,
        sections: [...prev.sections, duplicatedSection],
        updatedAt: new Date()
      }))
    }
  }

  const replaceVariables = (text: string): string => {
    let result = text
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value || `{{${key}}}`)) 
    })
    return result
  }
  
  const calculateTotal = (): number => {
    // Calculate total from pricing sections
    let total = 0
    template.sections.forEach(section => {
      if (section.type === 'pricing' && section.content && typeof section.content === 'object') {
        const pricingContent = section.content as { items?: Array<{ quantity?: number; price?: number; rate?: number }> }
        if (pricingContent.items && Array.isArray(pricingContent.items)) {
          pricingContent.items.forEach((item) => {
            const price = item.price || parseFloat(String(item.rate || 0))
            total += (item.quantity || 0) * price
          })
        }
      }
    })
    return total
  }

  const handleSave = () => {
    // Validate the form
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving')
      return
    }
    
    if (!template.name.trim()) {
      toast.error('Template name is required')
      return
    }
    
    if (onSave) {
      onSave({ ...template, variables })
      toast.success('Template saved successfully')
    }
  }

  const handleGenerate = () => {
    // Validate the form
    if (!validateForm()) {
      toast.error('Please fix the validation errors before generating proforma invoice')
      return
    }
    
    if (!template.name.trim()) {
      toast.error('Template name is required')
      return
    }
    
    if (onGenerate) {
      const processedTemplate = {
        ...template,
        sections: template.sections.map(section => ({
          ...section,
          content: typeof section.content === 'object' && section.content.text
            ? { ...section.content, text: replaceVariables(String(section.content.text || '')) }
            : section.content
        }))
      }
      onGenerate(processedTemplate)
      toast.success('Proforma invoice generated successfully')
    }
  }

  const exportTemplate = async () => {
    try {
      // Import the PDF generator
      const { generateProposalPDF } = await import('@/utils/pdf-generator')
      
      // Prepare proforma invoice data for PDF generation
      const proposalData = {
        proposal: {
          id: template.id,
          title: variables.invoice_number ? `Proforma Invoice ${variables.invoice_number}` : template.name,
          deal_id: formData.deal_id || 'temp-deal-id',
          customer_id: formData.customer_id || 'temp-customer-id',
          content: JSON.stringify(template.sections),
          status: 'draft',
          valid_until: formData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          source: 'Other' as Database['public']['Tables']['customers']['Row']['source'],
          created_by: 'system',
          updated_by: 'system',
          total_amount: calculateTotal(),
          currency: 'USD',
          payment_terms: formData.terms || '30 days',
          delivery_method: 'email' as Database['public']['Tables']['proposals']['Row']['delivery_method'],
          responsible_person: 'Mr. Ali',
          proposal_type: 'custom' as Database['public']['Tables']['proposals']['Row']['proposal_type'],
          validity_period: 30,
          notes: '',
          approval_workflow: null,
          template_used: template.id,
          estimated_value: calculateTotal(),
          version: 1,
          created_at: template.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: template.updatedAt?.toISOString() || new Date().toISOString()
        } as Database['public']['Tables']['proposals']['Row'],
        customer: {
          id: 'customer-1',
          name: variables.customer_name || 'Valued Client',
          email: variables.customer_email || '',
          phone: '',
          company: variables.customer_name || 'Valued Client',
          address: '',
          status: 'active',
          source: 'Other' as Database['public']['Tables']['customers']['Row']['source'],
          tags: null,
          notes: '',
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          responsible_person: 'Mr. Ali',
          export_license_number: null,
          export_license_expiry: null,
          customs_broker: null,
          preferred_currency: 'USD',
          payment_terms_export: null,
          credit_limit_usd: null,
          export_documentation_language: 'en',
          special_handling_requirements: null,
          compliance_notes: '',
          version: 1
        } as Database['public']['Tables']['customers']['Row'],
        deal: {
          id: 'deal-1',
          title: variables.invoice_number ? `Proforma Invoice ${variables.invoice_number}` : template.name,
          value: calculateTotal(),
          customer_id: 'customer-1',
          lead_id: null,
          stage: 'proposal' as const,
          probability: 50,
          expected_close_date: formData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: template.description || '',
          source: 'Other' as Database['public']['Tables']['deals']['Row']['source'],
          assigned_to: null,
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          responsible_person: 'Mr. Ali' as const,
          competitor_info: null,
          decision_maker_name: null,
          decision_maker_email: null,
          decision_maker_phone: null,
          deal_source_detail: null,
          deal_type: 'new_business' as const,
          version: 1
        } satisfies Database['public']['Tables']['deals']['Row']
      }
      
      // Generate and download PDF
      generateProposalPDF(proposalData, {
        template: 'modern',
        colorScheme: {
          primary: template.styling?.primaryColor || '#0088FE',
          secondary: template.styling?.secondaryColor || '#00C49F',
          accent: '#FF8042'
        },
        branding: {
          companyName: 'Nawras CRM',
          address: '',
          phone: '',
          email: '',
          website: ''
        }
      })
      
      toast.success('Proforma invoice PDF exported successfully')
    } catch (error) {
      console.error('Error exporting proforma invoice:', error)
      toast.error('Failed to export proforma invoice PDF')
    }
  }

  const renderSectionContent = (section: ProposalSection) => {
    switch (section.type) {
      case 'text':
        const textContent = section.content as { title?: string; text?: string }
        return (
          <div className="space-y-4">
            {textContent.title && (
              <h3 className="text-lg font-semibold">
                {previewMode ? replaceVariables(textContent.title) : textContent.title}
              </h3>
            )}
            <div className="prose max-w-none">
              {previewMode ? (
                <div className="whitespace-pre-wrap">
                  {replaceVariables(textContent.text || '')}
                </div>
              ) : (
                <Textarea
                  value={textContent.text || ''}
                  onChange={(e) => handleSectionChange(section.id, 'content', { ...section.content, text: e.target.value })}
                  placeholder="Enter section content..."
                  className="min-h-32"
                />
              )}
            </div>
          </div>
        )

      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {((section.content as { items?: Record<string, unknown>[] }).items || []).map((item: Record<string, unknown>, index: number) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        {previewMode ? replaceVariables(String(item.description || '')) : String(item.description || '')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{String(item.quantity || '')}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {previewMode ? replaceVariables(String(item.rate || '')) : String(item.rate || '')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        {previewMode ? replaceVariables(String(item.total || '')) : String(item.total || '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Total:
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                      {previewMode ? replaceVariables(String((section.content as { total?: string }).total || '')) : (section.content as { total?: string }).total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )

      case 'timeline':
        return (
          <div className="space-y-4">
            {((section.content as { phases?: Record<string, unknown>[] }).phases || []).map((phase: Record<string, unknown>, index: number) => (
              <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {previewMode ? replaceVariables(String(phase.name || '')) : String(phase.name || '')}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Duration: {previewMode ? replaceVariables(String(phase.duration || '')) : String(phase.duration || '')}
                  </p>
                  <p className="text-sm mt-2">
                    {previewMode ? replaceVariables(String(phase.deliverables || '')) : String(phase.deliverables || '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )

      default:
        return (
          <div className="text-gray-500 italic">
            Section type "{section.type}" not implemented yet
          </div>
        )
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {mode === 'edit' ? 'Edit Template' : mode === 'preview' ? 'Preview Template' : 'Generate Proforma Invoice'}
          </h1>
          <p className="text-gray-600 mt-1">
            {template.description}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <Edit3 className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {mode !== 'preview' && (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          )}
          {mode === 'generate' && (
            <Button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700">
              <FileText className="h-4 w-4 mr-2" />
              Generate Proforma Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        {!previewMode && (
          <div className="lg:col-span-1 space-y-6">
            {/* Manual Input Form - Mirroring Invoice System */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer & Proforma Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={String(variables.customer_name || '')}
                    onChange={(e) => {
                      setVariables(prev => ({ ...prev, customer_name: e.target.value }))
                      setFormData(prev => ({ ...prev, customer_id: e.target.value }))
                      // Field validation removed
                    }}
                    placeholder="Enter customer name"
                    className={errors.customer_id ? 'border-red-500' : ''}
                  />
                  {errors.customer_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="proforma-title">Proforma Invoice Title *</Label>
                  <Input
                    id="proforma-title"
                    value={String(variables.proforma_title || '')}
                    onChange={(e) => {
                      setVariables(prev => ({ ...prev, proforma_title: e.target.value }))
                      setFormData(prev => ({ ...prev, content: e.target.value }))
                      // Field validation removed
                    }}
                    placeholder="Enter proforma invoice title"
                    className={errors.content ? 'border-red-500' : ''}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="valid-until">Valid Until *</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, valid_until: e.target.value }))
                      // Field validation removed
                    }}
                    className={errors.valid_until ? 'border-red-500' : ''}
                  />
                  {errors.valid_until && (
                    <p className="text-sm text-red-500 mt-1">{errors.valid_until}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="responsible-person">Responsible Person</Label>
                  <Select
                    value={String(variables.responsible_person || '')}
                    onValueChange={(value) => setVariables(prev => ({ ...prev, responsible_person: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select responsible person" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPONSIBLE_PERSONS.map(person => (
                        <SelectItem key={person} value={person}>
                          {person}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Product/Service Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products & Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(num => (
                  <div key={num} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Item {num}</Label>
                    </div>
                    <div>
                      <Label htmlFor={`item-${num}-name`}>Product/Service Name</Label>
                      <Input
                        id={`item-${num}-name`}
                        value={String(variables[`item_${num}_name`] || '')}
                        onChange={(e) => setVariables(prev => ({ ...prev, [`item_${num}_name`]: e.target.value }))}
                        placeholder="Enter product/service name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`item-${num}-description`}>Description</Label>
                      <Textarea
                        id={`item-${num}-description`}
                        value={String(variables[`item_${num}_description`] || '')}
                        onChange={(e) => setVariables(prev => ({ ...prev, [`item_${num}_description`]: e.target.value }))}
                        placeholder="Enter description"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`item-${num}-quantity`}>Qty</Label>
                        <Input
                          id={`item-${num}-quantity`}
                          type="number"
                          value={String(variables[`item_${num}_quantity`] || '1')}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 1
                            const price = parseFloat(String(variables[`item_${num}_price`] || '0').replace('$', '') || '0')
                            const total = quantity * price
                            setVariables(prev => ({ 
                              ...prev, 
                              [`item_${num}_quantity`]: e.target.value,
                              [`item_${num}_total`]: `$${total.toFixed(2)}`
                            }))
                          }}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`item-${num}-price`}>Unit Price</Label>
                        <Input
                          id={`item-${num}-price`}
                          value={String(variables[`item_${num}_price`] || '')}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value.replace('$', '') || '0')
                            const quantity = parseInt(String(variables[`item_${num}_quantity`] || '1'))
                            const total = quantity * price
                            const formattedPrice = e.target.value.startsWith('$') ? e.target.value : `$${e.target.value}`
                            setVariables(prev => ({ 
                              ...prev, 
                              [`item_${num}_price`]: formattedPrice,
                              [`item_${num}_total`]: `$${total.toFixed(2)}`
                            }))
                          }}
                          placeholder="$0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`item-${num}-total`}>Total</Label>
                        <Input
                          id={`item-${num}-total`}
                          value={String(variables[`item_${num}_total`] || '$0.00')}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipping-address">Shipping Address</Label>
                  <Textarea
                    id="shipping-address"
                    value={String(variables.shipping_address || '')}
                    onChange={(e) => setVariables(prev => ({ ...prev, shipping_address: e.target.value }))}
                    placeholder="Enter shipping address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-method">Shipping Method</Label>
                  <Select
                    value={String(variables.shipping_method || '')}
                    onValueChange={(value) => setVariables(prev => ({ ...prev, shipping_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Shipping</SelectItem>
                      <SelectItem value="express">Express Shipping</SelectItem>
                      <SelectItem value="overnight">Overnight Shipping</SelectItem>
                      <SelectItem value="pickup">Customer Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shipping-cost">Shipping Cost</Label>
                  <Input
                    id="shipping-cost"
                    value={String(variables.shipping_cost || '$0')}
                    onChange={(e) => {
                      const cost = e.target.value.startsWith('$') ? e.target.value : `$${e.target.value}`
                      setVariables(prev => ({ ...prev, shipping_cost: cost }))
                    }}
                    placeholder="$0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated-delivery">Estimated Delivery</Label>
                  <Input
                    id="estimated-delivery"
                    value={String(variables.estimated_delivery || '')}
                    onChange={(e) => setVariables(prev => ({ ...prev, estimated_delivery: e.target.value }))}
                    placeholder="e.g., 3-5 business days"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment-terms">Payment Terms</Label>
                  <Select
                    value={String(variables.payment_terms || '')}
                    onValueChange={(value) => setVariables(prev => ({ ...prev, payment_terms: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map(term => (
                        <SelectItem key={term.value} value={term.label}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select
                    value={String(variables.payment_method || '')}
                    onValueChange={(value) => setVariables(prev => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="profit-percentage">Profit Margin (%)</Label>
                  <Input
                    id="profit-percentage"
                    type="number"
                    value={String(variables.profit_percentage || '20')}
                    onChange={(e) => setVariables(prev => ({ ...prev, profit_percentage: e.target.value }))}
                    placeholder="20"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={template.name}
                    onChange={(e) => {
                      handleTemplateChange('name', e.target.value)
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                      // Field validation removed
                    }}
                    placeholder="Enter template name"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={template.category}
                    onValueChange={(value) => handleTemplateChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={template.description}
                    onChange={(e) => handleTemplateChange('description', e.target.value)}
                    placeholder="Describe this template"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Totals Summary - Mirroring Invoice System */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Proforma Invoice Totals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totals = calculateProformaInvoiceTotals(variables)
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">{totals.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span className="font-medium">{totals.shipping}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (10%):</span>
                        <span className="font-medium">{totals.tax}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Profit ({totals.profitMargin}):</span>
                        <span className="font-medium">{totals.profit}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span className="text-lg">{totals.total}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={`var-${key}`} className="text-xs">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <Input
                      id={`var-${key}`}
                      value={String(value)}
                      onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`{{${key}}}`}
                      className="text-sm"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newKey = prompt('Enter variable name:')
                    if (newKey) {
                      setVariables(prev => ({ ...prev, [newKey]: '' }))
                    }
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </CardContent>
            </Card>

            {/* Add Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add Section</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {SECTION_TYPES.map(type => {
                    const Icon = type.icon
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        size="sm"
                        onClick={() => addSection(type.value as ProposalSection['type'])}
                        className="justify-start"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {type.label}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className={cn("space-y-6", previewMode ? "lg:col-span-4" : "lg:col-span-3")}>
          {previewMode ? (
            <div className="bg-white min-h-[800px] shadow-lg rounded-lg p-8 space-y-8">
              {/* Professional Header - Mirroring Invoice System */}
              <div className="border-b-2 border-blue-600 pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">PROFORMA INVOICE</h1>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Proforma Invoice #:</strong> {variables.proforma_number || 'PI-2024-001'}</p>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                      <p><strong>Valid Until:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-800 mb-2">{variables.company_name || 'Your Company Name'}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{variables.company_address || '123 Business St'}</p>
                      <p>{variables.company_city || 'City, State 12345'}</p>
                      <p>{variables.company_phone || '(555) 123-4567'}</p>
                      <p>{variables.company_email || 'info@company.com'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Proforma Invoice For:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-lg">{variables.customer_name || 'Customer Name'}</p>
                    <p className="text-sm text-gray-600 mt-1">{variables.customer_address || 'Customer Address'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Project Details:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{variables.proforma_title || 'Proforma Invoice Title'}</p>
                    <p className="text-sm text-gray-600 mt-1">Responsible: {variables.responsible_person || 'Team Member'}</p>
                  </div>
                </div>
              </div>

              {/* Products/Services Table - Professional Invoice Style */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Proposed Products & Services</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Unit Price</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[1, 2, 3].map(num => {
                        const itemName = variables[`item_${num}_name`]
                        const itemDesc = variables[`item_${num}_description`]
                        const itemQty = variables[`item_${num}_quantity`] || '1'
                        const itemPrice = variables[`item_${num}_price`] || '$0.00'
                        const itemTotal = variables[`item_${num}_total`] || '$0.00'
                        
                        if (!itemName) return null
                        
                        return (
                          <tr key={num} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{itemName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{itemDesc || 'No description'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{itemQty}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">{itemPrice}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{itemTotal}</td>
                          </tr>
                        )
                      }).filter(Boolean)}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section - Professional Invoice Style */}
              <div className="flex justify-end">
                <div className="w-80">
                  {(() => {
                    const totals = calculateProformaInvoiceTotals(variables)
                    return (
                      <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span className="font-medium">{totals.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Shipping ({variables.shipping_method || 'Standard'}):</span>
                          <span className="font-medium">{totals.shipping}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax (10%):</span>
                          <span className="font-medium">{totals.tax}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Profit Margin ({totals.profitMargin}):</span>
                          <span className="font-medium">{totals.profit}</span>
                        </div>
                        <div className="border-t border-gray-300 pt-3">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-blue-600">{totals.total}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Shipping Information */}
              {variables.shipping_address && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Shipping Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Shipping Address:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{variables.shipping_address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Details:</p>
                      <p className="text-sm text-gray-600">Method: {variables.shipping_method || 'Standard'}</p>
                      <p className="text-sm text-gray-600">Estimated: {variables.estimated_delivery || '3-5 business days'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Terms */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Terms & Conditions</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Payment Terms:</p>
                      <p className="text-sm text-gray-600">{variables.payment_terms || 'Net 30 days'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Payment Method:</p>
                      <p className="text-sm text-gray-600">{variables.payment_method || 'Bank Transfer'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• This proforma invoice is valid for 30 days from the date above.</p>
                    <p>• All prices are in USD and exclude applicable taxes unless stated otherwise.</p>
                    <p>• Payment is due according to the terms specified above.</p>
                    <p>• Any changes to this proforma invoice must be agreed upon in writing.</p>
                  </div>
                </div>
              </div>

              {/* Custom Sections */}
              {template.sections.map((section) => (
                <div key={section.id} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {renderSectionContent(section)}
                  </div>
                </div>
              ))}

              {/* Professional Footer */}
              <div className="border-t pt-6 text-center text-sm text-gray-500">
                <p>Thank you for considering our proforma invoice. We look forward to working with you.</p>
                <p className="mt-2">For questions, please contact {variables.responsible_person || 'our team'} at {variables.company_email || 'info@company.com'}</p>
              </div>
            </div>
          ) : (
            template.sections.map((section) => (
              <Card key={section.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {section.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {!previewMode && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateSection(section.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!section.required && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {!previewMode && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`section-title-${section.id}`}>Title:</Label>
                        <Input
                          id={`section-title-${section.id}`}
                          value={section.title}
                          onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={section.required}
                          onCheckedChange={(checked) => handleSectionChange(section.id, 'required', checked)}
                        />
                        <Label>Required</Label>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {renderSectionContent(section)}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ProposalTemplate