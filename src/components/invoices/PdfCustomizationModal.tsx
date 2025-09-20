import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FileText, X, Palette, Upload, Settings, Eye } from 'lucide-react';
import { InvoiceWithCustomer } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';

interface PdfCustomizationOptions {
  template: 'modern' | 'classic' | 'minimal' | 'professional';
  colorScheme: 'blue' | 'green' | 'red' | 'purple' | 'gray';
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  logoPosition: 'top-left' | 'top-center' | 'top-right';
  watermark: {
    enabled: boolean;
    text: string;
  };
  customHeader: string;
  customFooter: string;
  logo?: File;
}

interface PdfCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceWithCustomer;
  onDownload: (options: PdfCustomizationOptions) => void;
}

export function PdfCustomizationModal({
  isOpen,
  onClose,
  invoice,
  onDownload
}: PdfCustomizationModalProps) {
  const { toast } = useToast();
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [options, setOptions] = useState<PdfCustomizationOptions>({
    template: 'modern',
    colorScheme: 'blue',
    pageSize: 'a4',
    orientation: 'portrait',
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    },
    logoPosition: 'top-left',
    watermark: {
      enabled: false,
      text: ''
    },
    customHeader: '',
    customFooter: ''
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: 'File too large',
          description: 'Logo file must be smaller than 2MB',
          variant: 'destructive'
        });
        return;
      }
      setOptions(prev => ({ ...prev, logo: file }));
    }
  };

  const handlePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Simulate preview generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Preview generated',
        description: 'PDF preview is ready for review'
      });
    } catch {
      toast({
        title: 'Preview failed',
        description: 'Unable to generate preview. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleDownload = () => {
    // Validate required fields
    if (options.watermark.enabled && !options.watermark.text.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Watermark text is required when watermark is enabled',
        variant: 'destructive'
      });
      return;
    }

    onDownload(options);
    onClose();
  };

  const handleReset = () => {
    setOptions({
      template: 'modern',
      colorScheme: 'blue',
      pageSize: 'a4',
      orientation: 'portrait',
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      },
      logoPosition: 'top-left',
      watermark: {
        enabled: false,
        text: ''
      },
      customHeader: '',
      customFooter: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Customize PDF Export</h2>
              <p className="text-gray-600">
                Invoice #{invoice.invoice_number} - {invoice.customer?.name}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <CardTitle>Template Selection</CardTitle>
                </div>
                <CardDescription>
                  Choose a template that matches your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'modern', label: 'Modern', description: 'Clean and contemporary' },
                    { value: 'classic', label: 'Classic', description: 'Traditional business style' },
                    { value: 'minimal', label: 'Minimal', description: 'Simple and elegant' },
                    { value: 'professional', label: 'Professional', description: 'Corporate standard' }
                  ].map((template) => (
                    <label
                      key={template.value}
                      className={`cursor-pointer border rounded-lg p-3 transition-colors ${
                        options.template === template.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.value}
                        checked={options.template === template.value}
                        onChange={(e) => setOptions(prev => ({ ...prev, template: e.target.value as PdfCustomizationOptions['template'] }))}
                        className="sr-only"
                      />
                      <div className="text-sm font-medium">{template.label}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </label>
                  ))}
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Color Scheme:</Label>
                  <div className="flex space-x-2 mt-2">
                    {[
                      { value: 'blue', color: 'bg-blue-500' },
                      { value: 'green', color: 'bg-green-500' },
                      { value: 'red', color: 'bg-red-500' },
                      { value: 'purple', color: 'bg-purple-500' },
                      { value: 'gray', color: 'bg-gray-500' }
                    ].map((color) => (
                      <label key={color.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="colorScheme"
                          value={color.value}
                          checked={options.colorScheme === color.value}
                          onChange={(e) => setOptions(prev => ({ ...prev, colorScheme: e.target.value as PdfCustomizationOptions['colorScheme'] }))}
                          className="sr-only"
                        />
                        <div className={`w-8 h-8 rounded-full ${color.color} ${
                          options.colorScheme === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                        }`} />
                        <span className="sr-only">{color.value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branding Options */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <CardTitle>Branding Options</CardTitle>
                </div>
                <CardDescription>
                  Add your company branding elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo-upload">Company Logo:</Label>
                  <div className="mt-2">
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    {options.logo && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {options.logo.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Logo Position:</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { value: 'top-left', label: 'Top Left' },
                      { value: 'top-center', label: 'Top Center' },
                      { value: 'top-right', label: 'Top Right' }
                    ].map((position) => (
                      <label
                        key={position.value}
                        className={`cursor-pointer text-center border rounded p-2 text-sm ${
                          options.logoPosition === position.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="logoPosition"
                          value={position.value}
                          checked={options.logoPosition === position.value}
                          onChange={(e) => setOptions(prev => ({ ...prev, logoPosition: e.target.value as PdfCustomizationOptions['logoPosition'] }))}
                          className="sr-only"
                        />
                        {position.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-header">Custom Header:</Label>
                  <Textarea
                    id="custom-header"
                    placeholder="Enter custom header text..."
                    value={options.customHeader}
                    onChange={(e) => setOptions(prev => ({ ...prev, customHeader: e.target.value }))}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="custom-footer">Custom Footer:</Label>
                  <Textarea
                    id="custom-footer"
                    placeholder="Enter custom footer text..."
                    value={options.customFooter}
                    onChange={(e) => setOptions(prev => ({ ...prev, customFooter: e.target.value }))}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Page Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Page Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure page layout and dimensions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Page Size:</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { value: 'a4', label: 'A4' },
                        { value: 'letter', label: 'Letter' },
                        { value: 'legal', label: 'Legal' }
                      ].map((size) => (
                        <label key={size.value} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="pageSize"
                            value={size.value}
                            checked={options.pageSize === size.value}
                            onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value as PdfCustomizationOptions['pageSize'] }))}
                          />
                          <span className="text-sm">{size.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Orientation:</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { value: 'portrait', label: 'Portrait' },
                        { value: 'landscape', label: 'Landscape' }
                      ].map((orientation) => (
                        <label key={orientation.value} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="orientation"
                            value={orientation.value}
                            checked={options.orientation === orientation.value}
                            onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as PdfCustomizationOptions['orientation'] }))}
                          />
                          <span className="text-sm">{orientation.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Margins:</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { key: 'top', label: 'Top Margin (mm):' },
                      { key: 'bottom', label: 'Bottom Margin (mm):' },
                      { key: 'left', label: 'Left Margin (mm):' },
                      { key: 'right', label: 'Right Margin (mm):' }
                    ].map((margin) => (
                      <div key={margin.key}>
                        <Label htmlFor={`margin-${margin.key}`} className="text-xs">
                          {margin.label}
                        </Label>
                        <Input
                          id={`margin-${margin.key}`}
                          type="number"
                          min="0"
                          max="50"
                          value={options.margins[margin.key as keyof typeof options.margins]}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            margins: {
                              ...prev.margins,
                              [margin.key]: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Watermark Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Watermark</CardTitle>
                <CardDescription>
                  Add a watermark for document security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="watermark-enabled"
                    checked={options.watermark.enabled}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      watermark: { ...prev.watermark, enabled: checked }
                    }))}
                  />
                  <Label htmlFor="watermark-enabled">Enable Watermark</Label>
                </div>

                {options.watermark.enabled && (
                  <div>
                    <Label htmlFor="watermark-text">Watermark Text:</Label>
                    <Input
                      id="watermark-text"
                      placeholder="e.g., CONFIDENTIAL, DRAFT, ORIGINAL"
                      value={options.watermark.text}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        watermark: { ...prev.watermark, text: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={isGeneratingPreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isGeneratingPreview ? 'Generating Preview...' : 'Preview'}
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleDownload}>
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}