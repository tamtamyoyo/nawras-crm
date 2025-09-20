import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import type {
  HSCode,
  ExportPort,
  Certificate,
  Incoterm,
  TargetMarket,
  ProductCategory,
  CustomerExportFormData
} from '@/types/export-types';

interface ExportFieldsFormProps {
  customerId?: string;
  initialData?: CustomerExportFormData;
  onSave: (data: CustomerExportFormData) => void;
  onCancel: () => void;
}

export function ExportFieldsForm({ initialData, onSave, onCancel }: ExportFieldsFormProps) {
  const [formData, setFormData] = useState<CustomerExportFormData>({
    export_license_number: '',
    customs_broker: '',
    credit_limit_usd: 0,
    payment_terms_export: '',
    preferred_currency: 'USD',
    export_documentation_language: '',
    compliance_notes: '',
    special_handling_requirements: '',
    hs_code_ids: [],
    export_port_ids: [],
    certificate_ids: [],
    incoterm_ids: [],
    target_market_ids: [],
    product_category_ids: []
  });

  // Reference data
  const [hsCodes, setHSCodes] = useState<HSCode[]>([]);
  const [exportPorts, setExportPorts] = useState<ExportPort[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [incoterms, setIncoterms] = useState<Incoterm[]>([]);
  const [targetMarkets, setTargetMarkets] = useState<TargetMarket[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
    loadReferenceData();
  }, [initialData]);

  const loadReferenceData = async () => {
    setLoading(true);
    try {
      const [hsCodesRes, portsRes, certsRes, incotermsRes, marketsRes, categoriesRes] = await Promise.all([
        supabase.from('hs_codes').select('*').order('code'),
        supabase.from('export_ports').select('*').eq('is_active', true).order('port_name'),
        supabase.from('certificates').select('*').order('certificate_name'),
        supabase.from('incoterms').select('*').order('term_code'),
        supabase.from('target_markets').select('*').eq('is_active', true).order('market_name'),
        supabase.from('product_categories').select('*').order('category_name')
      ]);

      if (hsCodesRes.data) setHSCodes(hsCodesRes.data);
      if (portsRes.data) setExportPorts(portsRes.data);
      if (certsRes.data) setCertificates(certsRes.data);
      if (incotermsRes.data) setIncoterms(incotermsRes.data);
      if (marketsRes.data) setTargetMarkets(marketsRes.data);
      if (categoriesRes.data) setProductCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading reference data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerExportFormData, value: string | number | unknown[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: keyof CustomerExportFormData, item: { id: string; [key: string]: unknown }) => {
    const currentSelection = Array.isArray(formData[field]) ? formData[field] as { id: string; [key: string]: unknown }[] : [];
    const isSelected = currentSelection.some(selected => selected.id === item.id);
    
    if (isSelected) {
      handleInputChange(field, currentSelection.filter(selected => selected.id !== item.id));
    } else {
      handleInputChange(field, [...currentSelection, item]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving export fields:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderMultiSelectSection = <T extends { id: string }>(
    title: string,
    items: T[],
    selectedItems: T[],
    field: keyof CustomerExportFormData,
    displayField: string = 'name'
  ) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {items.map(item => {
            const isSelected = selectedItems.some(selected => selected.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMultiSelect(field, item)}
                className={`text-left p-2 rounded text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {String((item as Record<string, unknown>)[displayField] || (item as Record<string, unknown>).code || (item as Record<string, unknown>).name || '')}
              </button>
            );
          })}
        </div>
      </div>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map(item => (
            <Badge key={item.id} variant="secondary" className="text-xs">
              {String((item as Record<string, unknown>)[displayField] || (item as Record<string, unknown>).code || (item as Record<string, unknown>).name || '')}
              <button
                type="button"
                onClick={() => handleMultiSelect(field, item)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading export fields...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>China Export Business Fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Export Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exportLicenseNumber">Export License Number</Label>
            <Input
              id="exportLicenseNumber"
              value={formData.export_license_number}
              onChange={(e) => handleInputChange('export_license_number', e.target.value)}
              placeholder="Enter export license number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customsBroker">Customs Broker</Label>
            <Input
              id="customsBroker"
              value={formData.customs_broker}
              onChange={(e) => handleInputChange('customs_broker', e.target.value)}
              placeholder="Enter customs broker name"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="creditLimitUsd">Credit Limit (USD)</Label>
            <Input
              id="creditLimitUsd"
              type="number"
              value={formData.credit_limit_usd}
              onChange={(e) => handleInputChange('credit_limit_usd', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTermsExport">Payment Terms</Label>
            <select
              id="paymentTermsExport"
              value={formData.payment_terms_export}
              onChange={(e) => handleInputChange('payment_terms_export', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select payment terms</option>
              <option value="LC_at_sight">LC at Sight</option>
              <option value="LC_30_days">LC 30 Days</option>
              <option value="LC_60_days">LC 60 Days</option>
              <option value="TT_advance">TT in Advance</option>
              <option value="TT_30_days">TT 30 Days</option>
              <option value="TT_60_days">TT 60 Days</option>
              <option value="CAD">Cash Against Documents</option>
              <option value="OA">Open Account</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredCurrency">Preferred Currency</Label>
            <select
              id="preferredCurrency"
              value={formData.preferred_currency}
              onChange={(e) => handleInputChange('preferred_currency', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="CNY">CNY</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>

        {/* Multi-select sections */}
        {renderMultiSelectSection(
          'HS Codes',
          hsCodes,
          formData.hs_code_ids,
          'hs_code_ids',
          'code'
        )}

        {renderMultiSelectSection(
          'Export Ports',
          exportPorts,
          formData.export_port_ids,
          'export_port_ids',
          'port_name'
        )}

        {renderMultiSelectSection(
          'Required Certificates',
          certificates,
          formData.certificate_ids,
          'certificate_ids',
          'certificate_name'
        )}

        {renderMultiSelectSection(
          'Incoterms',
          incoterms,
          formData.incoterm_ids,
          'incoterm_ids',
          'term_code'
        )}

        {renderMultiSelectSection(
          'Target Markets',
          targetMarkets,
          formData.target_market_ids,
          'target_market_ids',
          'market_name'
        )}

        {renderMultiSelectSection(
          'Product Categories',
          productCategories,
          formData.product_category_ids,
          'product_category_ids',
          'category_name'
        )}

        {/* Additional fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankingDetails">Banking Details</Label>
            <Textarea
              id="bankingDetails"
              value={formData.export_documentation_language}
              onChange={(e) => handleInputChange('export_documentation_language', e.target.value)}
              placeholder="Enter banking and financing details"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complianceNotes">Compliance Notes</Label>
            <Textarea
              id="complianceNotes"
              value={formData.compliance_notes}
              onChange={(e) => handleInputChange('compliance_notes', e.target.value)}
              placeholder="Enter compliance and regulatory notes"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="riskAssessment">Risk Assessment</Label>
            <select
              id="riskAssessment"
              value={formData.special_handling_requirements}
              onChange={(e) => handleInputChange('special_handling_requirements', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Export Fields'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExportFieldsForm;