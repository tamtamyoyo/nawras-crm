import { ProposalTemplate, ProposalSection } from '../components/proposals/ProposalTemplate'

/**
 * Company information - auto-populated like invoice system
 */
export const COMPANY_INFO = {
  name: 'Nawras CRM',
  address: '123 Business Street\nSuite 100\nBusiness City, BC 12345',
  phone: '+1 (555) 123-4567',
  email: 'info@nawrascrm.com',
  website: 'www.nawrascrm.com',
  taxId: 'TAX-123456789'
}

/**
 * Payment terms options - mirroring invoice system
 */
export const PAYMENT_TERMS = [
  { value: 'net_15', label: 'Net 15 days' },
  { value: 'net_30', label: 'Net 30 days' },
  { value: 'net_45', label: 'Net 45 days' },
  { value: 'net_60', label: 'Net 60 days' },
  { value: 'due_on_receipt', label: 'Due on receipt' },
]

/**
 * Responsible persons - mirroring invoice system
 */
export const RESPONSIBLE_PERSONS = [
  'Mr. Ali',
  'Mr. Mustafa', 
  'Mr. Taha',
  'Mr. Mohammed'
]

/**
 * Generate proposal number - mirroring invoice numbering system
 */
export function generateProposalNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `PROP-${year}${month}-${random}`
}

/**
 * Standardized proposal template for all proposals
 * This template provides a comprehensive structure covering all common proposal needs
 * Enhanced to mirror invoice system functionality
 */
export const STANDARD_PROPOSAL_TEMPLATE: ProposalTemplate = {
  id: 'standard-template',
  name: 'Standard Business Proposal',
  description: 'Comprehensive standardized proposal template for all business proposals',
  category: 'general',
  sections: [
    {
      id: 'company-header',
      type: 'text',
      title: 'Company Information',
      content: {
        companyName: '{{company_name}}',
        companyAddress: '{{company_address}}',
        companyPhone: '{{company_phone}}',
        companyEmail: '{{company_email}}',
        companyWebsite: '{{company_website}}'
      },
      editable: false,
      required: true
    },
    {
      id: 'cover',
      type: 'text',
      title: 'Cover Page',
      content: {
        proposalNumber: '{{proposal_number}}',
        title: '{{proposal_title}}',
        subtitle: 'Proposal for {{customer_name}}',
        date: '{{current_date}}',
        validUntil: '{{valid_until_date}}',
        preparedBy: '{{responsible_person}}'
      },
      editable: true,
      required: true
    },
    {
      id: 'executive-summary',
      type: 'text',
      title: 'Executive Summary',
      content: {
        text: 'This proposal outlines our recommended solution for {{customer_name}} to address their {{business_need}} requirements. Our approach will deliver {{key_benefits}} while ensuring {{success_metrics}}.'
      },
      editable: true,
      required: true
    },
    {
      id: 'solution-overview',
      type: 'text',
      title: 'Solution Overview',
      content: {
        text: 'Our comprehensive solution includes:\n\n• {{solution_component_1}}\n• {{solution_component_2}}\n• {{solution_component_3}}\n\nThis approach will help {{customer_name}} achieve {{desired_outcomes}}.'
      },
      editable: true,
      required: true
    },
    {
      id: 'pricing',
      type: 'table',
      title: 'Pricing & Services',
      content: {
        headers: ['Item', 'Description', 'Quantity', 'Unit Price', 'Total'],
        rows: [
          ['{{item_1_name}}', '{{item_1_description}}', '{{item_1_quantity}}', '{{item_1_price}}', '{{item_1_total}}'],
          ['{{item_2_name}}', '{{item_2_description}}', '{{item_2_quantity}}', '{{item_2_price}}', '{{item_2_total}}'],
          ['{{item_3_name}}', '{{item_3_description}}', '{{item_3_quantity}}', '{{item_3_price}}', '{{item_3_total}}']
        ],
        totals: {
          subtotal: '{{subtotal}}',
          shippingCost: '{{shipping_cost}}',
          tax: '{{tax_amount}}',
          total: '{{total_amount}}',
          profitMargin: '{{profit_percentage}}%'
        }
      },
      editable: true,
      required: true
    },
    {
      id: 'shipping-details',
      type: 'text',
      title: 'Shipping Information',
      content: {
        shippingAddress: '{{shipping_address}}',
        shippingMethod: '{{shipping_method}}',
        estimatedDelivery: '{{estimated_delivery}}',
        shippingCost: '{{shipping_cost}}'
      },
      editable: true,
      required: false
    },
    {
      id: 'timeline',
      type: 'timeline',
      title: 'Project Timeline',
      content: {
        phases: [
          { name: 'Discovery & Planning', duration: '{{phase_1_duration}}', deliverables: '{{phase_1_deliverables}}' },
          { name: 'Implementation', duration: '{{phase_2_duration}}', deliverables: '{{phase_2_deliverables}}' },
          { name: 'Testing & Launch', duration: '{{phase_3_duration}}', deliverables: '{{phase_3_deliverables}}' },
          { name: 'Support & Maintenance', duration: '{{phase_4_duration}}', deliverables: '{{phase_4_deliverables}}' }
        ]
      },
      editable: true,
      required: false
    },
    {
      id: 'payment-terms',
      type: 'text',
      title: 'Payment Terms',
      content: {
        paymentTerms: '{{payment_terms}}',
        paymentMethod: '{{payment_method}}',
        currency: 'USD',
        lateFees: 'Late payments may incur a 1.5% monthly service charge',
        deposits: 'A 50% deposit may be required before work commences'
      },
      editable: false,
      required: true
    },
    {
      id: 'terms-conditions',
      type: 'text',
      title: 'Terms & Conditions',
      content: {
        acceptance: 'This proposal is valid for 30 days from the date above.',
        cancellation: 'Either party may cancel this agreement with 30 days written notice.',
        warranty: 'All work is guaranteed for 12 months from completion date.',
        liability: 'Our liability is limited to the total contract value.',
        intellectual: 'All intellectual property rights remain with Nawras CRM unless otherwise specified.',
        confidentiality: 'Both parties agree to maintain confidentiality of proprietary information.',
        governing: 'This agreement is governed by the laws of the jurisdiction where services are provided.'
      },
      editable: false,
      required: true
    },
    {
      id: 'next-steps',
      type: 'text',
      title: 'Next Steps',
      content: {
        text: 'To move forward with this proposal:\n\n1. Review and approve this proposal\n2. Sign the attached agreement\n3. Schedule kickoff meeting\n4. Begin project initiation\n\nWe look forward to partnering with {{customer_name}} on this exciting project.'
      },
      editable: true,
      required: true
    }
  ],
  variables: {
    // Auto-populated company information
    company_name: COMPANY_INFO.name,
    company_address: COMPANY_INFO.address,
    company_phone: COMPANY_INFO.phone,
    company_email: COMPANY_INFO.email,
    company_website: COMPANY_INFO.website,
    company_tax_id: COMPANY_INFO.taxId,
    
    // Auto-populated proposal details
    proposal_number: generateProposalNumber(),
    current_date: new Date().toLocaleDateString(),
    valid_until_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    
    // Auto-populated from deal/customer data
    customer_name: 'Valued Client',
    customer_email: '',
    customer_phone: '',
    deal_title: '',
    deal_value: '',
    responsible_person: '',
    
    // Manual input required - Products/Services
    proposal_title: 'Business Proposal',
    business_need: 'business requirements',
    key_benefits: 'significant value and ROI',
    success_metrics: 'measurable results',
    solution_component_1: 'Comprehensive analysis and strategy',
    solution_component_2: 'Implementation and deployment',
    solution_component_3: 'Ongoing support and optimization',
    desired_outcomes: 'their strategic objectives',
    item_1_name: 'Primary Service',
    item_1_description: '',
    item_1_quantity: '1',
    item_1_price: '$5,000',
    item_1_total: '$5,000',
    item_2_name: 'Additional Service',
    item_2_description: '',
    item_2_quantity: '1',
    item_2_price: '$3,000',
    item_2_total: '$3,000',
    item_3_name: 'Support Package',
    item_3_description: '',
    item_3_quantity: '1',
    item_3_price: '$2,000',
    item_3_total: '$2,000',
    
    // Manual input - Shipping details
    shipping_address: '',
    shipping_method: '',
    estimated_delivery: '',
    shipping_cost: '$0',
    
    // Calculated fields
    subtotal: '$10,000',
    tax_amount: '$800',
    total_amount: '$10,800',
    profit_percentage: '20',
    
    // Payment terms (auto-populated with defaults)
    payment_terms: 'Net 30 days',
    payment_method: 'Bank Transfer',
    
    // Timeline variables
    phase_1_duration: '2-3 weeks',
    phase_1_deliverables: 'Project plan, requirements document, and initial analysis',
    phase_2_duration: '4-6 weeks',
    phase_2_deliverables: 'Core implementation and testing',
    phase_3_duration: '1-2 weeks',
    phase_3_deliverables: 'Final testing, deployment, and go-live support',
    phase_4_duration: 'Ongoing',
    phase_4_deliverables: 'Maintenance, updates, and technical support',
    validity_period: '30',
    additional_term_1: 'All intellectual property rights remain with the client',
    additional_term_2: 'Changes to scope may affect timeline and pricing',
    additional_term_3: 'Regular progress updates will be provided throughout the project'
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

/**
 * Get the standard proposal template with optional variable overrides
 * @param variableOverrides - Optional variables to override defaults
 * @returns ProposalTemplate with merged variables
 */
export function getStandardTemplate(variableOverrides?: Record<string, unknown>): ProposalTemplate {
  return {
    ...STANDARD_PROPOSAL_TEMPLATE,
    variables: {
      ...STANDARD_PROPOSAL_TEMPLATE.variables,
      ...variableOverrides
    },
    updatedAt: new Date()
  }
}

/**
 * Calculate totals for proposal items - mirroring invoice calculation logic
 */
export const calculateProposalTotals = (variables: Record<string, string>) => {
  // Calculate subtotal from all items
  let subtotal = 0
  for (let i = 1; i <= 10; i++) {
    const total = parseFloat(variables[`item_${i}_total`]?.replace('$', '') || '0')
    subtotal += total
  }

  // Add shipping cost
  const shippingCost = parseFloat(variables.shipping_cost?.replace('$', '') || '0')
  const subtotalWithShipping = subtotal + shippingCost

  // Calculate tax (assuming 10% tax rate)
  const taxRate = 0.10
  const tax = subtotalWithShipping * taxRate

  // Calculate total before profit
  const totalBeforeProfit = subtotalWithShipping + tax

  // Calculate profit margin
  const profitPercentage = parseFloat(variables.profit_percentage || '20') / 100
  const profitAmount = totalBeforeProfit * profitPercentage

  // Calculate final total
  const finalTotal = totalBeforeProfit + profitAmount

  return {
    subtotal: `$${subtotal.toFixed(2)}`,
    shipping: `$${shippingCost.toFixed(2)}`,
    subtotalWithShipping: `$${subtotalWithShipping.toFixed(2)}`,
    tax: `$${tax.toFixed(2)}`,
    profit: `$${profitAmount.toFixed(2)}`,
    total: `$${finalTotal.toFixed(2)}`,
    profitMargin: `${(profitPercentage * 100).toFixed(1)}%`
  }
}

// Calculate individual item totals with profit margin
export const calculateItemTotal = (quantity: number, unitPrice: number, profitMargin: number = 20) => {
  const baseTotal = quantity * unitPrice
  const profitAmount = baseTotal * (profitMargin / 100)
  return baseTotal + profitAmount
}

// Calculate shipping cost based on method and weight/distance
export const calculateShippingCost = (method: string, weight: number = 1, distance: number = 100) => {
  const shippingRates = {
    standard: 5.99 + (weight * 0.5) + (distance * 0.01),
    express: 12.99 + (weight * 0.8) + (distance * 0.02),
    overnight: 24.99 + (weight * 1.2) + (distance * 0.03),
    pickup: 0
  }

  return shippingRates[method as keyof typeof shippingRates] || shippingRates.standard
}

// Generate estimated delivery date based on shipping method
export const calculateDeliveryDate = (shippingMethod: string, orderDate: Date = new Date()) => {
  const deliveryDays = {
    standard: 5,
    express: 2,
    overnight: 1,
    pickup: 0
  }

  const days = deliveryDays[shippingMethod as keyof typeof deliveryDays] || deliveryDays.standard
  const deliveryDate = new Date(orderDate)
  deliveryDate.setDate(deliveryDate.getDate() + days)

  return deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Create a proposal from the standard template with deal/customer data
 * Enhanced to mirror invoice system functionality
 * @param dealData - Deal information to populate the template
 * @param customerData - Customer information to populate the template
 * @param responsiblePerson - Person responsible for the proposal
 * @returns ProposalTemplate with populated data
 */
export function createProposalFromStandardTemplate(
  dealData?: Record<string, unknown>,
  customerData?: Record<string, unknown>,
  responsiblePerson?: string
): ProposalTemplate {
  const template = { ...STANDARD_PROPOSAL_TEMPLATE }
  
  // Generate fresh proposal number and dates
  const proposalNumber = generateProposalNumber()
  const currentDate = new Date().toLocaleDateString()
  const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
  
  // Auto-populate company information (always fresh)
  template.variables = {
    ...template.variables,
    company_name: COMPANY_INFO.name,
    company_address: COMPANY_INFO.address,
    company_phone: COMPANY_INFO.phone,
    company_email: COMPANY_INFO.email,
    company_website: COMPANY_INFO.website,
    company_tax_id: COMPANY_INFO.taxId,
    proposal_number: proposalNumber,
    current_date: currentDate,
    valid_until_date: validUntilDate
  }
  
  // Auto-populate from deal data
  if (dealData) {
    template.variables = {
      ...template.variables,
      deal_title: dealData.title || '',
      deal_value: dealData.value || '',
      proposal_title: dealData.title || template.variables.proposal_title
    }
  }
  
  // Auto-populate from customer data
  if (customerData) {
    template.variables = {
      ...template.variables,
      customer_name: customerData.name || '',
      customer_email: customerData.email || '',
      customer_phone: customerData.phone || ''
    }
  }
  
  // Set responsible person
  if (responsiblePerson) {
    template.variables = {
      ...template.variables,
      responsible_person: responsiblePerson
    }
  }
  
  return template
}