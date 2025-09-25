import { supabase } from '@/lib/supabase-client'
import { Database, Json } from '@/lib/database.types'
import { offlineDataService } from './offlineDataService'
import { isOfflineMode, handleSupabaseError, setSupabaseOffline, protectFromExtensionInterference } from '../utils/offlineMode'
import errorHandlingService from './errorHandlingService'
import { InvoiceItem } from '@/types/invoice'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']

export interface InvoiceFormData {
  invoice_number: string
  deal_id: string
  status: string
  payment_terms: string
  due_date?: string
  source?: string
  notes?: string
  amount: number
  tax_amount: number
  total_amount: number
  tax_rate: number
  responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
  billing_address?: string
  purchase_order_number?: string
  payment_method?: string
}

class InvoiceService {
  async getInvoices(): Promise<Invoice[]> {
    const startTime = performance.now()
    
    try {
      protectFromExtensionInterference()
      console.log('📋 Loading Invoices data...', { offlineMode: isOfflineMode() })
      
      if (isOfflineMode()) {
        console.log('📋 Loading from offline storage')
        const invoicesData = await offlineDataService.getInvoices()
        return invoicesData as Invoice[]
      }
      
      try {
        console.log('📋 Querying Supabase for invoices...')
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .abortSignal(AbortSignal.timeout(10000))

        if (invoicesError) throw invoicesError
        return invoicesData || []
      } catch (supabaseError: unknown) {
        console.warn('Supabase error, falling back to offline mode:', supabaseError)
        
        const shouldFallback = handleSupabaseError(supabaseError, 'invoice data loading')
        
        if (!shouldFallback) {
          throw supabaseError
        }
        
        const invoicesData = await offlineDataService.getInvoices()
        return invoicesData as Invoice[]
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      await errorHandlingService.handleError(error, 'InvoiceService.getInvoices')
      throw error
    } finally {
      const endTime = performance.now()
      console.log(`📊 Invoice loading took ${endTime - startTime} milliseconds`)
    }
  }

  async createInvoice(data: InvoiceFormData, invoiceItems: InvoiceItem[], userId?: string): Promise<Invoice> {
    const startTime = performance.now()
    
    try {
      const invoiceData: InvoiceInsert = {
        invoice_number: data.invoice_number || this.generateInvoiceNumber(),
        customer_id: data.deal_id || '',
        deal_id: data.deal_id || null,
        amount: data.amount || 0,
        tax_amount: data.tax_amount || 0,
        total_amount: data.total_amount || 0,
        status: (data.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') || 'draft',
        due_date: data.due_date || new Date().toISOString(),
        items: JSON.stringify(invoiceItems) as Json,
        notes: data.notes,
        payment_terms: (data.payment_terms as 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt') || 'net_30',
        tax_rate: data.tax_rate,
        source: (data.source as 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other') || 'Other',
        created_by: userId || '00000000-0000-0000-0000-000000000000',
        responsible_person: data.responsible_person || 'Mr. Ali',
        billing_address: data.billing_address,
        purchase_order_number: data.purchase_order_number,
        payment_method: (data.payment_method as 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'check' | 'paypal' | 'stripe' | 'other') || 'other'
      }

      if (isOfflineMode()) {
        const newInvoiceData = { 
          ...invoiceData, 
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          responsible_person: 'Mr. Ali' as 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed',
          billing_address: null,
          purchase_order_number: null,
          payment_method: null
        }
        await offlineDataService.createInvoice(newInvoiceData as any)
        return newInvoiceData as Invoice
      }

      try {
        const { data: newData, error } = await (supabase as any)
          .from('invoices')
          .insert([invoiceData])
          .select()
          .single()

        if (error) throw error
        return newData as Invoice
      } catch (supabaseError) {
        console.warn('Supabase error, falling back to offline mode:', supabaseError)
        setSupabaseOffline()
        
        const newInvoiceData = { 
          ...invoiceData, 
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          responsible_person: 'Mr. Ali' as 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed',
          billing_address: null,
          purchase_order_number: null,
          payment_method: null
        }
        await offlineDataService.createInvoice(newInvoiceData as any)
        return newInvoiceData as Invoice
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      await errorHandlingService.handleError(error, 'InvoiceService.createInvoice')
      throw error
    } finally {
      const endTime = performance.now()
      console.log(`📊 Invoice creation took ${endTime - startTime} milliseconds`)
    }
  }

  async updateInvoice(invoiceId: string, data: InvoiceFormData, invoiceItems: InvoiceItem[], existingInvoice: Invoice): Promise<Invoice> {
    const startTime = performance.now()
    
    try {
      const invoiceData: Partial<InvoiceInsert> = {
        invoice_number: data.invoice_number,
        customer_id: data.deal_id || '',
        deal_id: data.deal_id || null,
        amount: data.amount || 0,
        tax_amount: data.tax_amount || 0,
        total_amount: data.total_amount || 0,
        status: (data.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') || 'draft',
        due_date: data.due_date,
        items: JSON.stringify(invoiceItems) as Json,
        notes: data.notes,
        payment_terms: (data.payment_terms as 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt') || 'net_30',
        tax_rate: data.tax_rate,
        source: (data.source as 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other') || 'Other',
        responsible_person: data.responsible_person,
        billing_address: data.billing_address,
        purchase_order_number: data.purchase_order_number,
        payment_method: (data.payment_method as 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'check' | 'paypal' | 'stripe' | 'other') || 'other'
      }

      if (isOfflineMode()) {
        const updateData = { 
          ...existingInvoice, 
          ...invoiceData, 
          status: invoiceData.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled', 
          payment_terms: invoiceData.payment_terms as 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt', 
          updated_at: new Date().toISOString(),
          responsible_person: existingInvoice.responsible_person || 'Mr. Ali' as 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed',
          billing_address: existingInvoice.billing_address || null,
          purchase_order_number: existingInvoice.purchase_order_number || null,
          payment_method: existingInvoice.payment_method || null
        }
        await offlineDataService.updateInvoice(invoiceId, updateData as any)
        return updateData as Invoice
      }

      try {
        const { data: updatedData, error } = await (supabase as any)
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoiceId)
          .select()
          .single()

        if (error) throw error
        return updatedData as Invoice
      } catch (supabaseError) {
        console.warn('Supabase error, falling back to offline mode:', supabaseError)
        setSupabaseOffline()
        
        const updateData = { 
          ...existingInvoice, 
          ...invoiceData, 
          status: invoiceData.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled', 
          payment_terms: invoiceData.payment_terms as 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt', 
          updated_at: new Date().toISOString(),
          responsible_person: existingInvoice.responsible_person || 'Mr. Ali' as 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed',
          billing_address: existingInvoice.billing_address || null,
          purchase_order_number: existingInvoice.purchase_order_number || null,
          payment_method: existingInvoice.payment_method || null
        }
        await offlineDataService.updateInvoice(invoiceId, updateData as any)
        return updateData as Invoice
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      await errorHandlingService.handleError(error, 'InvoiceService.updateInvoice')
      throw error
    } finally {
      const endTime = performance.now()
      console.log(`📊 Invoice update took ${endTime - startTime} milliseconds`)
    }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const startTime = performance.now()
    
    try {
      if (isOfflineMode()) {
        await offlineDataService.deleteInvoice(invoiceId)
        return
      }
      
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoiceId)

        if (error) throw error
      } catch (supabaseError) {
        console.warn('Supabase error, falling back to offline mode:', supabaseError)
        setSupabaseOffline()
        await offlineDataService.deleteInvoice(invoiceId)
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      await errorHandlingService.handleError(error, 'InvoiceService.deleteInvoice')
      throw error
    } finally {
      const endTime = performance.now()
      console.log(`📊 Invoice deletion took ${endTime - startTime} milliseconds`)
    }
  }

  generateInvoiceNumber(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0')
    return `INV-${year}${month}${day}-${hours}${minutes}${seconds}-${timestamp}${random}`
  }

  calculateTotals(invoiceItems: InvoiceItem[], taxRate: number) {
    const subtotal = (invoiceItems || []).reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount
    
    return {
      amount: subtotal,
      tax_amount: taxAmount,
      total_amount: total
    }
  }

  updateInvoiceItem(invoiceItems: InvoiceItem[], index: number, field: keyof InvoiceItem, value: string | number): InvoiceItem[] {
    const newItems = [...invoiceItems]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate
    }
    
    return newItems
  }
}

export const invoiceService = new InvoiceService()