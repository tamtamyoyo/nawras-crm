import React from 'react'
import { Building2, MapPin, Phone, Mail } from 'lucide-react'

interface InvoiceHeaderProps {
  logoUrl?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  logoUrl,
  companyName = 'Your Company Name',
  companyAddress = '123 Business Street, City, State 12345',
  companyPhone = '+1 (555) 123-4567',
  companyEmail = 'info@company.com',
  invoiceNumber,
  invoiceDate,
  dueDate
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-lg">
      <div className="flex justify-between items-start">
        {/* Company Logo and Info */}
        <div className="flex items-start space-x-6">
          {/* Logo Area */}
          <div className="flex-shrink-0">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Company Logo" 
                className="h-16 w-auto object-contain bg-white p-2 rounded-lg shadow-sm"
              />
            ) : (
              <div className="h-16 w-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          
          {/* Company Details */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">{companyName}</h1>
            <div className="space-y-1 text-blue-100">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{companyAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{companyPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{companyEmail}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoice Info */}
        <div className="text-right space-y-2">
          <h2 className="text-3xl font-bold text-white">INVOICE</h2>
          {invoiceNumber && (
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <div className="text-sm text-blue-100">Invoice Number</div>
              <div className="text-lg font-semibold text-white">{invoiceNumber}</div>
            </div>
          )}
          {invoiceDate && (
            <div className="text-sm">
              <span className="text-blue-100">Date: </span>
              <span className="text-white font-medium">{invoiceDate}</span>
            </div>
          )}
          {dueDate && (
            <div className="text-sm">
              <span className="text-blue-100">Due Date: </span>
              <span className="text-white font-medium">{dueDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoiceHeader