import { create } from 'zustand'
import type { Database } from '../lib/database.types'

type Customer = Database['public']['Tables']['customers']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Deal = Database['public']['Tables']['deals']['Row']
type Proposal = Database['public']['Tables']['proposals']['Row']
type Invoice = Database['public']['Tables']['invoices']['Row']

interface Store {
  // Loading state
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // Customers
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  removeCustomer: (id: string) => void
  
  // Leads
  leads: Lead[]
  setLeads: (leads: Lead[]) => void
  addLead: (lead: Lead) => void
  updateLead: (id: string, lead: Partial<Lead>) => void
  removeLead: (id: string) => void
  
  // Deals
  deals: Deal[]
  setDeals: (deals: Deal[]) => void
  addDeal: (deal: Deal) => void
  updateDeal: (id: string, deal: Partial<Deal>) => void
  removeDeal: (id: string) => void
  
  // Proposals
  proposals: Proposal[]
  setProposals: (proposals: Proposal[]) => void
  addProposal: (proposal: Proposal) => void
  updateProposal: (id: string, proposal: Partial<Proposal>) => void
  removeProposal: (id: string) => void
  
  // Invoices
  invoices: Invoice[]
  setInvoices: (invoices: Invoice[]) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  removeInvoice: (id: string) => void
}

export const useStore = create<Store>((set) => ({
  // Loading state
  loading: false,
  setLoading: (loading) => set({ loading }),
  
  // Customers
  customers: [],
  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (id, customer) => set((state) => ({
    customers: state.customers.map(c => 
      c.id === id ? { ...c, ...customer } : c
    )
  })),
  removeCustomer: (id) => set((state) => ({
    customers: state.customers.filter(c => c.id !== id)
  })),

  // Leads
  leads: [],
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [...state.leads, lead] })),
  updateLead: (id, lead) => set((state) => ({
    leads: state.leads.map(l => 
      l.id === id ? { ...l, ...lead } : l
    )
  })),
  removeLead: (id) => set((state) => ({
    leads: state.leads.filter(l => l.id !== id)
  })),

  // Deals
  deals: [],
  setDeals: (deals) => set({ deals }),
  addDeal: (deal) => set((state) => ({ deals: [...state.deals, deal] })),
  updateDeal: (id, deal) => set((state) => ({
    deals: state.deals.map(d => 
      d.id === id ? { ...d, ...deal } : d
    )
  })),
  removeDeal: (id) => set((state) => ({
    deals: state.deals.filter(d => d.id !== id)
  })),

  // Proposals
  proposals: [],
  setProposals: (proposals) => set({ proposals }),
  addProposal: (proposal) => set((state) => ({ proposals: [...state.proposals, proposal] })),
  updateProposal: (id, proposal) => set((state) => ({
    proposals: state.proposals.map(p => 
      p.id === id ? { ...p, ...proposal } : p
    )
  })),
  removeProposal: (id) => set((state) => ({
    proposals: state.proposals.filter(p => p.id !== id)
  })),

  // Invoices
  invoices: [],
  setInvoices: (invoices) => set({ invoices }),
  addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, invoice] })),
  updateInvoice: (id, invoice) => set((state) => ({
    invoices: state.invoices.map(i => 
      i.id === id ? { ...i, ...invoice } : i
    )
  })),
  removeInvoice: (id) => set((state) => ({
    invoices: state.invoices.filter(i => i.id !== id)
  }))
}))