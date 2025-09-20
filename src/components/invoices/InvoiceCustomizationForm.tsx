import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { PDFCustomizationOptions } from '../../types/invoice';

interface InvoiceCustomizationFormProps {
  options: PDFCustomizationOptions;
  onOptionsChange: (options: PDFCustomizationOptions) => void;
  onPreview: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export function InvoiceCustomizationForm({
  options,
  onOptionsChange,
  onPreview,
  onDownload,
  onClose
}: InvoiceCustomizationFormProps) {
  const [localOptions, setLocalOptions] = useState<PDFCustomizationOptions>(options);

  const updateOptions = (updates: Partial<PDFCustomizationOptions>) => {
    const newOptions = { ...localOptions, ...updates };
    setLocalOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const updateCompanyInfo = (field: string, value: string) => {
    updateOptions({
      companyInfo: {
        ...localOptions.companyInfo,
        [field]: value
      }
    });
  };

  const updateMargins = (field: string, value: number) => {
    updateOptions({
      margins: {
        ...localOptions.margins,
        [field]: value
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Customize Invoice</h2>
            <p className="text-gray-600">Personalize your invoice template and settings</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Selection</CardTitle>
                  <CardDescription>Choose a template style for your invoice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template">Template Style</Label>
                    <Select
                      value={localOptions.template}
                      onValueChange={(value) => updateOptions({ template: value as PDFCustomizationOptions['template'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="elegant">Elegant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={localOptions.primaryColor || '#2563eb'}
                        onChange={(e) => updateOptions({ primaryColor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={localOptions.secondaryColor || '#64748b'}
                        onChange={(e) => updateOptions({ secondaryColor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <Input
                        id="accentColor"
                        type="color"
                        value={localOptions.accentColor || '#10b981'}
                        onChange={(e) => updateOptions({ accentColor: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Add your company details to the invoice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={localOptions.companyInfo?.name || ''}
                        onChange={(e) => updateCompanyInfo('name', e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={localOptions.companyInfo?.taxId || ''}
                        onChange={(e) => updateCompanyInfo('taxId', e.target.value)}
                        placeholder="Tax ID Number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={localOptions.companyInfo?.address || ''}
                      onChange={(e) => updateCompanyInfo('address', e.target.value)}
                      placeholder="Company Address"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={localOptions.companyInfo?.phone || ''}
                        onChange={(e) => updateCompanyInfo('phone', e.target.value)}
                        placeholder="Phone Number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={localOptions.companyInfo?.email || ''}
                        onChange={(e) => updateCompanyInfo('email', e.target.value)}
                        placeholder="Email Address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={localOptions.companyInfo?.website || ''}
                        onChange={(e) => updateCompanyInfo('website', e.target.value)}
                        placeholder="Website URL"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showLogo"
                        checked={localOptions.showLogo || false}
                        onCheckedChange={(checked) => updateOptions({ showLogo: checked })}
                      />
                      <Label htmlFor="showLogo">Show Company Logo</Label>
                    </div>

                    {localOptions.showLogo && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="logoUrl">Logo URL</Label>
                          <Input
                            id="logoUrl"
                            value={localOptions.logoUrl || ''}
                            onChange={(e) => updateOptions({ logoUrl: e.target.value })}
                            placeholder="Logo URL"
                          />
                        </div>
                        <div>
                          <Label htmlFor="logoPosition">Logo Position</Label>
                          <Select
                            value={localOptions.logoPosition}
                            onValueChange={(value) => updateOptions({ logoPosition: value as PDFCustomizationOptions['logoPosition'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="logoSize">Logo Size</Label>
                          <Select
                            value={localOptions.logoSize}
                            onValueChange={(value) => updateOptions({ logoSize: value as PDFCustomizationOptions['logoSize'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Layout</CardTitle>
                  <CardDescription>Configure page settings and margins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="pageOrientation">Orientation</Label>
                      <Select
                        value={localOptions.pageOrientation}
                        onValueChange={(value) => updateOptions({ pageOrientation: value as PDFCustomizationOptions['pageOrientation'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pageSize">Page Size</Label>
                      <Select
                        value={localOptions.pageSize}
                        onValueChange={(value) => updateOptions({ pageSize: value as PDFCustomizationOptions['pageSize'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a4">A4</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        min="8"
                        max="16"
                        value={localOptions.fontSize || 10}
                        onChange={(e) => updateOptions({ fontSize: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Margins (mm)</Label>
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      <div>
                        <Label htmlFor="marginTop" className="text-sm">Top</Label>
                        <Input
                          id="marginTop"
                          type="number"
                          min="0"
                          max="50"
                          value={localOptions.margins?.top || 20}
                          onChange={(e) => updateMargins('top', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginRight" className="text-sm">Right</Label>
                        <Input
                          id="marginRight"
                          type="number"
                          min="0"
                          max="50"
                          value={localOptions.margins?.right || 20}
                          onChange={(e) => updateMargins('right', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginBottom" className="text-sm">Bottom</Label>
                        <Input
                          id="marginBottom"
                          type="number"
                          min="0"
                          max="50"
                          value={localOptions.margins?.bottom || 20}
                          onChange={(e) => updateMargins('bottom', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginLeft" className="text-sm">Left</Label>
                        <Input
                          id="marginLeft"
                          type="number"
                          min="0"
                          max="50"
                          value={localOptions.margins?.left || 20}
                          onChange={(e) => updateMargins('left', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Settings</CardTitle>
                  <CardDescription>Customize invoice content and formatting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={localOptions.dateFormat}
                        onValueChange={(value) => updateOptions({ dateFormat: value as PDFCustomizationOptions['dateFormat'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currencySymbol">Currency Symbol</Label>
                      <Input
                        id="currencySymbol"
                        value={localOptions.currencySymbol || '$'}
                        onChange={(e) => updateOptions({ currencySymbol: e.target.value })}
                        placeholder="$"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showTaxBreakdown"
                        checked={localOptions.showTaxBreakdown || false}
                        onCheckedChange={(checked) => updateOptions({ showTaxBreakdown: checked })}
                      />
                      <Label htmlFor="showTaxBreakdown">Show Tax Breakdown</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showPageNumbers"
                        checked={localOptions.showPageNumbers || false}
                        onCheckedChange={(checked) => updateOptions({ showPageNumbers: checked })}
                      />
                      <Label htmlFor="showPageNumbers">Show Page Numbers</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customHeader">Custom Header</Label>
                      <Textarea
                        id="customHeader"
                        value={localOptions.customHeader || ''}
                        onChange={(e) => updateOptions({ customHeader: e.target.value })}
                        placeholder="Custom header text"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customFooter">Custom Footer</Label>
                      <Textarea
                        id="customFooter"
                        value={localOptions.customFooter || ''}
                        onChange={(e) => updateOptions({ customFooter: e.target.value })}
                        placeholder="Custom footer text"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="watermark">Watermark Text</Label>
                    <Input
                      id="watermark"
                      value={localOptions.watermark || ''}
                      onChange={(e) => updateOptions({ watermark: e.target.value })}
                      placeholder="Watermark text (optional)"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>Choose export format and additional options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>Available export formats:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>PDF:</strong> High-quality document with full formatting</li>
                      <li><strong>Excel:</strong> Structured data in spreadsheet format</li>
                      <li><strong>CSV:</strong> Simple comma-separated values</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onPreview}>
              Preview
            </Button>
            <Button onClick={onDownload}>
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}