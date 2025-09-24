import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Package, X, FileText, Download } from 'lucide-react';
import { generateBatchInvoices, ExportFormat } from '@/utils/pdf-generator';
import { InvoiceWithCustomer } from '@/types/invoice';
import { Database } from '@/lib/database.types';

interface BatchDownloadModalProps {
  invoices: InvoiceWithCustomer[];
  onClose: () => void;
  onDownloadComplete: () => void;
}

export function BatchDownloadModal({
  invoices,
  onClose,
  onDownloadComplete
}: BatchDownloadModalProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat['format']>('pdf');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(invoices.map(inv => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleBatchDownload = async () => {
    if (selectedInvoices.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Preparing download...');

    try {
      const selectedInvoiceData = invoices
        .filter(inv => selectedInvoices.includes(inv.id))
        .map(inv => ({
          invoice: {
            ...inv,
            responsible_person: inv.responsible_person || 'Mr. Ali',
            billing_address: inv.billing_address || null,
            purchase_order_number: inv.purchase_order_number || null,
            payment_method: inv.payment_method || 'bank_transfer'
          } as Database['public']['Tables']['invoices']['Row'],
          customer: {
            id: inv.customer?.id || inv.customer_id,
            name: inv.customer?.name || 'Unknown Customer',
            email: inv.customer?.email || null,
            phone: (inv.customer as Database['public']['Tables']['customers']['Row'])?.phone || null,
            company: (inv.customer as Database['public']['Tables']['customers']['Row'])?.company || null,
            address: (inv.customer as Database['public']['Tables']['customers']['Row'])?.address || null,
            status: (inv.customer as Database['public']['Tables']['customers']['Row'])?.status || 'active',
            source: (inv.customer as Database['public']['Tables']['customers']['Row'])?.source || null,
            tags: (inv.customer as Database['public']['Tables']['customers']['Row'])?.tags || null,
            notes: (inv.customer as Database['public']['Tables']['customers']['Row'])?.notes || null,
            created_by: (inv.customer as Database['public']['Tables']['customers']['Row'])?.created_by || null,
            created_at: (inv.customer as Database['public']['Tables']['customers']['Row'])?.created_at || inv.created_at,
            updated_at: (inv.customer as Database['public']['Tables']['customers']['Row'])?.updated_at || inv.updated_at,
            responsible_person: (inv.customer as Database['public']['Tables']['customers']['Row'])?.responsible_person || 'Mr. Ali',
            export_license_number: (inv.customer as Database['public']['Tables']['customers']['Row'])?.export_license_number || null,
            export_license_expiry: (inv.customer as Database['public']['Tables']['customers']['Row'])?.export_license_expiry || null,
            customs_broker: (inv.customer as Database['public']['Tables']['customers']['Row'])?.customs_broker || null,
            preferred_currency: (inv.customer as Database['public']['Tables']['customers']['Row'])?.preferred_currency || null,
            payment_terms_export: (inv.customer as Database['public']['Tables']['customers']['Row'])?.payment_terms_export || null,
            credit_limit_usd: (inv.customer as Database['public']['Tables']['customers']['Row'])?.credit_limit_usd || null,
            export_documentation_language: (inv.customer as Database['public']['Tables']['customers']['Row'])?.export_documentation_language || null,
            special_handling_requirements: (inv.customer as Database['public']['Tables']['customers']['Row'])?.special_handling_requirements || null,
            compliance_notes: (inv.customer as Database['public']['Tables']['customers']['Row'])?.compliance_notes || null,
            version: (inv.customer as Database['public']['Tables']['customers']['Row'])?.version || null
          } as Database['public']['Tables']['customers']['Row'],
          deal: {
            id: inv.deal_id || 'unknown',
            title: `Deal for Invoice ${inv.invoice_number}`,
            customer_id: inv.customer_id,
            lead_id: null,
            value: inv.amount || 0,
            stage: 'closed_won',
            probability: 100,
            expected_close_date: inv.due_date,
            description: null,
            source: null,
            assigned_to: null,
            created_by: null,
            created_at: inv.created_at,
            updated_at: inv.updated_at,
            responsible_person: 'Mr. Ali',
            competitor_info: null,
            decision_maker_contact: null,
            deal_source: null,
            deal_type: null,
            deal_source_detail: null,
            decision_maker_name: null,
            decision_maker_email: null,
            decision_maker_phone: null,
            version: 1
          } as Database['public']['Tables']['deals']['Row']
        }));

      await generateBatchInvoices(selectedInvoiceData, {
        format: exportFormat
      });

      setDownloadStatus('Download complete!');
      setTimeout(() => {
        onDownloadComplete();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Batch download failed:', error);
      setDownloadStatus('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const estimatedSize = selectedInvoices.length * 50 * 1024; // Rough estimate: 50KB per invoice

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Batch Download Invoices</h2>
              <p className="text-gray-600">Select invoices to download in bulk</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Select Invoices</CardTitle>
                      <CardDescription>
                        Choose which invoices to include in the batch download
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedInvoices.length === invoices.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="text-sm font-medium">
                        Select All ({invoices.length})
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox
                          id={`invoice-${invoice.id}`}
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={(checked) => 
                            handleSelectInvoice(invoice.id, checked as boolean)
                          }
                        />
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Invoice #{invoice.invoice_number}
                            </p>
                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{invoice.customer?.name}</span>
                            <span>${invoice.total_amount?.toFixed(2)}</span>
                            <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Download Options */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Download Options</CardTitle>
                  <CardDescription>
                    Configure your batch download settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select
                      value={exportFormat}
                      onValueChange={(value) => setExportFormat(value as ExportFormat['format'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Documents</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Selected:</span>
                      <span className="font-medium">{selectedInvoices.length} invoices</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimated size:</span>
                      <span className="font-medium">{formatFileSize(estimatedSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Format:</span>
                      <span className="font-medium uppercase">{exportFormat}</span>
                    </div>
                  </div>

                  {exportFormat === 'pdf' && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>PDF:</strong> Individual PDF files will be compressed into a ZIP archive for easy download.
                      </p>
                    </div>
                  )}

                  {exportFormat === 'excel' && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">
                        <strong>Excel:</strong> All invoice data will be compiled into a single Excel workbook with multiple sheets.
                      </p>
                    </div>
                  )}

                  {exportFormat === 'csv' && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-700">
                        <strong>CSV:</strong> Invoice data will be exported as comma-separated values for easy import into other systems.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Download Progress */}
              {isDownloading && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Download Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={downloadProgress} className="w-full" />
                    <p className="text-xs text-gray-600">{downloadStatus}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(downloadProgress)}% complete</span>
                      <span>{selectedInvoices.length} files</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedInvoices.length > 0 ? (
              <span>
                {selectedInvoices.length} of {invoices.length} invoices selected
              </span>
            ) : (
              <span>No invoices selected</span>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isDownloading}>
              Cancel
            </Button>
            <Button 
              onClick={handleBatchDownload} 
              disabled={selectedInvoices.length === 0 || isDownloading}
              className="min-w-[120px]"
            >
              {isDownloading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Downloading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Download ({selectedInvoices.length})</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}