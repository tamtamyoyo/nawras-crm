import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Database } from '@/lib/database.types'
import JSZip from 'jszip'

// Helper function to serialize proposal content
interface ProposalSection {
  title?: string;
  content?: {
    text?: string;
    items?: Array<{
      description: string;
      quantity: number;
      rate: number;
      total: number;
    }>;
    [key: string]: unknown;
  } | string;
  [key: string]: unknown;
}

type ProposalContent = string | ProposalSection[] | Record<string, unknown>;

function serializeProposalContent(content: ProposalContent): string {
  if (!content) return ''
  
  // If content is a JSON string, parse it first
  let parsedContent: ProposalContent = content
  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content) as ProposalContent
    } catch {
      // If parsing fails, treat as plain text
      return content
    }
  }
  
  if (Array.isArray(parsedContent)) {
    return parsedContent.map((section, index) => {
      if (typeof section === 'object' && section !== null) {
        const title = section.title || `Section ${index + 1}`
        let sectionContent = ''
        
        // Handle different section types
        if (section.content) {
          if (typeof section.content === 'object') {
            if ('text' in section.content && section.content.text) {
              sectionContent = section.content.text
            } else if ('items' in section.content && section.content.items) {
              // Handle pricing sections
              sectionContent = section.content.items.map((item) => 
                `${item.description}: ${item.quantity} x ${item.rate} = ${item.total}`
              ).join('\n')
            } else {
              sectionContent = JSON.stringify(section.content, null, 2)
            }
          } else {
            sectionContent = String(section.content)
          }
        }
        
        return `${title}:\n${sectionContent}`
      }
      return String(section)
    }).join('\n\n')
  }
  
  if (typeof parsedContent === 'object' && parsedContent !== null) {
    return Object.entries(parsedContent).map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      return `${formattedKey}: ${String(value)}`
    }).join('\n')
  }
  
  return String(parsedContent)
}

type Invoice = Database['public']['Tables']['invoices']['Row']
type Proposal = Database['public']['Tables']['proposals']['Row']
type Deal = Database['public']['Tables']['deals']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

interface InvoiceData {
  invoice: Invoice
  deal: Deal
  customer: Customer
}

interface ProposalData {
  proposal: Proposal
  deal: Deal
  customer: Customer
  financialSummary?: {
    subtotal: number
    taxAmount: number
    shippingCost: number
    profitAmount: number
    totalAmount: number
  }
  shippingMethod?: string
  profitMargin?: number
  taxRate?: number
}

export interface PDFCustomizationOptions {
  template?: 'modern' | 'classic' | 'minimal' | 'corporate' | 'professional' | 'elegant'
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  fontSize?: number
  showLogo?: boolean
  logoUrl?: string
  logoPosition?: 'left' | 'center' | 'right'
  logoSize?: 'small' | 'medium' | 'large'
  watermark?: string | { enabled: boolean; text: string; opacity?: number; fontSize?: number; rotation?: number }
  headerText?: string
  footerText?: string
  customHeader?: string
  customFooter?: string
  pageOrientation?: 'portrait' | 'landscape'
  pageSize?: 'a4' | 'letter' | 'legal'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  showPageNumbers?: boolean
  dateFormat?: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd'
  currencySymbol?: string
  showTaxBreakdown?: boolean
  companyInfo?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    taxId?: string
  }
  colorScheme?: {
    primary: string
    secondary: string
    accent: string
  }
  logo?: {
    url: string
    width: number
    height: number
    position: 'left' | 'center' | 'right'
  }
  pageSettings?: {
    format: 'a4' | 'letter' | 'legal'
    orientation: 'portrait' | 'landscape'
    margins: {
      top: number
      right: number
      bottom: number
      left: number
    }
  }
  branding?: {
    companyName: string
    address: string
    phone: string
    email: string
    website: string
  }
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  includeDetails: boolean
  groupBy?: 'customer' | 'date' | 'status'
}

const defaultCustomization: PDFCustomizationOptions = {
  template: 'modern',
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
  fontFamily: 'Helvetica',
  fontSize: 10,
  showLogo: true,
  logoUrl: '',
  logoPosition: 'left',
  logoSize: 'medium',
  watermark: '',
  headerText: '',
  footerText: '',
  customHeader: '',
  customFooter: '',
  pageOrientation: 'portrait',
  pageSize: 'a4',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  showPageNumbers: true,
  dateFormat: 'dd/mm/yyyy',
  currencySymbol: '$',
  showTaxBreakdown: true,
  companyInfo: {
    name: 'Your Company Name',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: ''
  },
  colorScheme: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#10B981'
  },
  pageSettings: {
    format: 'a4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 }
  },
  branding: {
    companyName: 'Nawras CRM',
    address: '',
    phone: '',
    email: '',
    website: ''
  }
}

export const generateInvoicePDF = (data: InvoiceData, options: PDFCustomizationOptions = {}) => {
  const customization = { ...defaultCustomization, ...options }
  const doc = createPDFDocument(customization)
  
  generateInvoiceContent(doc, data, customization)
  
  // Save the PDF
  doc.save(`invoice-${data.invoice.invoice_number}.pdf`)
}

export const generateProposalPDF = (data: ProposalData, options: PDFCustomizationOptions = {}) => {
  const customization = { ...defaultCustomization, ...options }
  const doc = createPDFDocument(customization)
  
  generateProposalContent(doc, data, customization)
  
  // Save the PDF
  doc.save(`proposal-${data.proposal.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)
}

function generateFinancialBreakdown(doc: jsPDF, data: ProposalData, startY: number, options: PDFCustomizationOptions): number {
  const { financialSummary, shippingMethod } = data
  const { colorScheme } = options
  
  if (!financialSummary) return startY
  
  let yPos = startY
  
  // Financial breakdown header
  doc.setFillColor(colorScheme?.primary || '#3B82F6')
  doc.rect(20, yPos, 170, 15, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('Financial Breakdown', 25, yPos + 10)
  yPos += 20
  
  // Financial details background
  doc.setFillColor(248, 250, 252)
  doc.rect(20, yPos, 170, 80, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  // Subtotal
  doc.text('Subtotal:', 25, yPos + 15)
  doc.text(`$${financialSummary.subtotal.toFixed(2)}`, 150, yPos + 15)
  
  // Tax
  doc.text(`Tax (${((data.taxRate || 0) * 100).toFixed(1)}%):`, 25, yPos + 25)
  doc.text(`$${financialSummary.taxAmount.toFixed(2)}`, 150, yPos + 25)
  
  // Shipping
  doc.text(`Shipping${shippingMethod ? ` (${shippingMethod})` : ''}:`, 25, yPos + 35)
  doc.text(`$${financialSummary.shippingCost.toFixed(2)}`, 150, yPos + 35)
  
  // Profit
  doc.text(`Profit Margin (${((data.profitMargin || 0) * 100).toFixed(1)}%):`, 25, yPos + 45)
  doc.text(`$${financialSummary.profitAmount.toFixed(2)}`, 150, yPos + 45)
  
  // Separator line
  doc.setLineWidth(0.5)
  doc.line(25, yPos + 55, 185, yPos + 55)
  
  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Amount:', 25, yPos + 70)
  doc.text(`$${financialSummary.totalAmount.toFixed(2)}`, 150, yPos + 70)
  doc.setFont('helvetica', 'normal')
  
  return yPos + 90
}

function generateProposalContent(doc: jsPDF, data: ProposalData, options: PDFCustomizationOptions) {
  const { template } = options
  
  // Apply template-specific styling
  switch (template) {
    case 'modern':
      generateModernProposalTemplate(doc, data, options)
      break
    case 'classic':
      generateClassicProposalTemplate(doc, data, options)
      break
    case 'minimal':
      generateMinimalProposalTemplate(doc, data, options)
      break
    case 'corporate':
      generateCorporateProposalTemplate(doc, data, options)
      break
    case 'professional':
      generateProfessionalProposalTemplate(doc, data, options)
      break
    case 'elegant':
      generateElegantProposalTemplate(doc, data, options)
      break
    default:
      generateModernProposalTemplate(doc, data, options)
  }
}

function generateModernProposalTemplate(doc: jsPDF, data: ProposalData, options: PDFCustomizationOptions) {
  const { proposal, deal, customer } = data
  const { colorScheme, branding } = options
  
  // Header with gradient effect
  doc.setFillColor(colorScheme?.primary || '#3B82F6')
  doc.rect(0, 0, 210, 40, 'F')
  
  // Company name
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text(branding?.companyName || 'Nawras CRM', 20, 25)
  
  // Proposal title
  doc.setFontSize(24)
  doc.setTextColor(colorScheme?.primary || '#3B82F6')
  doc.text('PROPOSAL', 150, 60)
  
  // Proposal details
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Proposal: ${proposal.title}`, 20, 75)
  doc.text(`Date: ${new Date(proposal.created_at).toLocaleDateString()}`, 20, 85)
  if (proposal.valid_until) {
    doc.text(`Valid Until: ${new Date(proposal.valid_until).toLocaleDateString()}`, 20, 95)
  }
  
  // Customer information
  doc.setFillColor(248, 250, 252)
  doc.rect(20, 110, 80, 50, 'F')
  
  doc.setFontSize(14)
  doc.setTextColor(colorScheme?.primary || '#3B82F6')
  doc.text('Prepared For:', 25, 125)
  
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  let yPos = 135
  if (customer) {
    doc.text(customer.name, 25, yPos)
    yPos += 8
    if (customer.email) {
      doc.text(customer.email, 25, yPos)
      yPos += 8
    }
    if (customer.phone) {
      doc.text(customer.phone, 25, yPos)
      yPos += 8
    }
    if (customer.company) {
      doc.text(customer.company, 25, yPos)
    }
  }
  
  // Proposal content
  if (proposal.content) {
    doc.setFontSize(12)
    doc.setTextColor(colorScheme?.primary || '#3B82F6')
    doc.text('Proposal Details:', 20, 180)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const contentText = serializeProposalContent(proposal.content)
    const splitContent = doc.splitTextToSize(contentText, 170)
    doc.text(splitContent, 20, 190)
  }
  
  // Calculate content height for positioning
  const contentHeight = proposal.content ? Math.ceil(proposal.content.length / 100) * 10 : 0
  let currentY = 220 + contentHeight
  
  // Add financial breakdown if available
  if (data.financialSummary) {
    currentY = generateFinancialBreakdown(doc, data, currentY, options)
  } else if (deal?.value) {
    // Fallback to simple deal value display
    doc.setFillColor(colorScheme?.accent || '#10B981')
    doc.rect(120, currentY, 70, 15, 'F')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text('Estimated Value:', 125, currentY + 10)
    doc.text(`$${deal.value.toLocaleString()}`, 160, currentY + 10)
  }
}

function generateClassicProposalTemplate(doc: jsPDF, data: ProposalData, options: PDFCustomizationOptions) {
  const { proposal, customer } = data
  const { branding } = options
  
  // Classic header with border
  doc.setLineWidth(2)
  doc.rect(15, 15, 180, 30)
  
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text(branding?.companyName || 'Nawras CRM', 20, 35)
  
  doc.setFontSize(16)
  doc.text('PROPOSAL', 150, 35)
  
  // Proposal details
  doc.setFontSize(11)
  doc.text(`Proposal: ${proposal.title}`, 20, 60)
  doc.text(`Date: ${new Date(proposal.created_at).toLocaleDateString()}`, 20, 70)
  if (proposal.valid_until) {
    doc.text(`Valid Until: ${new Date(proposal.valid_until).toLocaleDateString()}`, 20, 80)
  }
  
  // Customer info
  doc.setFontSize(12)
  doc.text('Prepared For:', 20, 100)
  doc.setFontSize(10)
  let yPos = 110
  if (customer) {
    doc.text(customer.name, 20, yPos)
    yPos += 8
    if (customer.email) doc.text(customer.email, 20, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 20, yPos += 8)
    if (customer.company) doc.text(customer.company, 20, yPos += 8)
  }
  
  // Proposal content
  let currentY = 150
  if (proposal.content) {
    doc.setFontSize(12)
    doc.text('Proposal Details:', 20, currentY)
    doc.setFontSize(10)
    const splitContent = doc.splitTextToSize(String(proposal.content || ''), 170)
    doc.text(splitContent, 20, currentY + 10)
    currentY += 10 + (splitContent.length * 5)
  }
  
  // Add financial breakdown if available
  if (data.financialSummary) {
    currentY = generateFinancialBreakdown(doc, data, currentY + 20, options)
  }
}

function generateMinimalProposalTemplate(doc: jsPDF, data: ProposalData, options: PDFCustomizationOptions) {
  const { proposal, customer } = data
  const { branding } = options
  
  // Minimal header
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text(branding?.companyName || 'Nawras CRM', 20, 30)
  
  doc.setFontSize(14)
  doc.text('Proposal', 20, 45)
  
  // Simple details
  doc.setFontSize(10)
  doc.text(proposal.title, 20, 55)
  doc.text(new Date(proposal.created_at).toLocaleDateString(), 20, 65)
  
  // Customer
  if (customer) {
    doc.text(customer.name, 20, 85)
    if (customer.email) doc.text(customer.email, 20, 95)
  }
  
  // Content
  let currentY = 120
  if (proposal.content) {
    const splitContent = doc.splitTextToSize(String(proposal.content || ''), 170)
    doc.text(splitContent, 20, currentY)
    currentY += splitContent.length * 5
  }
  
  // Add financial breakdown if available
  if (data.financialSummary) {
    currentY = generateFinancialBreakdown(doc, data, currentY + 20, options)
  }
}

function generateCorporateProposalTemplate(doc: jsPDF, data: ProposalData, options: PDFCustomizationOptions) {
  const { proposal, customer } = data
  const { colorScheme, branding } = options
  
  // Corporate header
  doc.setFillColor(245, 245, 245)
  doc.rect(0, 0, 210, 50, 'F')
  
  doc.setFontSize(24)
  doc.setTextColor(colorScheme?.primary || '#1F2937')
  doc.text(branding?.companyName || 'Nawras CRM', 20, 30)
  
  // Professional proposal section
  doc.setFillColor(colorScheme?.primary || '#1F2937')
  doc.rect(140, 60, 50, 20, 'F')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('PROPOSAL', 150, 73)
  
  // Detailed information
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Title: ${proposal.title}`, 20, 90)
  doc.text(`Date: ${new Date(proposal.created_at).toLocaleDateString()}`, 20, 100)
  if (proposal.valid_until) {
    doc.text(`Valid Until: ${new Date(proposal.valid_until).toLocaleDateString()}`, 20, 110)
  }
  
  // Professional customer section
  doc.setFillColor(250, 250, 250)
  doc.rect(20, 125, 80, 40, 'F')
  doc.setFontSize(12)
  doc.text('Prepared For:', 25, 135)
  
  if (customer) {
    doc.setFontSize(10)
    let yPos = 145
    doc.text(customer.name, 25, yPos)
    if (customer.company) doc.text(customer.company, 25, yPos += 8)
    if (customer.email) doc.text(customer.email, 25, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 25, yPos += 8)
  }
  
  // Content section
  let currentY = 180
  if (proposal.content) {
    doc.setFontSize(12)
    doc.setTextColor(colorScheme?.primary || '#1F2937')
    doc.text('Proposal Content:', 20, currentY)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const contentText = serializeProposalContent(proposal.content)
    const splitContent = doc.splitTextToSize(contentText, 170)
    doc.text(splitContent, 20, currentY + 10)
    currentY += 10 + (splitContent.length * 5)
  }
  
  // Add financial breakdown if available
  if (data.financialSummary) {
    currentY = generateFinancialBreakdown(doc, data, currentY + 20, options)
  }
}

function generateProfessionalProposalTemplate(doc: jsPDF, data: ProposalData, options: PDFCustomizationOptions) {
  const { proposal, customer } = data
  
  // Professional header with gradient effect
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setFillColor(100, 116, 139)
  doc.rect(0, 30, 210, 10, 'F')
  
  // Company information
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(options.companyInfo?.name || 'Professional Services', 20, 25)
  
  // Proposal title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(24)
  doc.text('PROPOSAL', 140, 60)
  doc.setFontSize(12)
  doc.text(proposal.title, 20, 70)
  
  // Date information
  doc.setFontSize(10)
  doc.text(`Date: ${new Date(proposal.created_at).toLocaleDateString()}`, 140, 80)
  if (proposal.valid_until) {
    doc.text(`Valid Until: ${new Date(proposal.valid_until).toLocaleDateString()}`, 140, 90)
  }
  
  // Customer information section
  doc.setFillColor(248, 250, 252)
  doc.rect(20, 100, 85, 50, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(20, 100, 85, 50)
  
  doc.setFontSize(12)
  doc.setTextColor(30, 64, 175)
  doc.text('Prepared For:', 25, 115)
  
  if (customer) {
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    let yPos = 125
    doc.text(customer.name, 25, yPos)
    if (customer.company) doc.text(customer.company, 25, yPos += 8)
    if (customer.email) doc.text(customer.email, 25, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 25, yPos += 8)
  }
  
  // Content section
  let currentY = 170
  if (proposal.content) {
    doc.setFontSize(12)
    doc.setTextColor(30, 64, 175)
    doc.text('Proposal Details:', 20, currentY)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const splitContent = doc.splitTextToSize(String(proposal.content || ''), 170)
    doc.text(splitContent, 20, currentY + 10)
    currentY += 10 + (splitContent.length * 5)
  }
  
  // Add financial breakdown if available
  if (data.financialSummary) {
    currentY = generateFinancialBreakdown(doc, data, currentY + 20, options)
  }
}

function generateElegantProposalTemplate(doc: jsPDF, data: ProposalData, options: PDFCustomizationOptions) {
  const { proposal, customer } = data
  
  // Elegant border
  doc.setDrawColor(99, 102, 241)
  doc.setLineWidth(2)
  doc.rect(15, 15, 180, 267)
  
  // Elegant header
  doc.setFillColor(99, 102, 241)
  doc.rect(20, 20, 170, 35, 'F')
  
  // Decorative elements
  doc.setFillColor(245, 158, 11)
  doc.circle(25, 25, 3, 'F')
  doc.circle(185, 25, 3, 'F')
  doc.circle(25, 50, 3, 'F')
  doc.circle(185, 50, 3, 'F')
  
  // Company information
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text(options.companyInfo?.name || 'Elegant Business', 105, 35, { align: 'center' })
  
  // Elegant proposal title
  doc.setTextColor(99, 102, 241)
  doc.setFontSize(28)
  doc.text('Proposal', 105, 75, { align: 'center' })
  
  // Decorative line
  doc.setDrawColor(245, 158, 11)
  doc.setLineWidth(1)
  doc.line(70, 80, 140, 80)
  
  // Proposal details
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text(proposal.title, 105, 95, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Date: ${new Date(proposal.created_at).toLocaleDateString()}`, 105, 105, { align: 'center' })
  if (proposal.valid_until) {
    doc.text(`Valid Until: ${new Date(proposal.valid_until).toLocaleDateString()}`, 105, 115, { align: 'center' })
  }
  
  // Elegant customer section
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(25, 130, 80, 45, 3, 3, 'F')
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(25, 130, 80, 45, 3, 3)
  
  doc.setFontSize(12)
  doc.setTextColor(99, 102, 241)
  doc.text('Prepared For', 30, 145)
  
  if (customer) {
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    let yPos = 155
    doc.text(customer.name, 30, yPos)
    if (customer.company) doc.text(customer.company, 30, yPos += 8)
    if (customer.email) doc.text(customer.email, 30, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 30, yPos += 8)
  }
  
  // Content section
  if (proposal.content) {
    doc.setFontSize(12)
    doc.setTextColor(99, 102, 241)
    doc.text('Proposal Content:', 25, 190)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const splitContent = doc.splitTextToSize(String(proposal.content || ''), 160)
    doc.text(splitContent, 25, 200)
  }
}

function createPDFDocument(options: PDFCustomizationOptions): jsPDF {
  const orientation = options.pageOrientation || 'portrait'
  const format = options.pageSize || 'a4'
  
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: format
  })
  
  // Set font
  doc.setFont(options.fontFamily || 'helvetica')
  doc.setFontSize(options.fontSize || 10)
  
  // Apply custom margins if specified
  if (options.margins) {
    // Note: jsPDF doesn't have built-in margin support, but we can use this for positioning
    // The margins will be used by template functions for content positioning
  }
  
  return doc
}

function generateInvoiceContent(doc: jsPDF, data: InvoiceData, options: PDFCustomizationOptions) {
  const { template } = options
  
  // Apply template-specific styling
  switch (template) {
    case 'modern':
      generateModernTemplate(doc, data, options)
      break
    case 'classic':
      generateClassicTemplate(doc, data, options)
      break
    case 'minimal':
      generateMinimalTemplate(doc, data, options)
      break
    case 'corporate':
      generateCorporateTemplate(doc, data, options)
      break
    case 'professional':
      generateProfessionalTemplate(doc, data, options)
      break
    case 'elegant':
      generateElegantTemplate(doc, data, options)
      break
    default:
      generateModernTemplate(doc, data, options)
  }
}

function generateModernTemplate(doc: jsPDF, data: InvoiceData, options: PDFCustomizationOptions) {
  const { invoice, deal, customer } = data
  const { colorScheme, branding } = options
  
  // Header with gradient effect
  doc.setFillColor(colorScheme?.primary || '#3B82F6')
  doc.rect(0, 0, 210, 60, 'F')
  
  // Company name
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text(branding?.companyName || 'Nawras CRM', 20, 35)
  
  // Invoice title
  doc.setFontSize(18)
  doc.text('INVOICE', 150, 45)
  
  // Invoice details section with better spacing
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 80)
  doc.text(`Issue Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 95)
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 110)
  }
  
  // Payment terms if available
  if (invoice.payment_terms) {
    const paymentTermsText = invoice.payment_terms.replace('_', ' ').toUpperCase()
    doc.text(`Payment Terms: ${paymentTermsText}`, 20, 125)
  }
  
  // Customer information with modern styling
  doc.setFillColor(248, 250, 252)
  doc.rect(20, 140, 85, 50, 'F')
  doc.setFontSize(14)
  doc.setTextColor(colorScheme?.primary || '#3B82F6')
  doc.text('Bill To:', 25, 155)
  
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  let yPos = 165
  if (customer) {
    doc.setFont('helvetica', 'bold')
    doc.text(customer.name, 25, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 10
    if (customer.company) {
      doc.text(customer.company, 25, yPos)
      yPos += 8
    }
    if (customer.email) {
      doc.text(customer.email, 25, yPos)
      yPos += 8
    }
    if (customer.phone) {
      doc.text(customer.phone, 25, yPos)
    }
  }
  
  // Items table with modern design
  const tableStartY = 200
  doc.setFillColor(colorScheme?.primary || '#3B82F6')
  doc.rect(20, tableStartY, 170, 15, 'F')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Description', 25, tableStartY + 10)
  doc.text('Amount', 160, tableStartY + 10)
  
  // Items with better spacing
  let currentY = tableStartY + 25
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  
  // Main service/product line
  doc.text(deal?.title || 'Professional Service', 25, currentY)
  doc.text(`$${(invoice.amount || 0).toFixed(2)}`, 160, currentY)
  currentY += 15
  
  // Subtotal line
  doc.setDrawColor(200, 200, 200)
  doc.line(120, currentY, 190, currentY)
  currentY += 10
  
  doc.text('Subtotal:', 125, currentY)
  doc.text(`$${(invoice.amount || 0).toFixed(2)}`, 160, currentY)
  currentY += 12
  
  // Tax line if applicable
  if (invoice.tax_amount && invoice.tax_amount > 0) {
    doc.text(`Tax (${invoice.tax_rate || 0}%):`, 125, currentY)
    doc.text(`$${invoice.tax_amount.toFixed(2)}`, 160, currentY)
    currentY += 12
  }
  
  // Total with accent color and better formatting
  doc.setFillColor(colorScheme?.accent || '#10B981')
  doc.rect(120, currentY + 2, 70, 18, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', 125, currentY + 13)
  doc.text(`$${(invoice.total_amount || 0).toFixed(2)}`, 160, currentY + 13)
  
  // Notes section if available
  if (invoice.notes && invoice.notes.trim()) {
    currentY += 30
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colorScheme?.primary || '#3B82F6')
    doc.text('Notes:', 25, currentY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const noteLines = doc.splitTextToSize(invoice.notes, 160)
    doc.text(noteLines, 25, currentY + 10)
  }
  
  // Footer with professional information
  const footerY = 270
  doc.setDrawColor(200, 200, 200)
  doc.line(20, footerY, 190, footerY)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Thank you for your business!', 25, footerY + 10)
  
  if (invoice.payment_method) {
    doc.text(`Payment Method: ${invoice.payment_method}`, 25, footerY + 20)
  }
  
  // Add watermark if specified
  if (options.watermark && typeof options.watermark === 'object' && options.watermark.enabled && options.watermark.text) {
    addWatermark(doc, {
      text: options.watermark.text,
      opacity: options.watermark.opacity || 0.1,
      fontSize: options.watermark.fontSize || 48,
      rotation: options.watermark.rotation || -45
    });
  }
}

function generateClassicTemplate(doc: jsPDF, data: InvoiceData, options: PDFCustomizationOptions) {
  const { invoice, deal, customer } = data
  const { branding } = options
  
  // Classic header with border
  doc.setLineWidth(2)
  doc.rect(15, 15, 180, 30)
  
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text(branding?.companyName || 'Nawras CRM', 20, 35)
  
  doc.setFontSize(16)
  doc.text('INVOICE', 150, 35)
  
  // Invoice details
  doc.setFontSize(11)
  doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 60)
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 70)
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 80)
  }
  
  // Customer info
  doc.setFontSize(12)
  doc.text('Bill To:', 20, 100)
  doc.setFontSize(10)
  let yPos = 110
  if (customer) {
    doc.text(customer.name, 20, yPos)
    yPos += 8
    if (customer.email) doc.text(customer.email, 20, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 20, yPos += 8)
    if (customer.company) doc.text(customer.company, 20, yPos += 8)
  }
  
  // Items table
  const tableY = 150
  doc.rect(20, tableY, 170, 15)
  doc.text('Description', 25, tableY + 10)
  doc.text('Amount', 160, tableY + 10)
  
  let currentY = tableY + 25
  doc.text(deal?.title || 'Service', 25, currentY)
  doc.text(`$${invoice.amount?.toLocaleString() || '0.00'}`, 160, currentY)
  
  if (invoice.tax_amount && invoice.tax_amount > 0) {
    currentY += 15
    doc.text('Tax', 25, currentY)
    doc.text(`$${invoice.tax_amount.toLocaleString()}`, 160, currentY)
  }
  
  // Total
  currentY += 20
  doc.setFontSize(12)
  doc.text('Total:', 130, currentY)
  doc.text(`$${invoice.total_amount?.toLocaleString() || '0.00'}`, 160, currentY)
}

function generateMinimalTemplate(doc: jsPDF, data: InvoiceData, options: PDFCustomizationOptions) {
  const { invoice, deal, customer } = data
  const { branding } = options
  
  // Minimal header
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text(branding?.companyName || 'Nawras CRM', 20, 30)
  
  doc.setFontSize(14)
  doc.text('Invoice', 20, 45)
  
  // Simple details
  doc.setFontSize(10)
  doc.text(`#${invoice.invoice_number}`, 20, 55)
  doc.text(new Date(invoice.created_at).toLocaleDateString(), 20, 65)
  
  // Customer
  if (customer) {
    doc.text(customer.name, 20, 85)
    if (customer.email) doc.text(customer.email, 20, 95)
  }
  
  // Items
  doc.text(deal?.title || 'Service', 20, 120)
  doc.text(`$${invoice.total_amount?.toLocaleString() || '0.00'}`, 150, 120)
}

function generateCorporateTemplate(doc: jsPDF, data: InvoiceData, options: PDFCustomizationOptions) {
  const { invoice, deal, customer } = data
  const { colorScheme, branding } = options
  
  // Corporate header with logo space
  doc.setFillColor(245, 245, 245)
  doc.rect(0, 0, 210, 50, 'F')
  
  doc.setFontSize(24)
  doc.setTextColor(colorScheme?.primary || '#1F2937')
  doc.text(branding?.companyName || 'Nawras CRM', 20, 30)
  
  // Professional invoice section
  doc.setFillColor(colorScheme?.primary || '#1F2937')
  doc.rect(140, 60, 50, 20, 'F')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('INVOICE', 150, 73)
  
  // Detailed information layout
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 90)
  doc.text(`Issue Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 100)
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 110)
  }
  
  // Professional customer section
  doc.setFillColor(250, 250, 250)
  doc.rect(20, 125, 80, 40, 'F')
  doc.setFontSize(12)
  doc.text('Bill To:', 25, 135)
  
  if (customer) {
    doc.setFontSize(10)
    let yPos = 145
    doc.text(customer.name, 25, yPos)
    if (customer.company) doc.text(customer.company, 25, yPos += 8)
    if (customer.email) doc.text(customer.email, 25, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 25, yPos += 8)
  }
  
  // Professional table
  const tableY = 180
  doc.setFillColor(colorScheme?.primary || '#1F2937')
  doc.rect(20, tableY, 170, 12, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('Description', 25, tableY + 8)
  doc.text('Amount', 160, tableY + 8)
  
  doc.setTextColor(0, 0, 0)
  let currentY = tableY + 25
  doc.text(deal?.title || 'Professional Service', 25, currentY)
  doc.text(`$${invoice.amount?.toLocaleString() || '0.00'}`, 160, currentY)
  
  if (invoice.tax_amount && invoice.tax_amount > 0) {
    currentY += 15
    doc.text('Tax', 25, currentY)
    doc.text(`$${invoice.tax_amount.toLocaleString()}`, 160, currentY)
  }
  
  // Professional total
  doc.setFillColor(colorScheme?.accent || '#059669')
  doc.rect(120, currentY + 10, 70, 15, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('Total Amount:', 125, currentY + 20)
  doc.text(`$${invoice.total_amount?.toLocaleString() || '0.00'}`, 160, currentY + 20)
}

function generateProfessionalTemplate(doc: jsPDF, data: InvoiceData, options: PDFCustomizationOptions) {
  const { invoice, deal, customer } = data
  
  // Professional header with gradient effect
  doc.setFillColor(30, 64, 175) // Primary color
  doc.rect(0, 0, 210, 40, 'F')
  doc.setFillColor(100, 116, 139) // Secondary overlay
  doc.rect(0, 30, 210, 10, 'F')
  
  // Company logo and info
  if (options.showLogo && options.logoUrl) {
    // Logo placeholder - in real implementation, you'd load the actual image
    doc.setFillColor(255, 255, 255)
    doc.rect(20, 10, 30, 20, 'F')
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(8)
    doc.text('LOGO', 32, 22)
  }
  
  // Company information
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(options.companyInfo?.name || 'Professional Services', options.showLogo ? 60 : 20, 20)
  doc.setFontSize(10)
  if (options.companyInfo?.address) doc.text(options.companyInfo.address, options.showLogo ? 60 : 20, 28)
  if (options.companyInfo?.phone) doc.text(options.companyInfo.phone, options.showLogo ? 60 : 20, 35)
  
  // Invoice title and number
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(24)
  doc.text('INVOICE', 140, 60)
  doc.setFontSize(12)
  doc.text(`#${invoice.invoice_number}`, 140, 70)
  
  // Date information
  doc.setFontSize(10)
  const dateFormat = options.dateFormat || 'dd/mm/yyyy'
  const formatDate = (date: string) => {
    const d = new Date(date)
    switch (dateFormat) {
      case 'mm/dd/yyyy': return d.toLocaleDateString('en-US')
      case 'yyyy-mm-dd': return d.toISOString().split('T')[0]
      default: return d.toLocaleDateString('en-GB')
    }
  }
  
  doc.text(`Issue Date: ${formatDate(invoice.created_at)}`, 140, 80)
  if (invoice.due_date) {
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 140, 90)
  }
  
  // Customer information section
  doc.setFillColor(248, 250, 252)
  doc.rect(20, 100, 85, 50, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(20, 100, 85, 50)
  
  doc.setFontSize(12)
  doc.setTextColor(30, 64, 175)
  doc.text('Bill To:', 25, 115)
  
  if (customer) {
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    let yPos = 125
    doc.text(customer.name, 25, yPos)
    if (customer.company) doc.text(customer.company, 25, yPos += 8)
    if (customer.email) doc.text(customer.email, 25, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 25, yPos += 8)
  }
  
  // Items table with professional styling
  const tableY = 170
  doc.setFillColor(30, 64, 175)
  doc.rect(20, tableY, 170, 15, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('Description', 25, tableY + 10)
  doc.text('Amount', 160, tableY + 10)
  
  // Table content
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(255, 255, 255)
  doc.rect(20, tableY + 15, 170, 20, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(20, tableY + 15, 170, 20)
  
  let currentY = tableY + 25
  doc.text(deal?.title || 'Professional Service', 25, currentY)
  doc.text(`${options.currencySymbol || '$'}${invoice.amount?.toLocaleString() || '0.00'}`, 160, currentY)
  
  // Tax breakdown if enabled
  if (options.showTaxBreakdown && invoice.tax_amount && invoice.tax_amount > 0) {
    currentY += 15
    doc.setFillColor(248, 250, 252)
    doc.rect(20, currentY - 5, 170, 15, 'F')
    doc.text('Tax', 25, currentY + 5)
    doc.text(`${options.currencySymbol || '$'}${invoice.tax_amount.toLocaleString()}`, 160, currentY + 5)
  }
  
  // Professional total section
  doc.setFillColor(5, 150, 105) // Accent color
  doc.rect(120, currentY + 20, 70, 20, 'F')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL', 125, currentY + 30)
  doc.text(`${options.currencySymbol || '$'}${invoice.total_amount?.toLocaleString() || '0.00'}`, 155, currentY + 35)
  
  // Custom footer
  if (options.customFooter || options.footerText) {
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(options.customFooter || options.footerText || '', 20, 280)
  }
  
  // Page numbers if enabled
  if (options.showPageNumbers) {
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Page 1', 180, 290)
  }
}

function generateElegantTemplate(doc: jsPDF, data: InvoiceData, options: PDFCustomizationOptions) {
  const { invoice, deal, customer } = data
  
  // Elegant border
  doc.setDrawColor(99, 102, 241)
  doc.setLineWidth(2)
  doc.rect(15, 15, 180, 267)
  
  // Elegant header with decorative elements
  doc.setFillColor(99, 102, 241)
  doc.rect(20, 20, 170, 35, 'F')
  
  // Decorative corner elements
  doc.setFillColor(245, 158, 11)
  doc.circle(25, 25, 3, 'F')
  doc.circle(185, 25, 3, 'F')
  doc.circle(25, 50, 3, 'F')
  doc.circle(185, 50, 3, 'F')
  
  // Company information with elegant typography
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text(options.companyInfo?.name || 'Elegant Business', 105, 35, { align: 'center' })
  doc.setFontSize(10)
  if (options.companyInfo?.address) doc.text(options.companyInfo.address, 105, 45, { align: 'center' })
  
  // Elegant invoice title
  doc.setTextColor(99, 102, 241)
  doc.setFontSize(28)
  doc.text('Invoice', 105, 75, { align: 'center' })
  
  // Decorative line
  doc.setDrawColor(245, 158, 11)
  doc.setLineWidth(1)
  doc.line(70, 80, 140, 80)
  
  // Invoice details in elegant layout
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text(`Invoice #${invoice.invoice_number}`, 105, 95, { align: 'center' })
  
  const dateFormat = options.dateFormat || 'dd/mm/yyyy'
  const formatDate = (date: string) => {
    const d = new Date(date)
    switch (dateFormat) {
      case 'mm/dd/yyyy': return d.toLocaleDateString('en-US')
      case 'yyyy-mm-dd': return d.toISOString().split('T')[0]
      default: return d.toLocaleDateString('en-GB')
    }
  }
  
  doc.setFontSize(10)
  doc.text(`Date: ${formatDate(invoice.created_at)}`, 105, 105, { align: 'center' })
  if (invoice.due_date) {
    doc.text(`Due: ${formatDate(invoice.due_date)}`, 105, 115, { align: 'center' })
  }
  
  // Elegant customer section
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(25, 130, 80, 45, 3, 3, 'F')
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(25, 130, 80, 45, 3, 3)
  
  doc.setFontSize(12)
  doc.setTextColor(99, 102, 241)
  doc.text('Billed To', 30, 145)
  
  if (customer) {
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    let yPos = 155
    doc.text(customer.name, 30, yPos)
    if (customer.company) doc.text(customer.company, 30, yPos += 8)
    if (customer.email) doc.text(customer.email, 30, yPos += 8)
    if (customer.phone) doc.text(customer.phone, 30, yPos += 8)
  }
  
  // Elegant items section
  const tableY = 190
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(25, tableY, 160, 15, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('Service Description', 30, tableY + 10)
  doc.text('Amount', 155, tableY + 10)
  
  // Service item with elegant styling
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(25, tableY + 15, 160, 20, 2, 2, 'F')
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(25, tableY + 15, 160, 20, 2, 2)
  
  let currentY = tableY + 25
  doc.text(deal?.title || 'Elegant Service', 30, currentY)
  doc.text(`${options.currencySymbol || '$'}${invoice.amount?.toLocaleString() || '0.00'}`, 155, currentY)
  
  // Tax section with elegant styling
  if (options.showTaxBreakdown && invoice.tax_amount && invoice.tax_amount > 0) {
    currentY += 15
    doc.setFillColor(254, 249, 195)
    doc.roundedRect(25, currentY - 5, 160, 15, 2, 2, 'F')
    doc.text('Tax', 30, currentY + 5)
    doc.text(`${options.currencySymbol || '$'}${invoice.tax_amount.toLocaleString()}`, 155, currentY + 5)
  }
  
  // Elegant total section
  doc.setFillColor(245, 158, 11)
  doc.roundedRect(110, currentY + 25, 75, 25, 3, 3, 'F')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('Total Amount', 115, currentY + 35)
  doc.setFontSize(16)
  doc.text(`${options.currencySymbol || '$'}${invoice.total_amount?.toLocaleString() || '0.00'}`, 115, currentY + 45)
  
  // Elegant footer with decorative elements
  if (options.customFooter || options.footerText) {
    doc.setDrawColor(245, 158, 11)
    doc.setLineWidth(0.5)
    doc.line(25, 270, 185, 270)
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(options.customFooter || options.footerText || '', 105, 275, { align: 'center' })
  }
  
  // Page numbers with elegant styling
  if (options.showPageNumbers) {
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text('— 1 —', 105, 285, { align: 'center' })
  }
}

interface WatermarkOptions {
  text: string
  opacity: number
  fontSize?: number
  rotation?: number
}

export interface ExportFormat {
  format: 'pdf' | 'excel' | 'csv'
}

interface BatchExportOptions {
  format?: 'pdf' | 'excel' | 'csv'
  exportOptions?: ExportOptions
}

function addWatermark(doc: jsPDF, watermark: WatermarkOptions) {
  doc.saveGraphicsState()
  // Set opacity using setGState with proper syntax
  doc.setGState({ opacity: watermark.opacity || 0.1 })
  doc.setFontSize(watermark.fontSize || 48)
  doc.setTextColor(128, 128, 128)
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Center the watermark
  const textWidth = doc.getTextWidth(watermark.text)
  const x = (pageWidth - textWidth) / 2
  const y = pageHeight / 2
  
  doc.text(watermark.text, x, y, { angle: watermark.rotation || -45 })
  doc.restoreGraphicsState()
}

export const generateInvoicePDFBlob = (data: InvoiceData, options: PDFCustomizationOptions = {}): Blob => {
  const customization = { ...defaultCustomization, ...options }
  const doc = createPDFDocument(customization)
  
  generateInvoiceContent(doc, data, customization)
  
  return doc.output('blob')
}

// Export to different formats
export const exportInvoiceToFormat = async (data: InvoiceData, format: 'pdf' | 'excel' | 'csv', options: ExportOptions & { pdfOptions?: PDFCustomizationOptions } = { format: 'pdf', includeDetails: true }): Promise<Blob> => {
  switch (format) {
    case 'pdf':
      return generateInvoicePDFBlob(data, options.pdfOptions)
    case 'excel':
      return generateInvoiceExcel(data)
    case 'csv':
      return generateInvoiceCSV(data)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

// Batch download functionality
export const generateBatchInvoices = async (invoicesData: InvoiceData[], options: BatchExportOptions = {}): Promise<Blob> => {
  const zip = new JSZip()
  const { format = 'pdf' } = options
  
  for (const data of invoicesData) {
    const fileName = `invoice-${data.invoice.invoice_number}.${format}`
    const blob = await exportInvoiceToFormat(data, format, options.exportOptions)
    
    zip.file(fileName, blob)
  }
  
  return zip.generateAsync({ type: 'blob' })
}

// Excel export functionality
function generateInvoiceExcel(data: InvoiceData): Blob {
  const { invoice, deal, customer } = data
  
  // Create Excel-like CSV with structured data
  const rows = [
    ['Invoice Details'],
    ['Invoice Number', invoice.invoice_number],
    ['Date', new Date(invoice.created_at).toLocaleDateString()],
    ['Due Date', invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : ''],
    [''],
    ['Customer Information'],
    ['Name', customer?.name || ''],
    ['Email', customer?.email || ''],
    ['Phone', customer?.phone || ''],
    ['Company', customer?.company || ''],
    [''],
    ['Invoice Items'],
    ['Description', 'Amount'],
    [deal?.title || 'Service', `$${invoice.amount?.toLocaleString() || '0.00'}`],
  ]
  
  if (invoice.tax_amount && invoice.tax_amount > 0) {
    rows.push(['Tax', `$${invoice.tax_amount.toLocaleString()}`])
  }
  
  rows.push(['Total', `$${invoice.total_amount?.toLocaleString() || '0.00'}`])
  
  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  
  return new Blob([csvContent], { type: 'application/vnd.ms-excel' })
}

// CSV export functionality
function generateInvoiceCSV(data: InvoiceData): Blob {
  const { invoice, deal, customer } = data
  
  const csvData = [
    ['Field', 'Value'],
    ['Invoice Number', invoice.invoice_number],
    ['Date', new Date(invoice.created_at).toLocaleDateString()],
    ['Due Date', invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : ''],
    ['Customer Name', customer?.name || ''],
    ['Customer Email', customer?.email || ''],
    ['Customer Phone', customer?.phone || ''],
    ['Customer Company', customer?.company || ''],
    ['Service', deal?.title || 'Service'],
    ['Amount', invoice.amount?.toString() || '0'],
    ['Tax Amount', invoice.tax_amount?.toString() || '0'],
    ['Total Amount', invoice.total_amount?.toString() || '0'],
    ['Payment Terms', invoice.payment_terms || ''],
    ['Notes', invoice.notes || '']
  ]
  
  const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  
  return new Blob([csvContent], { type: 'text/csv' })
}

// Print functionality
export const printInvoice = (data: InvoiceData, options: PDFCustomizationOptions = {}) => {
  const customization = { ...defaultCustomization, ...options }
  const doc = createPDFDocument(customization)
  
  generateInvoiceContent(doc, data, customization)
  
  // Open in new window for printing
  const pdfBlob = doc.output('blob')
  const url = URL.createObjectURL(pdfBlob)
  const printWindow = window.open(url)
  
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}