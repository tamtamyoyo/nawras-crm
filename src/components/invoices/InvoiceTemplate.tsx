import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Building, CreditCard } from 'lucide-react'
import { InvoiceItem } from '@/types/invoice'

interface InvoiceTemplateProps {
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  status?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  dealTitle?: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes?: string
  paymentTerms?: string
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'paid':
      return { label: 'Paid', variant: 'default' as const, color: 'text-green-600' }
    case 'sent':
      return { label: 'Sent', variant: 'secondary' as const, color: 'text-blue-600' }
    case 'overdue':
      return { label: 'Overdue', variant: 'destructive' as const, color: 'text-red-600' }
    default:
      return { label: 'Draft', variant: 'outline' as const, color: 'text-gray-600' }
  }
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  status = 'draft',
  customerName,
  customerEmail,
  customerPhone,
  dealTitle,
  items,
  subtotal,
  taxRate,
  taxAmount,
  totalAmount,
  notes,
  paymentTerms
}) => {
  const statusConfig = getStatusConfig(status)

  return (
    <div className="bg-white shadow-xl rounded-xl overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">INVOICE</h1>
            <p className="text-xl text-blue-100 font-medium">#{invoiceNumber}</p>
          </div>
          
          {/* Company Logo Area */}
          <div className="bg-white bg-opacity-20 rounded-lg p-4 min-w-[120px] min-h-[80px] flex items-center justify-center">
            <div className="text-center">
              <Building className="h-8 w-8 text-white mx-auto mb-1" />
              <p className="text-xs text-blue-100">Company Logo</p>
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="mt-6">
          <Badge 
            variant={statusConfig.variant} 
            className={`px-6 py-3 text-base font-bold border-2 rounded-full ${
              status === 'overdue' 
                ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-lg' 
                : status === 'paid' 
                ? 'bg-green-500 text-white border-green-400 shadow-lg' 
                : status === 'pending' 
                ? 'bg-yellow-500 text-white border-yellow-400 shadow-lg' 
                : 'bg-white text-blue-700 border-blue-200 shadow-lg'
            }`}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>
      
      <div className="p-8">
        {/* Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">Bill To</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-lg font-semibold text-gray-900">{customerName}</p>
              {customerEmail && <p className="text-gray-700">{customerEmail}</p>}
              {customerPhone && <p className="text-gray-700">{customerPhone}</p>}
              {dealTitle && <p className="text-sm text-blue-600 font-medium">Deal: {dealTitle}</p>}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">Invoice Details</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Invoice Date:</span>
                <p className="text-lg font-semibold text-gray-900">{invoiceDate}</p>
              </div>
              {dueDate && (
                <div className={`p-4 rounded-lg border-2 shadow-sm ${
                  status === 'overdue' 
                    ? 'bg-red-50 border-red-300 text-red-800' 
                    : 'bg-blue-50 border-blue-300 text-blue-800'
                }`}>
                  <span className="text-sm font-bold uppercase tracking-wide">Due Date:</span>
                  <p className="text-xl font-bold">{dueDate}</p>
                  {status === 'overdue' && (
                    <p className="text-sm font-bold mt-2 flex items-center">
                      <span className="mr-1">⚠️</span> PAYMENT OVERDUE
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Payment Terms */}
        {paymentTerms && (
          <div className="mb-8">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-800">Payment Terms</h3>
              </div>
              <p className="text-amber-700 font-medium">{paymentTerms}</p>
            </div>
          </div>
        )}
        
            {/* Items Table */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2 mb-6">Invoice Items</h3>
              <div className="overflow-x-auto shadow-lg rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <th className="px-6 py-4 text-left font-bold">Description</th>
                      <th className="px-6 py-4 text-center font-bold">Quantity</th>
                      <th className="px-6 py-4 text-right font-bold">Unit Price</th>
                      <th className="px-6 py-4 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {items.map((item, index) => (
                      <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-6 py-4 text-gray-900 font-medium">{item.description}</td>
                        <td className="px-6 py-4 text-center text-gray-700">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-700 font-medium">${item.rate.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-gray-900 font-bold">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        
        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-sm">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({taxRate}%):</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-300 mt-3 pt-3">
                <div className="bg-blue-600 text-white p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        {notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{notes}</p>
            </div>
          </div>
        )}
        
        {/* Payment Information */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CreditCard className="h-4 w-4" />
            <span>Thank you for your business! Payment is due within the specified terms.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceTemplate