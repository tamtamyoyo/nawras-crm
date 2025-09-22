// Demo data for comprehensive testing of Nawras CRM
import { toast } from 'sonner'
import { offlineDataService } from '../services/offlineDataService'


export interface DemoCustomer {
  name: string
  email: string
  phone: string
  company: string
  address: string
  status: 'prospect' | 'active' | 'inactive'
  notes: string
}

export interface DemoLead {
  title: string
  status: 'new' | 'qualified' | 'converted' | 'lost'
  value: number
  notes: string
  customer_name: string
}

export interface DemoDeal {
  title: string
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  value: number
  expected_close_date: string
  notes: string
  customer_name: string
}

export interface ProposalContent {
  sections: Array<{
    title: string
    content: string
  }>
}

export interface DemoProposal {
  title: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  total_amount: number
  content: ProposalContent
  customer_name: string
}

export interface DemoInvoice {
  invoice_number: string
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  due_date: string
  customer_name: string
}

// Demo Customers Data
export const demoCustomers: DemoCustomer[] = [
  {
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0101',
    company: 'Acme Corporation',
    address: '123 Business Ave, New York, NY 10001',
    status: 'active',
    notes: 'Large enterprise client with multiple departments. Primary contact is John Smith.'
  },
  {
    name: 'Tech Innovations LLC',
    email: 'info@techinnovations.com',
    phone: '+1-555-0102',
    company: 'Tech Innovations LLC',
    address: '456 Silicon Valley Blvd, San Francisco, CA 94105',
    status: 'prospect',
    notes: 'Startup company interested in our premium package. Follow up scheduled for next week.'
  },
  {
    name: 'Global Solutions Inc',
    email: 'sales@globalsolutions.com',
    phone: '+1-555-0103',
    company: 'Global Solutions Inc',
    address: '789 International Dr, Chicago, IL 60601',
    status: 'active',
    notes: 'Long-term client since 2020. Excellent payment history and high satisfaction scores.'
  },
  {
    name: 'StartupXYZ',
    email: 'hello@startupxyz.com',
    phone: '+1-555-0104',
    company: 'StartupXYZ',
    address: '321 Entrepreneur St, Austin, TX 78701',
    status: 'inactive',
    notes: 'Former client. Contract ended in 2023. May be interested in new services.'
  },
  {
    name: 'Enterprise Dynamics',
    email: 'procurement@entdynamics.com',
    phone: '+1-555-0105',
    company: 'Enterprise Dynamics',
    address: '654 Corporate Plaza, Boston, MA 02101',
    status: 'prospect',
    notes: 'Large enterprise evaluating multiple vendors. Decision expected by end of quarter.'
  }
]

// Demo Leads Data
export const demoLeads: DemoLead[] = [
  {
    title: 'Enterprise Software License',
    status: 'new',
    value: 50000,
    notes: 'Inbound lead from website contact form. Interested in enterprise package.',
    customer_name: 'Tech Innovations LLC'
  },
  {
    title: 'Cloud Migration Project',
    status: 'qualified',
    value: 75000,
    notes: 'Qualified lead with budget approved. Technical requirements gathering in progress.',
    customer_name: 'Enterprise Dynamics'
  },
  {
    title: 'Additional User Licenses',
    status: 'converted',
    value: 25000,
    notes: 'Successfully converted to deal. Existing customer expanding their usage.',
    customer_name: 'Acme Corporation'
  },
  {
    title: 'Consulting Services',
    status: 'lost',
    value: 30000,
    notes: 'Lost to competitor due to pricing. Keep for future opportunities.',
    customer_name: 'StartupXYZ'
  }
]

// Demo Deals Data
export const demoDeals: DemoDeal[] = [
  {
    title: 'Q1 Software Renewal',
    stage: 'negotiation',
    value: 120000,
    expected_close_date: '2024-03-31',
    notes: 'Annual renewal with 20% increase. Negotiating terms.',
    customer_name: 'Global Solutions Inc'
  },
  {
    title: 'New Implementation Project',
    stage: 'proposal',
    value: 85000,
    expected_close_date: '2024-02-15',
    notes: 'Proposal sent. Waiting for client feedback and approval.',
    customer_name: 'Enterprise Dynamics'
  },
  {
    title: 'Expansion Package',
    stage: 'closed_won',
    value: 45000,
    expected_close_date: '2024-01-15',
    notes: 'Successfully closed. Implementation starts next month.',
    customer_name: 'Acme Corporation'
  },
  {
    title: 'Pilot Program',
    stage: 'prospecting',
    value: 15000,
    expected_close_date: '2024-04-30',
    notes: 'Initial discussions ongoing. Pilot program proposed.',
    customer_name: 'Tech Innovations LLC'
  }
]

// Demo Proposals Data
export const demoProposals: DemoProposal[] = [
  {
    title: 'Enterprise Software Implementation',
    status: 'sent',
    total_amount: 85000,
    content: {
      sections: [
        { title: 'Executive Summary', content: 'Comprehensive software solution for enterprise needs.' },
        { title: 'Technical Specifications', content: 'Detailed technical requirements and implementation plan.' },
        { title: 'Timeline', content: '6-month implementation timeline with key milestones.' },
        { title: 'Investment', content: 'Total investment of $85,000 including setup and training.' }
      ]
    },
    customer_name: 'Enterprise Dynamics'
  },
  {
    title: 'Cloud Migration Services',
    status: 'draft',
    total_amount: 65000,
    content: {
      sections: [
        { title: 'Migration Strategy', content: 'Phased approach to cloud migration.' },
        { title: 'Risk Assessment', content: 'Comprehensive risk analysis and mitigation strategies.' },
        { title: 'Cost Analysis', content: 'Detailed breakdown of migration costs and ROI.' }
      ]
    },
    customer_name: 'Global Solutions Inc'
  },
  {
    title: 'Consulting Package',
    status: 'accepted',
    total_amount: 35000,
    content: {
      sections: [
        { title: 'Scope of Work', content: '3-month consulting engagement.' },
        { title: 'Deliverables', content: 'Weekly reports and final recommendations.' },
        { title: 'Terms', content: 'Net 30 payment terms with milestone payments.' }
      ]
    },
    customer_name: 'Acme Corporation'
  }
]

// Demo Invoices Data
export const demoInvoices: DemoInvoice[] = [
  {
    invoice_number: 'INV-2024-001',
    total_amount: 35000,
    status: 'paid',
    due_date: '2024-02-15',
    customer_name: 'Acme Corporation'
  },
  {
    invoice_number: 'INV-2024-002',
    total_amount: 65000,
    status: 'sent',
    due_date: '2024-02-28',
    customer_name: 'Global Solutions Inc'
  },
  {
    invoice_number: 'INV-2024-003',
    total_amount: 25000,
    status: 'overdue',
    due_date: '2024-01-31',
    customer_name: 'StartupXYZ'
  },
  {
    invoice_number: 'INV-2024-004',
    total_amount: 15000,
    status: 'draft',
    due_date: '2024-03-15',
    customer_name: 'Tech Innovations LLC'
  }
]

// Utility function to add demo data
export const addDemoData = async (userId: string) => {
  try {
    console.log('🚀 Starting demo data insertion...')
    
    // Check if we're in offline mode
    if (true) { // Offline mode enabled for demo
      console.log('📱 Using offline mode - adding data to local storage')
      
      // Add customers first
      console.log('👥 Adding demo customers...')
      const customerInserts = demoCustomers.map(customer => ({
        ...customer,
        created_by: userId
      }))
      
      const customers = []
      for (const customer of customerInserts) {
        const newCustomer = await offlineDataService.createCustomer(customer as any)
        customers.push(newCustomer)
      }
      console.log(`✅ Added ${customers.length} customers`)
      
      // Create customer name to ID mapping
      const customerMap = new Map()
      customers.forEach(customer => {
        customerMap.set(customer.name, customer.id)
      })
      
      // Add leads
      console.log('🎯 Adding demo leads...')
      const leads = []
      for (const lead of demoLeads) {
        const newLead = await offlineDataService.createLead({
          title: lead.title,
          status: lead.status,
          value: lead.value,
          notes: lead.notes,
          customer_id: customerMap.get(lead.customer_name),
          created_by: userId
        } as any)
        leads.push(newLead)
      }
      console.log(`✅ Added ${leads.length} leads`)
      
      // Add deals
      console.log('💼 Adding demo deals...')
      const deals = []
      for (const deal of demoDeals) {
        const newDeal = await offlineDataService.createDeal({
          title: deal.title,
          stage: deal.stage,
          value: deal.value,
          expected_close_date: deal.expected_close_date,
          notes: deal.notes,
          customer_id: customerMap.get(deal.customer_name),
          created_by: userId
        } as any)
        deals.push(newDeal)
      }
      console.log(`✅ Added ${deals.length} deals`)
      
      // Add proposals
      console.log('📄 Adding demo proposals...')
      const proposals = []
      for (const proposal of demoProposals) {
        const newProposal = await offlineDataService.createProposal({
          title: proposal.title,
          status: proposal.status,
          total_amount: proposal.total_amount,
          content: proposal.content as any,
          customer_id: customerMap.get(proposal.customer_name),
          created_by: userId
        } as any)
        proposals.push(newProposal)
      }
      console.log(`✅ Added ${proposals.length} proposals`)
      
      // Add invoices
      console.log('🧾 Adding demo invoices...')
      const invoices = []
      for (const invoice of demoInvoices) {
        const newInvoice = await offlineDataService.createInvoice({
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          status: invoice.status,
          due_date: invoice.due_date,
          customer_id: customerMap.get(invoice.customer_name),
          created_by: userId
        } as any)
        invoices.push(newInvoice)
      }
      console.log(`✅ Added ${invoices.length} invoices`)
      
      console.log('🎉 Demo data insertion completed successfully!')
      toast.success('Demo data added successfully!')
      
      return {
        customers: customers.length,
        leads: leads.length,
        deals: deals.length,
        proposals: proposals.length,
        invoices: invoices.length
      }
    }
    
    // Fallback to Supabase if not in offline mode (this will likely fail in current setup)
    console.log('☁️ Attempting Supabase mode (may fail due to invalid URL)')
    throw new Error('Supabase not configured - using offline mode only')
    
  } catch (error) {
    console.error('❌ Error adding demo data:', error)
    toast.error('Failed to add demo data')
    throw error
  }
}

// Utility function to clear all demo data
export const clearDemoData = async () => {
  try {
    console.log('🧹 Clearing demo data...')
    
    // Check if we're in offline mode
    if (true) { // Offline mode enabled for demo
      console.log('📱 Using offline mode - clearing local storage data')
      
      // Clear all data from local storage
      offlineDataService.clearAllData()
      
      console.log('✅ Demo data cleared successfully!')
      toast.success('Demo data cleared successfully!')
      return
    }
    
    // Fallback to Supabase if not in offline mode (this will likely fail in current setup)
    console.log('☁️ Attempting Supabase mode (may fail due to invalid URL)')
    throw new Error('Supabase not configured - using offline mode only')
    
  } catch (error) {
    console.error('❌ Error clearing demo data:', error)
    toast.error('Failed to clear demo data')
    throw error
  }
}