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

  // Selected items for multi-select (objects with full data)
  const [selectedHSCodes, setSelectedHSCodes] = useState<HSCode[]>([]);
  const [selectedExportPorts, setSelectedExportPorts] = useState<ExportPort[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<Certificate[]>([]);
  const [selectedIncoterms, setSelectedIncoterms] = useState<Incoterm[]>([]);
  const [selectedTargetMarkets, setSelectedTargetMarkets] = useState<TargetMarket[]>([]);
  const [selectedProductCategories, setSelectedProductCategories] = useState<ProductCategory[]>([]);

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

  const handleMultiSelect = (field: keyof CustomerExportFormData, item: { id: string; [key: string]: any }) => {
    let currentSelection: any[] = [];
    let setterFunction: (items: any[]) => void;
    
    // Get current selection and setter based on field
    switch (field) {
      case 'hs_code_ids':
        currentSelection = selectedHSCodes;
        setterFunction = setSelectedHSCodes;
        break;
      case 'export_port_ids':
        currentSelection = selectedExportPorts;
        setterFunction = setSelectedExportPorts;
        break;
      case 'certificate_ids':
        currentSelection = selectedCertificates;
        setterFunction = setSelectedCertificates;
        break;
      case 'incoterm_ids':
        currentSelection = selectedIncoterms;
        setterFunction = setSelectedIncoterms;
        break;
      case 'target_market_ids':
        currentSelection = selectedTargetMarkets;
        setterFunction = setSelectedTargetMarkets;
        break;
      case 'product_category_ids':
        currentSelection = selectedProductCategories;
        setterFunction = setSelectedProductCategories;
        break;
      default:
        return;
    }
    
    const isSelected = currentSelection.some(selected => selected.id === item.id);
    
    if (isSelected) {
      const newSelection = currentSelection.filter(selected => selected.id !== item.id);
      setterFunction(newSelection);
      handleInputChange(field, newSelection.map(s => s.id));
    } else {
      const newSelection = [...currentSelection, item];
      setterFunction(newSelection);
      handleInputChange(field, newSelection.map(s => s.id));
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

  const renderMultiSelectSection = (
    title: string,
    field: keyof CustomerExportFormData,
    options: { id: string; label: string; value: string }[],
    selectedItems: { id: string; [key: string]: any }[]
  ) => {
    let currentSelection: any[] = [];
    
    // Get current selection based on field
    switch (field) {
      case 'hs_code_ids':
        currentSelection = selectedHSCodes;
        break;
      case 'export_port_ids':
        currentSelection = selectedExportPorts;
        break;
      case 'certificate_ids':
        currentSelection = selectedCertificates;
        break;
      case 'incoterm_ids':
        currentSelection = selectedIncoterms;
        break;
      case 'target_market_ids':
        currentSelection = selectedTargetMarkets;
        break;
      case 'product_category_ids':
        currentSelection = selectedProductCategories;
        break;
      default:
        currentSelection = [];
    }
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{title}</label>
        <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
          {options.map((option) => {
            const isSelected = currentSelection.some(item => item.id === option.value);
            return (
              <div key={option.value} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id={`${field}-${option.value}`}
                  checked={isSelected}
                  onChange={() => handleMultiSelect(field, { id: option.value, ...option })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`${field}-${option.value}`} className="text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
          'hs_code_ids',
          hsCodes.map(item => ({ id: item.id, label: item.code, value: item.id })),
          selectedHSCodes as { id: string; [key: string]: any }[]
        )}

        {renderMultiSelectSection(
              'Export Ports',
              'export_port_ids',
              exportPorts.map(item => ({ id: item.id, label: item.port_name, value: item.id })),
              selectedExportPorts as { id: string; [key: string]: any }[]
            )}

        {renderMultiSelectSection(
              'Required Certificates',
              'certificate_ids',
              certificates.map(item => ({ id: item.id, label: item.certificate_name, value: item.id })),
              selectedCertificates as { id: string; [key: string]: any }[]
            )}

            {renderMultiSelectSection(
              'Incoterms',
              'incoterm_ids',
              incoterms.map(item => ({ id: item.id, label: item.term_code, value: item.id })),
              selectedIncoterms as { id: string; [key: string]: any }[]
            )}

            {renderMultiSelectSection(
              'Target Markets',
              'target_market_ids',
              targetMarkets.map(item => ({ id: item.id, label: item.market_name, value: item.id })),
              selectedTargetMarkets as { id: string; [key: string]: any }[]
            )}

            {renderMultiSelectSection(
              'Product Categories',
              'product_category_ids',
              productCategories.map(item => ({ id: item.id, label: item.category_name, value: item.id })),
              selectedProductCategories as { id: string; [key: string]: any }[]
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