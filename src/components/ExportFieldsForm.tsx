import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Globe, Award, Truck, Building, MapPin, FileText } from 'lucide-react'
import { CustomerExportFormData, ExportDataResponse } from '../types/export-types'
import ExportFieldsService from '../services/exportFieldsService'

interface ExportFieldsFormProps {
  customerId?: string
  leadId?: string
  onSave: () => void
  onCancel: () => void
}

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' }
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' }
]

const PAYMENT_TERMS = [
  { value: 'NET30', label: 'Net 30 Days' },
  { value: 'NET60', label: 'Net 60 Days' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'LC', label: 'Letter of Credit' },
  { value: 'TT', label: 'Telegraphic Transfer' },
  { value: 'DP', label: 'Documents against Payment' },
  { value: 'DA', label: 'Documents against Acceptance' }
]

export function ExportFieldsForm({ customerId, leadId, onSave, onCancel }: ExportFieldsFormProps) {
  const entityId = customerId || leadId
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exportData, setExportData] = useState<ExportDataResponse | null>(null)
  const [formData, setFormData] = useState<CustomerExportFormData>({
    export_license_number: '',
    export_license_expiry: '',
    customs_broker: '',
    preferred_currency: 'USD',
    payment_terms_export: 'NET30',
    credit_limit_usd: 0,
    export_documentation_language: 'en',
    special_handling_requirements: '',
    compliance_notes: '',
    hs_code_ids: [],
    export_port_ids: [],
    certificate_ids: [],
    target_market_ids: [],
    product_category_ids: [],
    incoterm_ids: []
  })

  useEffect(() => {
    loadData()
  }, [entityId, loadData])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [exportDataResponse, customerData] = await Promise.all([
        ExportFieldsService.getExportData(),
        ExportFieldsService.getCustomerExportFields(entityId!)
      ])
      
      setExportData(exportDataResponse)
      if (customerData) {
        setFormData({
          export_license_number: customerData.export_license_number || '',
          export_license_expiry: customerData.export_license_expiry || '',
          customs_broker: customerData.customs_broker || '',
          preferred_currency: customerData.preferred_currency || 'USD',
          payment_terms_export: customerData.payment_terms_export || 'NET30',
          credit_limit_usd: customerData.credit_limit_usd || 0,
          export_documentation_language: customerData.export_documentation_language || 'en',
          special_handling_requirements: customerData.special_handling_requirements || '',
          compliance_notes: customerData.compliance_notes || '',
          hs_code_ids: customerData.hs_code_ids || [],
          export_port_ids: customerData.export_port_ids || [],
          certificate_ids: customerData.certificate_ids || [],
          target_market_ids: customerData.target_market_ids || [],
          product_category_ids: customerData.product_category_ids || [],
          incoterm_ids: customerData.incoterm_ids || []
        })
      }
    } catch (error) {
      console.error('Error loading export data:', error)
      toast.error('Failed to load export data')
    } finally {
      setLoading(false)
    }
  }, [entityId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const validationErrors = ExportFieldsService.validateExportFields(formData)
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0])
        return
      }

      await ExportFieldsService.saveCustomerExportFields(entityId!, formData)
      toast.success('Export fields saved successfully')
      onSave()
    } catch (error) {
      console.error('Error saving export fields:', error)
      toast.error('Failed to save export fields')
    } finally {
      setSaving(false)
    }
  }

  const handleMultiSelectChange = (field: keyof CustomerExportFormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = (prev[field] as string[]) || []
      const newValues = checked 
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value)
      
      return {
        ...prev,
        [field]: newValues
      }
    })
  }

  interface SelectOption {
    id: string
    [key: string]: unknown
  }

  const renderMultiSelectSection = (
    title: string,
    icon: React.ReactNode,
    field: keyof CustomerExportFormData,
    options: SelectOption[],
    getLabel: (option: SelectOption) => string,
    getDescription?: (option: SelectOption) => string
  ) => {
    const selectedValues = (formData[field] as string[]) || []
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.id)
              return (
                <div key={option.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`${field}-${option.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange(field, option.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`${field}-${option.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {getLabel(option)}
                    </Label>
                    {getDescription && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getDescription(option)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t">
              {selectedValues.map(value => {
                const option = options.find(opt => opt.id === value)
                return option ? (
                  <Badge key={value} variant="secondary" className="text-xs">
                    {getLabel(option)}
                  </Badge>
                ) : null
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading export fields...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export License Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export_license_number">Export License Number</Label>
                  <Input
                    id="export_license_number"
                    value={formData.export_license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, export_license_number: e.target.value }))}
                    placeholder="Enter license number"
                  />
                </div>
                <div>
                  <Label htmlFor="export_license_expiry">License Expiry Date</Label>
                  <Input
                    id="export_license_expiry"
                    type="date"
                    value={formData.export_license_expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, export_license_expiry: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="customs_broker">Customs Broker</Label>
                <Input
                  id="customs_broker"
                  value={formData.customs_broker}
                  onChange={(e) => setFormData(prev => ({ ...prev, customs_broker: e.target.value }))}
                  placeholder="Enter customs broker name"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Financial & Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred_currency">Preferred Currency</Label>
                  <Select
                    value={formData.preferred_currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_terms_export">Payment Terms</Label>
                  <Select
                    value={formData.payment_terms_export}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms_export: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map(term => (
                        <SelectItem key={term.value} value={term.value}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credit_limit_usd">Credit Limit (USD)</Label>
                  <Input
                    id="credit_limit_usd"
                    type="number"
                    min="0"
                    value={formData.credit_limit_usd}
                    onChange={(e) => setFormData(prev => ({ ...prev, credit_limit_usd: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="export_documentation_language">Documentation Language</Label>
                  <Select
                    value={formData.export_documentation_language}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, export_documentation_language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classification" className="space-y-4">
          {exportData && (
            <div className="grid grid-cols-1 gap-4">
              {renderMultiSelectSection(
                'HS Codes',
                <Globe className="h-4 w-4" />,
                'hs_code_ids',
                exportData.hs_codes,
                (code) => `${code.hs_code} - ${code.description}`,
                (code) => `Category: ${code.category}`
              )}
              
              {renderMultiSelectSection(
                'Product Categories',
                <Award className="h-4 w-4" />,
                'product_category_ids',
                exportData.product_categories,
                (cat) => cat.category_name,
                (cat) => cat.description
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logistics" className="space-y-4">
          {exportData && (
            <div className="grid grid-cols-1 gap-4">
              {renderMultiSelectSection(
                'Export Ports',
                <MapPin className="h-4 w-4" />,
                'export_port_ids',
                exportData.export_ports,
                (port) => `${port.port_name} (${port.port_code})`,
                (port) => `${port.city}, ${port.country}`
              )}
              
              {renderMultiSelectSection(
                'Target Markets',
                <Globe className="h-4 w-4" />,
                'target_market_ids',
                exportData.target_markets,
                (market) => market.market_name,
                (market) => `Region: ${market.region}`
              )}
              
              {renderMultiSelectSection(
                'Incoterms',
                <Truck className="h-4 w-4" />,
                'incoterm_ids',
                exportData.incoterms,
                (term) => `${term.term_code} - ${term.term_name}`,
                (term) => term.description
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {exportData && (
            <div className="space-y-4">
              {renderMultiSelectSection(
                'Required Certificates',
                <Award className="h-4 w-4" />,
                'certificate_ids',
                exportData.certificates,
                (cert) => cert.certificate_name,
                (cert) => `Issuing Body: ${cert.issuing_body}`
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Special Requirements & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="special_handling_requirements">Special Handling Requirements</Label>
                    <Textarea
                      id="special_handling_requirements"
                      value={formData.special_handling_requirements}
                      onChange={(e) => setFormData(prev => ({ ...prev, special_handling_requirements: e.target.value }))}
                      placeholder="Enter any special handling requirements..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="compliance_notes">Compliance Notes</Label>
                    <Textarea
                      id="compliance_notes"
                      value={formData.compliance_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, compliance_notes: e.target.value }))}
                      placeholder="Enter compliance notes and requirements..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Export Fields
        </Button>
      </div>
    </div>
  )
}

export default ExportFieldsForm