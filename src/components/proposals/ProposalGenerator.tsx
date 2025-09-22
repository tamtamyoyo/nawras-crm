import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  FileText, Download, Send, Wand2, RefreshCw, CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { generateProposalPDF } from '@/utils/pdf-generator'

interface Deal {
  id: string
  title: string
  customer_id: string | null
  lead_id: string | null
  value: number
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  expected_close_date: string | null
  description: string | null
  source: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
  competitor_info: string | null
  decision_maker_contact: string | null
  deal_source: string | null
  deal_type: string | null
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  status: 'active' | 'inactive' | 'prospect'
  source: string | null
  tags: string[] | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
  // Export-specific fields
  export_license_number: string | null
  export_license_expiry: string | null
  customs_broker: string | null
  preferred_currency: string | null
  payment_terms_export: string | null
  credit_limit_usd: number | null
  export_documentation_language: string | null
  special_handling_requirements: string | null
  compliance_notes: string | null
}

interface LineItem {
  description: string
  quantity?: number
  rate?: number
  total: number
}

interface ShippingCost {
  method: string
  cost: number
  estimatedDays: number
  description?: string
}

interface ProfitCalculation {
  costBasis: number
  profitMargin: number
  profitAmount: number
  profitPercentage: number
}

interface FinancialSummary {
  subtotal: number
  taxRate: number
  taxAmount: number
  shippingCost: number
  profitAmount: number
  totalAmount: number
  profitMargin: number
}

interface PricingData {
  line_items?: LineItem[]
  pricing_options?: unknown
  payment_terms?: unknown
  shipping?: ShippingCost
  profit?: ProfitCalculation
  financial_summary?: FinancialSummary
}

interface ReviewData {
  completeness: number
  suggestions?: string[]
}

interface GeneratedContent {
  executive_summary?: string
  solution_overview?: string
  pricing?: PricingData
  review?: ReviewData
  [key: string]: unknown
}

interface ProposalData {
  id?: string
  title: string
  description: string
  dealId?: string
  customerId: string
  templateId: string
  content: Record<string, unknown>
  variables: Record<string, unknown>
  totalValue: number
  validUntil: Date
  status: 'draft' | 'generating' | 'ready' | 'sent'
  shippingCost?: number
  profitMargin?: number
  taxRate?: number
  subtotal?: number
}

interface ProposalGeneratorProps {
  deal?: Deal
  customer?: Customer
  template?: {
    id?: string
    styling?: {
      primaryColor?: string
      secondaryColor?: string
    }
  }
  onGenerate?: (proposal: ProposalData) => void
  onSave?: (proposal: ProposalData) => void
  className?: string
}

const GENERATION_STEPS = [
  { id: 'analyze', label: 'Analyzing Requirements', description: 'Processing deal and customer data' },
  { id: 'content', label: 'Generating Content', description: 'Creating proposal sections' },
  { id: 'pricing', label: 'Calculating Pricing', description: 'Building pricing tables' },
  { id: 'format', label: 'Formatting Document', description: 'Applying template styling' },
  { id: 'review', label: 'Final Review', description: 'Validating proposal content' }
]

const CONTENT_SUGGESTIONS = {
  executive_summary: [
    'Highlight key business challenges and opportunities',
    'Emphasize unique value proposition',
    'Include measurable benefits and ROI',
    'Reference industry best practices'
  ],
  solution_overview: [
    'Detail technical specifications',
    'Explain implementation methodology',
    'Outline project phases and milestones',
    'Address potential risks and mitigation'
  ],
  pricing: [
    'Break down costs by component',
    'Include optional add-ons',
    'Provide payment terms and options',
    'Show total cost of ownership'
  ],
  timeline: [
    'Define project phases clearly',
    'Set realistic deadlines',
    'Include buffer time for revisions',
    'Specify client responsibilities'
  ]
}

export function ProposalGenerator({
  deal,
  customer,
  template,
  onGenerate,
  onSave,
  className
}: ProposalGeneratorProps) {
  const [proposal, setProposal] = useState<ProposalData>({
    title: deal?.title || 'New Proposal',
    description: deal?.description || '',
    dealId: deal?.id,
    customerId: customer?.id || '',
    templateId: template?.id || '',
    content: {},
    variables: {},
    totalValue: deal?.value || 0,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'draft'
  })

  const [generationStep, setGenerationStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({})
  const [customVariables, setCustomVariables] = useState<Record<string, unknown>>({})
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string[]>>({})
  
  // Financial calculation states
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [shippingMethod, setShippingMethod] = useState<string>('standard')
  const [taxRate, setTaxRate] = useState<number>(0.08) // 8% default tax rate
  const [profitMargin, setProfitMargin] = useState<number>(0.25) // 25% default profit margin
  const [costBasis, setCostBasis] = useState<number>(0)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    subtotal: 0,
    taxRate: 0.08,
    taxAmount: 0,
    shippingCost: 0,
    profitAmount: 0,
    totalAmount: 0,
    profitMargin: 0.25
  })
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    if (deal && customer) {
      // Auto-populate variables from deal and customer data
      const autoVariables = {
        customer_name: customer.name || customer.company,
        customer_company: customer.company,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_address: customer.address,
        customer_industry: customer.company || 'Not specified',
        deal_title: deal.title,
        deal_description: deal.description,
        deal_value: deal.value,
        deal_probability: deal.probability,
        expected_close_date: deal.expected_close_date,
        sales_rep: deal.assigned_to,
        current_date: new Date().toLocaleDateString(),
        proposal_title: `${deal.title} - Proposal for ${customer.name || customer.company}`,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
      
      setCustomVariables(autoVariables)
      setProposal(prev => ({
        ...prev,
        variables: autoVariables,
        title: autoVariables.proposal_title
      }))
    }
  }, [deal, customer])

  const generateContent = async () => {
    setIsGenerating(true)
    setProposal(prev => ({ ...prev, status: 'generating' }))
    
    try {
      // Simulate AI content generation with realistic delays
      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        setGenerationStep(i)
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Generate content for each step
        switch (GENERATION_STEPS[i].id) {
          case 'analyze':
            // Analyze requirements
            break
          case 'content':
            await generateSectionContent()
            break
          case 'pricing':
            await generatePricingContent()
            break
          case 'format':
            await applyFormatting()
            break
          case 'review':
            await finalReview()
            break
        }
      }
      
      setProposal(prev => ({ ...prev, status: 'ready', content: generatedContent }))
      toast.success('Proposal generated successfully!')
    } catch (error) {
      console.error('Error generating proposal:', error)
      toast.error('Failed to generate proposal')
      setProposal(prev => ({ ...prev, status: 'draft' }))
    } finally {
      setIsGenerating(false)
      setGenerationStep(0)
    }
  }

  const generateSectionContent = async () => {
    const content = {
      executive_summary: generateExecutiveSummary(),
      solution_overview: generateSolutionOverview(),
      company_background: generateCompanyBackground(),
      project_approach: generateProjectApproach(),
      deliverables: generateDeliverables(),
      success_metrics: generateSuccessMetrics(),
      next_steps: generateNextSteps()
    }
    
    setGeneratedContent(prev => ({ ...prev, ...content }))
  }

  const generatePricingContent = async () => {
    const pricingData = {
      line_items: generateLineItems(),
      pricing_options: generatePricingOptions(),
      payment_terms: generatePaymentTerms()
    }
    
    setGeneratedContent(prev => ({ ...prev, pricing: pricingData }))
  }

  const applyFormatting = async () => {
    // Apply template styling and formatting
    const formatting = {
      styles: template?.styling || {},
      layout: 'professional',
      branding: {
        logo: '',
        colors: template?.styling?.primaryColor || '#0088FE'
      }
    }
    
    setGeneratedContent(prev => ({ ...prev, formatting }))
  }

  const finalReview = async () => {
    // Perform final validation and optimization
    const review = {
      completeness: 95,
      accuracy: 98,
      suggestions: [
        'Consider adding client testimonials',
        'Include more specific timeline details',
        'Add risk mitigation strategies'
      ]
    }
    
    setGeneratedContent(prev => ({ ...prev, review }))
  }

  const generateExecutiveSummary = () => {
    const customerName = customVariables.customer_name || 'the client'
    const dealTitle = customVariables.deal_title || 'this project'
    const industry = customVariables.customer_industry || 'your industry'
    
    return `This proposal outlines our comprehensive solution for ${customerName} to address their ${String(dealTitle).toLowerCase()} requirements. Our approach leverages industry-leading practices in ${industry} to deliver measurable results and exceptional value.

Key benefits include:
• Streamlined operations and improved efficiency
• Cost reduction through optimized processes
• Enhanced customer experience and satisfaction
• Scalable solution that grows with your business

We are confident that our solution will exceed ${customerName}'s expectations and deliver significant return on investment within the first year of implementation.`
  }

  const generateSolutionOverview = () => {
    const dealDescription = customVariables.deal_description || 'comprehensive business solution'
    
    return `Our proposed solution for ${dealDescription} includes:

**Phase 1: Discovery & Analysis**
• Comprehensive requirements gathering
• Current state assessment
• Gap analysis and recommendations

**Phase 2: Solution Design**
• Custom solution architecture
• Technical specifications
• Integration planning

**Phase 3: Implementation**
• Phased rollout approach
• User training and support
• Quality assurance testing

**Phase 4: Optimization**
• Performance monitoring
• Continuous improvement
• Ongoing support and maintenance

This comprehensive approach ensures successful project delivery while minimizing risks and maximizing value for your organization.`
  }

  const generateCompanyBackground = () => {
    return `Our company brings extensive experience in delivering innovative solutions across various industries. With a proven track record of successful implementations, we understand the unique challenges and opportunities in ${customVariables.customer_industry || 'your industry'}.

**Our Expertise:**
• Industry-specific knowledge and best practices
• Proven methodology and frameworks
• Experienced team of certified professionals
• Strong track record of on-time, on-budget delivery

**Why Choose Us:**
• Deep understanding of your business needs
• Commitment to quality and excellence
• Ongoing support and partnership approach
• Competitive pricing with transparent costs`
  }

  const generateProjectApproach = () => {
    return `Our project approach is designed to ensure successful delivery while minimizing disruption to your operations:

**1. Collaborative Planning**
• Joint project kickoff and planning sessions
• Clear communication channels and regular updates
• Stakeholder engagement and feedback loops

**2. Agile Implementation**
• Iterative development and testing
• Regular milestone reviews and adjustments
• Flexible approach to changing requirements

**3. Risk Management**
• Proactive risk identification and mitigation
• Contingency planning for critical scenarios
• Quality assurance at every stage

**4. Knowledge Transfer**
• Comprehensive documentation and training
• Hands-on support during transition
• Ongoing maintenance and support options`
  }

  const generateDeliverables = () => {
    return [
      {
        category: 'Documentation',
        items: [
          'Project requirements specification',
          'Technical architecture document',
          'User manuals and training materials',
          'Implementation and deployment guides'
        ]
      },
      {
        category: 'Implementation',
        items: [
          'Fully configured solution',
          'Integration with existing systems',
          'Data migration and validation',
          'Performance testing and optimization'
        ]
      },
      {
        category: 'Support',
        items: [
          'User training sessions',
          'Go-live support',
          'Post-implementation review',
          'Ongoing maintenance plan'
        ]
      }
    ]
  }

  const generateSuccessMetrics = () => {
    return [
      {
        metric: 'Implementation Timeline',
        target: 'On-time delivery within agreed schedule',
        measurement: 'Project milestones and completion dates'
      },
      {
        metric: 'Budget Adherence',
        target: 'Delivery within approved budget',
        measurement: 'Actual vs. budgeted costs'
      },
      {
        metric: 'User Adoption',
        target: '90% user adoption within 30 days',
        measurement: 'User activity and engagement metrics'
      },
      {
        metric: 'Performance Improvement',
        target: '25% improvement in key processes',
        measurement: 'Before/after performance benchmarks'
      },
      {
        metric: 'Customer Satisfaction',
        target: '95% satisfaction rating',
        measurement: 'Post-implementation survey results'
      }
    ]
  }

  const generateNextSteps = () => {
    return `To proceed with this proposal, we recommend the following next steps:

**1. Proposal Review (1-2 weeks)**
• Review proposal details with your team
• Schedule clarification meetings if needed
• Finalize any customization requirements

**2. Contract Negotiation (1 week)**
• Finalize terms and conditions
• Execute service agreement
• Establish project governance structure

**3. Project Initiation (1 week)**
• Project kickoff meeting
• Team introductions and role definitions
• Detailed project planning session

**4. Implementation Start**
• Begin Phase 1 activities
• Establish regular communication cadence
• Monitor progress against milestones

We are excited about the opportunity to partner with ${customVariables.customer_name || 'your organization'} and look forward to delivering exceptional results.`
  }

  const generateLineItems = () => {
    const baseValue = Number(customVariables.deal_value) || 10000
    return [
      {
        description: 'Discovery and Analysis Phase',
        quantity: 1,
        rate: Math.round(baseValue * 0.2),
        total: Math.round(baseValue * 0.2)
      },
      {
        description: 'Solution Design and Architecture',
        quantity: 1,
        rate: Math.round(baseValue * 0.25),
        total: Math.round(baseValue * 0.25)
      },
      {
        description: 'Implementation and Configuration',
        quantity: 1,
        rate: Math.round(baseValue * 0.4),
        total: Math.round(baseValue * 0.4)
      },
      {
        description: 'Testing and Quality Assurance',
        quantity: 1,
        rate: Math.round(baseValue * 0.1),
        total: Math.round(baseValue * 0.1)
      },
      {
        description: 'Training and Documentation',
        quantity: 1,
        rate: Math.round(baseValue * 0.05),
        total: Math.round(baseValue * 0.05)
      }
    ]
  }

  const generatePricingOptions = () => {
    const baseValue = Number(customVariables.deal_value) || 10000
    return [
      {
        name: 'Standard Package',
        description: 'Core implementation with essential features',
        price: baseValue,
        features: [
          'Basic implementation',
          'Standard training',
          '3 months support',
          'Documentation'
        ]
      },
      {
        name: 'Premium Package',
        description: 'Enhanced implementation with advanced features',
        price: Math.round(baseValue * 1.3),
        features: [
          'Advanced implementation',
          'Comprehensive training',
          '6 months support',
          'Custom integrations',
          'Performance optimization'
        ]
      },
      {
        name: 'Enterprise Package',
        description: 'Full-scale implementation with premium support',
        price: Math.round(baseValue * 1.6),
        features: [
          'Enterprise implementation',
          'Executive training',
          '12 months support',
          'Custom development',
          'Dedicated account manager',
          'Priority support'
        ]
      }
    ]
  }

  const generatePaymentTerms = () => {
    return {
      schedule: [
        { milestone: 'Contract Signing', percentage: 25, description: 'Initial payment upon contract execution' },
        { milestone: 'Design Approval', percentage: 25, description: 'Payment upon solution design approval' },
        { milestone: 'Implementation Complete', percentage: 35, description: 'Payment upon successful implementation' },
        { milestone: 'Go-Live', percentage: 15, description: 'Final payment upon project completion' }
      ],
      terms: [
        'Net 30 payment terms',
        'Late payment fee: 1.5% per month',
        'All payments in USD',
        'Wire transfer or ACH preferred'
      ]
    }
  }

  const handleVariableChange = (key: string, value: string) => {
    setCustomVariables(prev => ({ ...prev, [key]: value }))
    setProposal(prev => ({ ...prev, variables: { ...prev.variables, [key]: value } }))
  }

  // Financial calculation functions
  const calculateShippingCost = (method: string, weight: number = 1, distance: number = 100): number => {
    const shippingRates = {
      standard: 5.99 + (weight * 0.5) + (distance * 0.02),
      express: 12.99 + (weight * 1.0) + (distance * 0.05),
      overnight: 24.99 + (weight * 2.0) + (distance * 0.10),
      international: 35.99 + (weight * 3.0) + (distance * 0.15)
    }
    return Math.round((shippingRates[method as keyof typeof shippingRates] || shippingRates.standard) * 100) / 100
  }

  const calculateProfitAmount = (costBasis: number, margin: number): number => {
    return Math.round(costBasis * margin * 100) / 100
  }

  const calculateTaxAmount = (subtotal: number, rate: number): number => {
    return Math.round(subtotal * rate * 100) / 100
  }

  const updateFinancialSummary = () => {
    const subtotal = proposal.totalValue || 0
    const taxAmount = calculateTaxAmount(subtotal, taxRate)
    const profitAmount = calculateProfitAmount(costBasis || subtotal * 0.7, profitMargin)
    const totalAmount = subtotal + taxAmount + shippingCost

    const summary: FinancialSummary = {
      subtotal,
      taxRate,
      taxAmount,
      shippingCost,
      profitAmount,
      totalAmount,
      profitMargin
    }

    setFinancialSummary(summary)
    setProposal(prev => ({
      ...prev,
      subtotal,
      taxRate,
      shippingCost,
      profitMargin,
      totalValue: totalAmount
    }))
  }

  // Update financial calculations when values change
  useEffect(() => {
    updateFinancialSummary()
  }, [proposal.totalValue, shippingCost, taxRate, profitMargin, costBasis])

  const handleShippingMethodChange = (method: string) => {
    setShippingMethod(method)
    const newShippingCost = calculateShippingCost(method)
    setShippingCost(newShippingCost)
  }

  // Validation functions
  const validateProposalTitle = (title: string): string | null => {
    if (!title.trim()) return 'Proposal title is required'
    if (title.length < 3) return 'Title must be at least 3 characters long'
    if (title.length > 100) return 'Title must be less than 100 characters'
    return null
  }

  const validateProposalDescription = (description: string): string | null => {
    if (!description.trim()) return 'Proposal description is required'
    if (description.length < 10) return 'Description must be at least 10 characters long'
    if (description.length > 1000) return 'Description must be less than 1000 characters'
    return null
  }

  const validateTotalValue = (value: number): string | null => {
    if (isNaN(value) || value < 0) return 'Total value must be a positive number'
    if (value === 0) return 'Total value cannot be zero'
    if (value > 10000000) return 'Total value seems unreasonably high'
    return null
  }

  const validateTaxRate = (rate: number): string | null => {
    if (isNaN(rate) || rate < 0) return 'Tax rate must be a positive number'
    if (rate > 1) return 'Tax rate cannot exceed 100%'
    return null
  }

  const validateProfitMargin = (margin: number): string | null => {
    if (isNaN(margin) || margin < 0) return 'Profit margin must be a positive number'
    if (margin > 1) return 'Profit margin cannot exceed 100%'
    return null
  }

  const validateShippingCost = (cost: number): string | null => {
    if (isNaN(cost) || cost < 0) return 'Shipping cost must be a positive number'
    if (cost > 10000) return 'Shipping cost seems unreasonably high'
    return null
  }

  const validateCostBasis = (cost: number): string | null => {
    if (isNaN(cost) || cost < 0) return 'Cost basis must be a positive number'
    if (cost > proposal.totalValue) return 'Cost basis cannot exceed total value'
    return null
  }

  const validateValidUntil = (date: Date): string | null => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return 'Valid until date cannot be in the past'
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 2)
    if (date > maxDate) return 'Valid until date cannot be more than 2 years in the future'
    return null
  }

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate title
    const titleError = validateProposalTitle(proposal.title)
    if (titleError) errors.title = titleError

    // Validate description
    const descriptionError = validateProposalDescription(proposal.description)
    if (descriptionError) errors.description = descriptionError

    // Validate total value
    const totalValueError = validateTotalValue(proposal.totalValue)
    if (totalValueError) errors.totalValue = totalValueError

    // Validate tax rate
    const taxRateError = validateTaxRate(taxRate)
    if (taxRateError) errors.taxRate = taxRateError

    // Validate profit margin
    const profitMarginError = validateProfitMargin(profitMargin)
    if (profitMarginError) errors.profitMargin = profitMarginError

    // Validate shipping cost
    const shippingCostError = validateShippingCost(shippingCost)
    if (shippingCostError) errors.shippingCost = shippingCostError

    // Validate cost basis
    const costBasisError = validateCostBasis(costBasis)
    if (costBasisError) errors.costBasis = costBasisError

    // Validate valid until date
    const validUntilError = validateValidUntil(proposal.validUntil)
    if (validUntilError) errors.validUntil = validUntilError

    // Validate customer and template selection
    if (!customer?.id) errors.customer = 'Customer selection is required'
    if (!template?.id) errors.template = 'Template selection is required'

    setValidationErrors(errors)
    const isValid = Object.keys(errors).length === 0
    setIsFormValid(isValid)
    return isValid
  }

  // Real-time validation on field changes
  useEffect(() => {
    validateAllFields()
  }, [proposal.title, proposal.description, proposal.totalValue, proposal.validUntil, taxRate, profitMargin, shippingCost, costBasis, customer, template])

  const handleSuggestionToggle = (section: string, suggestion: string) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [section]: prev[section]?.includes(suggestion)
        ? prev[section].filter(s => s !== suggestion)
        : [...(prev[section] || []), suggestion]
    }))
  }

  const handleSave = () => {
    if (onSave) {
      onSave(proposal)
      toast.success('Proposal saved successfully')
    }
  }

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate({ ...proposal, content: generatedContent as Record<string, unknown> })
      toast.success('Proposal generated and ready to send')
    }
  }

  const exportProposal = () => {
    const dataStr = JSON.stringify({ ...proposal, content: Object.values(generatedContent).join('\n\n') }, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${proposal.title.replace(/\s+/g, '_')}_proposal.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('Proposal exported successfully')
  }

  const checkProposalCompleteness = () => {
    const issues = []
    
    // Check required proposal fields
    if (!proposal.title?.trim()) issues.push('Proposal title is required')
    if (!proposal.description?.trim()) issues.push('Proposal description is required')
    if (!proposal.totalValue || proposal.totalValue <= 0) issues.push('Valid total value is required')
    if (!proposal.validUntil) issues.push('Valid until date is required')
    
    // Check customer information
    if (!customer) issues.push('Customer information is required')
    else {
      if (!customer.name?.trim()) issues.push('Customer name is required')
      if (!customer.email?.trim()) issues.push('Customer email is required')
    }
    
    // Check generated content
    if (!generatedContent.executive_summary) issues.push('Executive summary must be generated')
    
    // Check financial calculations
    if (costBasis <= 0) issues.push('Valid cost basis is required')
    if (profitMargin < 0 || profitMargin > 100) issues.push('Profit margin must be between 0-100%')
    if (taxRate < 0 || taxRate > 50) issues.push('Tax rate must be between 0-50%')
    if (shippingCost < 0) issues.push('Shipping cost cannot be negative')
    
    return issues
  }

  const downloadProposalPDF = () => {
    try {
      // Check proposal completeness
      const completenessIssues = checkProposalCompleteness()
      if (completenessIssues.length > 0) {
        toast.error(`Proposal incomplete: ${completenessIssues[0]}`)
        return
      }

      const proposalData = {
        proposal: {
          id: proposal.id || '',
          title: proposal.title,
          deal_id: proposal.dealId || '',
          customer_id: proposal.customerId,
          content: Object.values(generatedContent).join('\n\n'),
          status: proposal.status as 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected',
          valid_until: proposal.validUntil.toISOString().split('T')[0],
          source: 'generator',
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          currency: 'USD',
          delivery_method: 'email',
          responsible_person: 'Mr. Ali' as 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed',
          proposal_type: 'standard',
          validity_period: 30
        },
        deal,
        customer,
        financialSummary,
        shippingMethod,
        profitMargin,
        taxRate
      }

      generateProposalPDF(proposalData, {
        template: 'modern',
        branding: {
          companyName: 'Nawras CRM',
          address: '123 Business Street, City, State 12345',
          phone: '+1 (555) 123-4567',
          email: 'info@nawrascrm.com',
          website: 'www.nawrascrm.com'
        }
      })
      
      toast.success('Proposal PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating proposal PDF:', error)
      toast.error('Failed to generate proposal PDF')
    }
  }

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6" />
            AI Proposal Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Generate professional proposals with AI-powered content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportProposal} disabled={!generatedContent.executive_summary}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={proposal.status === 'generating'}>
            <FileText className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleGenerate} disabled={proposal.status === 'generating'} className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4 mr-2" />
            Generate & Send
          </Button>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Generating Proposal Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(generationStep + 1) / GENERATION_STEPS.length * 100} className="w-full" />
            <div className="space-y-2">
              {GENERATION_STEPS.map((step, index) => (
                <div key={step.id} className={cn(
                  "flex items-center space-x-3 p-2 rounded-lg",
                  index < generationStep ? "bg-green-50 text-green-700" :
                  index === generationStep ? "bg-blue-50 text-blue-700" :
                  "bg-gray-50 text-gray-500"
                )}>
                  {index < generationStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : index === generationStep ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <div>
                    <div className="font-medium">{step.label}</div>
                    <div className="text-sm opacity-75">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Proposal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="proposal-title">Title</Label>
                <Input
                  id="proposal-title"
                  value={proposal.title}
                  onChange={(e) => setProposal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter proposal title"
                  className={validationErrors.title ? "border-red-500" : ""}
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
                )}
              </div>
              <div>
                <Label htmlFor="proposal-description">Description</Label>
                <Textarea
                  id="proposal-description"
                  value={proposal.description}
                  onChange={(e) => setProposal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the proposal"
                  rows={3}
                  className={validationErrors.description ? "border-red-500" : ""}
                />
                {validationErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                )}
              </div>
              <div>
                <Label htmlFor="total-value">Total Value</Label>
                <Input
                  id="total-value"
                  type="number"
                  value={proposal.totalValue}
                  onChange={(e) => setProposal(prev => ({ ...prev, totalValue: Number(e.target.value) }))}
                  placeholder="0"
                  className={validationErrors.totalValue ? "border-red-500" : ""}
                />
                {validationErrors.totalValue && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.totalValue}</p>
                )}
              </div>
              <div>
                <Label htmlFor="valid-until">Valid Until</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={proposal.validUntil.toISOString().split('T')[0]}
                  onChange={(e) => setProposal(prev => ({ ...prev, validUntil: new Date(e.target.value) }))}
                  className={validationErrors.validUntil ? "border-red-500" : ""}
                />
                {validationErrors.validUntil && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.validUntil}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(customVariables).slice(0, 8).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`var-${key}`} className="text-xs">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <Input
                    id={`var-${key}`}
                    value={String(value)}
                    onChange={(e) => handleVariableChange(key, e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Financial Calculations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Financial Calculations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cost-basis">Cost Basis</Label>
                <Input
                  id="cost-basis"
                  type="number"
                  value={costBasis}
                  onChange={(e) => setCostBasis(Number(e.target.value))}
                  placeholder="Enter cost basis"
                  className={validationErrors.costBasis ? "border-red-500" : ""}
                />
                {validationErrors.costBasis && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.costBasis}</p>
                )}
              </div>
              <div>
                <Label htmlFor="profit-margin">Profit Margin (%)</Label>
                <Input
                  id="profit-margin"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={profitMargin * 100}
                  onChange={(e) => setProfitMargin(Number(e.target.value) / 100)}
                  placeholder="25"
                  className={validationErrors.profitMargin ? "border-red-500" : ""}
                />
                {validationErrors.profitMargin && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.profitMargin}</p>
                )}
              </div>
              <div>
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate * 100}
                  onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
                  placeholder="8"
                  className={validationErrors.taxRate ? "border-red-500" : ""}
                />
                {validationErrors.taxRate && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.taxRate}</p>
                )}
              </div>
              <div>
                <Label htmlFor="shipping-method">Shipping Method</Label>
                <select
                  id="shipping-method"
                  value={shippingMethod}
                  onChange={(e) => handleShippingMethodChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard ($5.99 base)</option>
                  <option value="express">Express ($12.99 base)</option>
                  <option value="overnight">Overnight ($24.99 base)</option>
                  <option value="international">International ($35.99 base)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="shipping-cost">Shipping Cost</Label>
                <Input
                  id="shipping-cost"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  placeholder="0"
                  className={validationErrors.shippingCost ? "border-red-500" : ""}
                />
                {validationErrors.shippingCost && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.shippingCost}</p>
                )}
              </div>
              
              {/* Financial Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${financialSummary.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({(financialSummary.taxRate * 100).toFixed(1)}%):</span>
                  <span>${financialSummary.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>${financialSummary.shippingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Profit ({(financialSummary.profitMargin * 100).toFixed(1)}%):</span>
                  <span>${financialSummary.profitAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>${financialSummary.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(CONTENT_SUGGESTIONS).map(([section, suggestions]) => (
                <div key={section}>
                  <Label className="text-xs font-medium">
                    {section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <div className="space-y-1 mt-1">
                    {suggestions.map(suggestion => (
                      <label key={suggestion} className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions[section]?.includes(suggestion) || false}
                          onChange={() => handleSuggestionToggle(section, suggestion)}
                          className="rounded"
                        />
                        <span>{suggestion}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={generateContent}
            disabled={isGenerating || !isFormValid}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </Button>
          {!isFormValid && Object.keys(validationErrors).length > 0 && (
            <p className="text-red-500 text-xs mt-2 text-center">
              Please fix validation errors before generating
            </p>
          )}
          
          {/* Download PDF Button */}
           {generatedContent.executive_summary && (
             <Button
               onClick={downloadProposalPDF}
               variant="outline"
               className="w-full"
               size="lg"
             >
               <Download className="h-4 w-4 mr-2" />
               Download PDF
             </Button>
           )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={cn(
                    proposal.status === 'draft' && "bg-gray-100 text-gray-800",
                    proposal.status === 'generating' && "bg-blue-100 text-blue-800",
                    proposal.status === 'ready' && "bg-green-100 text-green-800",
                    proposal.status === 'sent' && "bg-purple-100 text-purple-800"
                  )}>
                    {proposal.status === 'draft' && <FileText className="h-3 w-3 mr-1" />}
                    {proposal.status === 'generating' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                    {proposal.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {proposal.status === 'sent' && <Send className="h-3 w-3 mr-1" />}
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {proposal.status === 'draft' && 'Ready to generate content'}
                    {proposal.status === 'generating' && 'AI is creating your proposal...'}
                    {proposal.status === 'ready' && 'Proposal ready to send'}
                    {proposal.status === 'sent' && 'Proposal has been sent'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  ${proposal.totalValue.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Content Preview */}
          {generatedContent.executive_summary && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Content Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Executive Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Executive Summary</h3>
                  <div className="prose max-w-none text-sm bg-gray-50 p-4 rounded-lg">
                    <div className="whitespace-pre-wrap">{generatedContent.executive_summary}</div>
                  </div>
                </div>

                {/* Solution Overview */}
                {generatedContent.solution_overview && (
                  <div>
                    <h3 className="font-semibold mb-2">Solution Overview</h3>
                    <div className="prose max-w-none text-sm bg-gray-50 p-4 rounded-lg">
                      <div className="whitespace-pre-wrap">{generatedContent.solution_overview}</div>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                {generatedContent.pricing && (
                  <div>
                    <h3 className="font-semibold mb-2">Pricing Breakdown</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Description</th>
                              <th className="text-right py-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedContent.pricing?.line_items?.map((item: LineItem, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2">{item.description}</td>
                                <td className="text-right py-2">${item.total.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-semibold">
                              <td className="py-2">Total</td>
                              <td className="text-right py-2">
                                ${generatedContent.pricing?.line_items?.reduce((sum, item: LineItem) => sum + item.total, 0).toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Summary */}
                {generatedContent.review && (
                  <div>
                    <h3 className="font-semibold mb-2">AI Review Summary</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Content Quality Score</span>
                        <span className="text-sm font-semibold">{generatedContent.review.completeness}%</span>
                      </div>
                      <Progress value={generatedContent.review.completeness} className="mb-3" />
                      <div className="text-sm">
                        <div className="font-medium mb-1">Suggestions for improvement:</div>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {generatedContent.review?.suggestions?.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!generatedContent.executive_summary && !isGenerating && (
            <Card>
              <CardContent className="text-center py-12">
                <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600 mb-4">
                  Configure your proposal details and click "Generate Content" to create a professional proposal with AI
                </p>
                <Button onClick={generateContent} disabled={isGenerating}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Start Generating
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProposalGenerator