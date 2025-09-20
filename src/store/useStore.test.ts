import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'
import { act, renderHook } from '@testing-library/react'

// Mock data
const mockCustomer = {
  id: 'customer-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  address: '123 Main St',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1'
}

const mockLead = {
  id: 'lead-1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+1987654321',
  company: 'Tech Inc',
  status: 'new' as const,
  source: 'website',
  notes: 'Interested in our services',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1'
}

const mockDeal = {
  id: 'deal-1',
  title: 'Big Sale',
  amount: 10000,
  stage: 'proposal' as const,
  probability: 75,
  expected_close_date: '2024-12-31',
  customer_id: 'customer-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1'
}

const mockProposal = {
  id: 'proposal-1',
  title: 'Service Proposal',
  content: 'Detailed proposal content',
  amount: 5000,
  status: 'draft' as const,
  customer_id: 'customer-1',
  deal_id: 'deal-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1'
}

const mockInvoice = {
  id: 'invoice-1',
  invoice_number: 'INV-001',
  amount: 1000,
  status: 'pending' as const,
  due_date: '2024-02-01',
  customer_id: 'customer-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1'
}

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useStore())
    act(() => {
      result.current.setCustomers([])
      result.current.setLeads([])
      result.current.setDeals([])
      result.current.setProposals([])
      result.current.setInvoices([])
      result.current.setLoading(false)
    })
  })

  describe('loading state', () => {
    it('should initialize with loading false', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.loading).toBe(false)
    })

    it('should update loading state', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.loading).toBe(true)
      
      act(() => {
        result.current.setLoading(false)
      })
      
      expect(result.current.loading).toBe(false)
    })
  })

  describe('customers', () => {
    it('should initialize with empty customers array', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.customers).toEqual([])
    })

    it('should set customers', () => {
      const { result } = renderHook(() => useStore())
      const customers = [mockCustomer]
      
      act(() => {
        result.current.setCustomers(customers)
      })
      
      expect(result.current.customers).toEqual(customers)
    })

    it('should add customer', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addCustomer(mockCustomer)
      })
      
      expect(result.current.customers).toHaveLength(1)
      expect(result.current.customers[0]).toEqual(mockCustomer)
    })

    it('should update customer', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addCustomer(mockCustomer)
      })
      
      const updates = { name: 'Updated Name', email: 'updated@example.com' }
      
      act(() => {
        result.current.updateCustomer(mockCustomer.id, updates)
      })
      
      expect(result.current.customers[0].name).toBe('Updated Name')
      expect(result.current.customers[0].email).toBe('updated@example.com')
      expect(result.current.customers[0].id).toBe(mockCustomer.id)
    })

    it('should remove customer', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addCustomer(mockCustomer)
      })
      
      expect(result.current.customers).toHaveLength(1)
      
      act(() => {
        result.current.removeCustomer(mockCustomer.id)
      })
      
      expect(result.current.customers).toHaveLength(0)
    })

    it('should not update non-existent customer', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addCustomer(mockCustomer)
      })
      
      act(() => {
        result.current.updateCustomer('non-existent-id', { name: 'Updated' })
      })
      
      expect(result.current.customers[0].name).toBe(mockCustomer.name)
    })
  })

  describe('leads', () => {
    it('should manage leads correctly', () => {
      const { result } = renderHook(() => useStore())
      
      // Add lead
      act(() => {
        result.current.addLead(mockLead)
      })
      
      expect(result.current.leads).toHaveLength(1)
      expect(result.current.leads[0]).toEqual(mockLead)
      
      // Update lead
      act(() => {
        result.current.updateLead(mockLead.id, { status: 'qualified' })
      })
      
      expect(result.current.leads[0].status).toBe('qualified')
      
      // Remove lead
      act(() => {
        result.current.removeLead(mockLead.id)
      })
      
      expect(result.current.leads).toHaveLength(0)
    })

    it('should set multiple leads', () => {
      const { result } = renderHook(() => useStore())
      const leads = [mockLead, { ...mockLead, id: 'lead-2', name: 'Another Lead' }]
      
      act(() => {
        result.current.setLeads(leads)
      })
      
      expect(result.current.leads).toHaveLength(2)
      expect(result.current.leads).toEqual(leads)
    })
  })

  describe('deals', () => {
    it('should manage deals correctly', () => {
      const { result } = renderHook(() => useStore())
      
      // Add deal
      act(() => {
        result.current.addDeal(mockDeal)
      })
      
      expect(result.current.deals).toHaveLength(1)
      expect(result.current.deals[0]).toEqual(mockDeal)
      
      // Update deal
      act(() => {
        result.current.updateDeal(mockDeal.id, { stage: 'closed_won', amount: 15000 })
      })
      
      expect(result.current.deals[0].stage).toBe('closed_won')
      expect(result.current.deals[0].amount).toBe(15000)
      
      // Remove deal
      act(() => {
        result.current.removeDeal(mockDeal.id)
      })
      
      expect(result.current.deals).toHaveLength(0)
    })
  })

  describe('proposals', () => {
    it('should manage proposals correctly', () => {
      const { result } = renderHook(() => useStore())
      
      // Add proposal
      act(() => {
        result.current.addProposal(mockProposal)
      })
      
      expect(result.current.proposals).toHaveLength(1)
      expect(result.current.proposals[0]).toEqual(mockProposal)
      
      // Update proposal
      act(() => {
        result.current.updateProposal(mockProposal.id, { status: 'sent', amount: 6000 })
      })
      
      expect(result.current.proposals[0].status).toBe('sent')
      expect(result.current.proposals[0].amount).toBe(6000)
      
      // Remove proposal
      act(() => {
        result.current.removeProposal(mockProposal.id)
      })
      
      expect(result.current.proposals).toHaveLength(0)
    })
  })

  describe('invoices', () => {
    it('should manage invoices correctly', () => {
      const { result } = renderHook(() => useStore())
      
      // Add invoice
      act(() => {
        result.current.addInvoice(mockInvoice)
      })
      
      expect(result.current.invoices).toHaveLength(1)
      expect(result.current.invoices[0]).toEqual(mockInvoice)
      
      // Update invoice
      act(() => {
        result.current.updateInvoice(mockInvoice.id, { status: 'paid', amount: 1200 })
      })
      
      expect(result.current.invoices[0].status).toBe('paid')
      expect(result.current.invoices[0].amount).toBe(1200)
      
      // Remove invoice
      act(() => {
        result.current.removeInvoice(mockInvoice.id)
      })
      
      expect(result.current.invoices).toHaveLength(0)
    })
  })

  describe('multiple operations', () => {
    it('should handle multiple entities independently', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addCustomer(mockCustomer)
        result.current.addLead(mockLead)
        result.current.addDeal(mockDeal)
        result.current.addProposal(mockProposal)
        result.current.addInvoice(mockInvoice)
      })
      
      expect(result.current.customers).toHaveLength(1)
      expect(result.current.leads).toHaveLength(1)
      expect(result.current.deals).toHaveLength(1)
      expect(result.current.proposals).toHaveLength(1)
      expect(result.current.invoices).toHaveLength(1)
      
      // Remove one type shouldn't affect others
      act(() => {
        result.current.removeCustomer(mockCustomer.id)
      })
      
      expect(result.current.customers).toHaveLength(0)
      expect(result.current.leads).toHaveLength(1)
      expect(result.current.deals).toHaveLength(1)
      expect(result.current.proposals).toHaveLength(1)
      expect(result.current.invoices).toHaveLength(1)
    })
  })
})