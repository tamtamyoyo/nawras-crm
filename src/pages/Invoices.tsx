import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { Plus, Eye, Trash2, Send, Clock, CheckCircle, XCircle, TestTube, Receipt, AlertCircle, DollarSign } from 'lucide-react'
import { runComprehensiveTests } from '../test/test-runner'
import { addDemoData } from '../utils/demo-data'
import { InvoicesTable } from '@/components/invoices/invoices-table'
import { BatchDownloadModal } from '@/components/invoices/BatchDownloadModal'
import { InvoiceTemplate } from '@/components/invoices/InvoiceTemplate'
import { LogoUpload } from '@/components/invoices/LogoUpload'
import { useStore } from '@/store/useStore'
import { useAuth } from '../hooks/useAuthHook'
import { Database } from '@/lib/database.types'
import { invoiceService } from '../services/invoiceService'
import { dealService } from '../services/dealService'
import { customerService } from '../services/customerService'
import { PAYMENT_TERMS } from '../lib/standardTemplate'
import { InvoiceItem } from '@/types/invoice'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']


const INVOICE_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  { value: 'viewed', label: 'Viewed', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
]

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  deal_id: z.string().min(1, 'Deal is required'),
  status: z.string().min(1, 'Status is required'),
  payment_terms: z.string().min(1, 'Payment terms are required'),
  due_date: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  tax_amount: z.number().min(0, 'Tax amount must be positive'),
  total_amount: z.number().min(0, 'Total amount must be positive'),
  tax_rate: z.number().min(0, 'Tax rate must be positive').max(100, 'Tax rate cannot exceed 100%'),
  responsible_person: z.enum(['Mr. Ali', 'Mr. Mustafa', 'Mr. Taha', 'Mr. Mohammed'], {
    required_error: 'Responsible person is required'
  }),
  billing_address: z.string().optional(),
  purchase_order_number: z.string().optional(),
  payment_method: z.string().optional()
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

export default function Invoices() {

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showBatchDownloadModal, setShowBatchDownloadModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState<Partial<InvoiceInsert>>({
    invoice_number: '',
    deal_id: '',
    amount: 0,
    tax_amount: 0,
    total_amount: 0,
    status: 'draft',
    due_date: '',
    payment_terms: 'net_30',
    notes: ''
  })
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  const [taxRate, setTaxRate] = useState(0)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  const { invoices, setInvoices, addInvoice, updateInvoice, removeInvoice, deals, setDeals, customers, setCustomers, loading, setLoading } = useStore()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      deal_id: '',
      status: 'draft',
      payment_terms: 'net_30',
      due_date: '',
      notes: '',
      amount: 0,
      tax_amount: 0,
      total_amount: 0,
      tax_rate: 0,
      responsible_person: 'Mr. Ali',
      billing_address: '',
      purchase_order_number: '',
      payment_method: 'bank_transfer'
    }
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('📋 Loading Invoices data...')
      
      // Load invoices using service
      const invoicesData = await invoiceService.getInvoices()
      setInvoices(invoicesData)

      // Load deals and customers using services
      const dealsData = await dealService.getDeals()
      const customersData = await customerService.getCustomers()
      
      setDeals(dealsData)
      setCustomers(customersData as Database['public']['Tables']['customers']['Row'][])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast, setLoading, setInvoices, setDeals, setCustomers])

  const calculateTotals = useCallback(() => {
    const totals = invoiceService.calculateTotals(invoiceItems, taxRate)
    
    setFormData(prev => ({
      ...prev,
      ...totals
    }))
  }, [invoiceItems, taxRate])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    calculateTotals()
  }, [calculateTotals])

  const generateInvoiceNumber = () => {
    return invoiceService.generateInvoiceNumber()
  }



  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = invoiceService.updateInvoiceItem(invoiceItems, index, field, value)
    setInvoiceItems(newItems)
  }

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeInvoiceItem = (index: number) => {
    if ((invoiceItems || []).length > 1) {
      setInvoiceItems((invoiceItems || []).filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (data: InvoiceFormData) => {
    if (!user) return

    setLoading(true)
    try {
      if (showEditModal && selectedInvoice) {
        // Update existing invoice
        const updatedInvoice = await invoiceService.updateInvoice(selectedInvoice.id, data, invoiceItems, selectedInvoice)
        updateInvoice(selectedInvoice.id, updatedInvoice as any)
        // Refresh the invoice list
        await loadData()
        toast({
          title: 'Success',
          description: 'Invoice updated successfully'
        })
      } else {
        // Create new invoice
        const newInvoice = await invoiceService.createInvoice(data, invoiceItems, user?.id)
        addInvoice(newInvoice as any)
        // Refresh the invoice list
        await loadData()
        toast({
          title: 'Success',
          description: 'Invoice created successfully'
        })
      }

      resetForm()
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to save invoice',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) return

    try {
      setLoading(true)
      await invoiceService.deleteInvoice(invoice.id)
      removeInvoice(invoice.id)
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (invoice: Invoice, newStatus: string) => {
    try {
      setLoading(true)
      
      if (isOfflineMode()) {
        const updatedInvoice = { 
          ...invoice, 
          status: newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled', 
          updated_at: new Date().toISOString(),
          responsible_person: invoice.responsible_person || 'Mr. Ali' as 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed',
          billing_address: invoice.billing_address || null,
          purchase_order_number: invoice.purchase_order_number || null,
          payment_method: invoice.payment_method || null
        }
        await invoiceService.updateInvoice(invoice.id, { status: newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' })
        const updatedInvoices = await invoiceService.getInvoices()
        setInvoices(updatedInvoices as unknown as Invoice[])
        updateInvoice(invoice.id, updatedInvoice as any)
        toast({
          title: 'Success',
          description: `Invoice status updated to ${newStatus}`
        })
        return
      }
      
      try {
        const updateData = { status: newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled', updated_at: new Date().toISOString() }
        const { data, error } = await (supabase as any)
          .from('invoices')
          .update(updateData as any)
          .eq('id', invoice.id)
          .select()
          .single()

        if (error) throw error
        updateInvoice(invoice.id, data as any)
        toast({
          title: 'Success',
          description: `Invoice status updated to ${newStatus}`
        })
      } catch (supabaseError) {
          console.warn('Supabase error, falling back to offline mode:', supabaseError)
          setSupabaseOffline() // Mark Supabase as offline for future operations
          
          try {
          const updatedInvoice = await invoiceService.updateInvoice(invoice.id, { status: newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' })
          const updatedInvoices = await invoiceService.getInvoices()
          setInvoices(updatedInvoices as unknown as Invoice[])
          updateInvoice(invoice.id, { status: newStatus, updated_at: new Date().toISOString() } as any)
          toast({
            title: 'Success',
            description: `Invoice status updated to ${newStatus} (offline)`
          })
        } catch (offlineError) {
          console.error('Offline status update failed:', offlineError)
          throw offlineError
        }
      }
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast({
          title: 'Error',
          description: 'Failed to update commercial invoice status',
          variant: 'destructive'
        })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    const defaultValues = {
      invoice_number: '',
      deal_id: '',
      status: 'draft',
      payment_terms: 'net_30',
      due_date: '',
      notes: '',
      amount: 0,
      tax_amount: 0,
      total_amount: 0,
      tax_rate: 0,
      responsible_person: 'Mr. Ali',
      billing_address: '',
      purchase_order_number: '',
      payment_method: 'bank_transfer'
    }
    form.reset({
      ...defaultValues,
      responsible_person: defaultValues.responsible_person as "Mr. Ali" | "Mr. Mustafa" | "Mr. Taha" | "Mr. Mohammed"
    })
    setFormData({
      invoice_number: '',
      deal_id: '',
      amount: 0,
      tax_amount: 0,
      total_amount: 0,
      status: 'draft',
      due_date: '',
      payment_terms: 'net_30',
      notes: ''
    })
    setInvoiceItems([{ description: '', quantity: 1, rate: 0, amount: 0 }])
    setTaxRate(0)
    setShowAddModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setSelectedInvoice(null)
  }

  const openAddModal = () => {
    resetForm()
    const newInvoiceNumber = generateInvoiceNumber()
    setFormData(prev => ({ ...prev, invoice_number: newInvoiceNumber }))
    form.setValue('invoice_number', newInvoiceNumber)
    setShowAddModal(true)
  }

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    form.reset({
      invoice_number: invoice.invoice_number,
      deal_id: invoice.deal_id || '',
      status: invoice.status,
      payment_terms: invoice.payment_terms,
      due_date: invoice.due_date || '',
      notes: invoice.notes || '',
      amount: invoice.amount,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      tax_rate: invoice.tax_rate || 0,
      responsible_person: (invoice.responsible_person || 'Mr. Ali') as "Mr. Ali" | "Mr. Mustafa" | "Mr. Taha" | "Mr. Mohammed",
      billing_address: invoice.billing_address || '',
      purchase_order_number: invoice.purchase_order_number || '',
      payment_method: invoice.payment_method || 'bank_transfer'
    })
    setFormData({
      invoice_number: invoice.invoice_number,
      deal_id: invoice.deal_id,
      amount: invoice.amount,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      status: invoice.status,
      due_date: invoice.due_date,
      payment_terms: invoice.payment_terms,
      notes: invoice.notes
    })
    
    try {
      let items = [{ description: '', quantity: 1, rate: 0, amount: 0 }]
      if (invoice.items) {
        if (typeof invoice.items === 'string') {
          items = JSON.parse(invoice.items as string) as InvoiceItem[]
        } else if (Array.isArray(invoice.items)) {
          items = invoice.items as unknown as InvoiceItem[]
        }
      }
      // Ensure items is always an array
      if (!Array.isArray(items)) {
        items = [{ description: '', quantity: 1, rate: 0, amount: 0 }]
      }
      setInvoiceItems(items)
    } catch (error) {
      console.warn('Error parsing invoice items:', error)
      setInvoiceItems([{ description: '', quantity: 1, rate: 0, amount: 0 }])
    }
    
    setTaxRate(invoice.tax_rate || 0)
    setShowEditModal(true)
  }

  const openViewModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowViewModal(true)
  }



  // Removed unused getStatusConfig function

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'paid' || !invoice.due_date) return false
    return new Date(invoice.due_date) < new Date()
  }

  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter(i => i.status === 'paid').length
  const overdueInvoices = invoices.filter(i => isOverdue(i)).length
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Receipt className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Commercial Invoices</h1>
                <p className="text-gray-600">Create, manage, and send commercial invoices</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!user) {
                    toast({
                      title: 'Error',
                      description: 'Please log in to run tests',
                      variant: 'destructive'
                    })
                    return
                  }
                  setIsRunningTests(true)
                  try {
                    await runComprehensiveTests(user.id)
                    toast({
                      title: 'Success',
                      description: 'All tests completed successfully!'
                    })
                  } catch {
                    toast({
                      title: 'Error',
                      description: 'Some tests failed. Check console for details.',
                      variant: 'destructive'
                    })
                  } finally {
                    setIsRunningTests(false)
                  }
                }}
                disabled={isRunningTests}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button
                onClick={async () => {
                  if (!user) {
                    toast({
                      title: 'Error',
                      description: 'Please log in to add demo data',
                      variant: 'destructive'
                    })
                    return
                  }
                  try {
                    await addDemoData(user.id)
                    await loadData()
                    toast({
                      title: 'Success',
                      description: 'Demo data added successfully!'
                    })
                  } catch {
                    toast({
                      title: 'Error',
                      description: 'Failed to add demo data',
                      variant: 'destructive'
                    })
                  }
                }}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Demo Data
              </Button>
              <Button 
                onClick={() => setShowBatchDownloadModal(true)}
                variant="outline" 
                className="flex items-center space-x-2"
                disabled={invoices.length === 0}
              >
                <Receipt className="h-4 w-4" />
                <span>Batch Download</span>
              </Button>
              <Button onClick={openAddModal} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Commercial Invoice</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Commercial Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoices List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading invoices...</p>
              </div>
            </CardContent>
          </Card>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No commercial invoices yet</h3>
                <p className="text-gray-600 mb-4">Create your first commercial invoice to get started</p>
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Commercial Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <InvoicesTable
            data={invoices}
            deals={deals}
            customers={customers}
            onView={openViewModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </main>

      {/* Add/Edit Invoice Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? 'Edit Commercial Invoice' : 'Create New Commercial Invoice'}
            </DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update commercial invoice details and items.' : 'Create a new commercial invoice for your deal.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoice_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                            placeholder="Auto-generated"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value)
                          setFormData({ ...formData, deal_id: value })
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a deal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deals.map((deal) => {
                              const customer = customers.find(c => c.id === deal.customer_id)
                              return (
                                <SelectItem key={deal.id} value={deal.id}>
                                  {deal.title} {customer ? `(${customer.name})` : ''}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* New Required Fields */}

                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value)
                          setFormData({ ...formData, status: value as "draft" | "sent" | "paid" | "overdue" | "cancelled" })
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INVOICE_STATUS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value)
                          setFormData({ ...formData, payment_terms: value as "net_15" | "net_30" | "net_45" | "net_60" | "due_on_receipt" })
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_TERMS.map((term) => (
                              <SelectItem key={term.value} value={term.value}>
                                {term.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Social Media">Social Media</SelectItem>
                            <SelectItem value="Cold Call">Cold Call</SelectItem>
                            <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                            <SelectItem value="Trade Show">Trade Show</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsible_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsible Person *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="responsible-person-select">
                              <SelectValue placeholder="Select responsible person" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mr. Ali">Mr. Ali</SelectItem>
                            <SelectItem value="Mr. Mustafa">Mr. Mustafa</SelectItem>
                            <SelectItem value="Mr. Taha">Mr. Taha</SelectItem>
                            <SelectItem value="Mr. Mohammed">Mr. Mohammed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="payment-method-select">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="billing_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter billing address..."
                            rows={3}
                            data-testid="billing-address-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="purchase_order_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Order Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter PO number..."
                            data-testid="po-number-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Company Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo
                  </label>
                  <LogoUpload
                    onLogoChange={setCompanyLogo}
                    currentLogo={companyLogo}
                  />
                </div>
                
                {/* Invoice Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Commercial Invoice Items *
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(invoiceItems || []).map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => updateInvoiceItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.amount.toFixed(2)}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvoiceItem(index)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                            disabled={(invoiceItems || []).length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Rate (%)
                      </label>
                      <Input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${(formData.amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax ({taxRate}%):</span>
                        <span>${(formData.tax_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span>${(formData.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Additional notes or payment instructions..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (showEditModal ? 'Update' : 'Create')} Commercial Invoice
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
          {selectedInvoice && (() => {
            const deal = deals.find(d => d.id === selectedInvoice.deal_id)
            const customer = deal ? customers.find(c => c.id === deal.customer_id) : null
            const items = (() => {
              try {
                return selectedInvoice.items ? JSON.parse(selectedInvoice.items as string) as InvoiceItem[] : []
              } catch {
                return []
              }
            })()
            const paymentTermsLabel = PAYMENT_TERMS.find(t => t.value === selectedInvoice.payment_terms)?.label
            
            return (
              <InvoiceTemplate
                invoiceNumber={selectedInvoice.invoice_number}
                invoiceDate={selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleDateString() : undefined}
                dueDate={selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : undefined}
                status={selectedInvoice.status}
                customerName={customer?.name}
                customerEmail={customer?.email}
                customerPhone={customer?.phone}
                dealTitle={deal?.title}
                items={items}
                subtotal={selectedInvoice.amount || 0}
                taxRate={selectedInvoice.tax_rate || 0}
                taxAmount={selectedInvoice.tax_amount || 0}
                totalAmount={selectedInvoice.total_amount || 0}
                notes={selectedInvoice.notes}
                paymentTerms={paymentTermsLabel}
              />
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Batch Download Modal */}
      {showBatchDownloadModal && (
        <BatchDownloadModal
          invoices={invoices.map(invoice => {
            const deal = deals.find(d => d.id === invoice.deal_id)
            const customer = deal ? customers.find(c => c.id === deal.customer_id) : null
            return {
              ...invoice,
              customer_name: customer?.name || 'Unknown Customer'
            }
          })}
          onClose={() => setShowBatchDownloadModal(false)}
          onDownloadComplete={() => {
            setShowBatchDownloadModal(false)
            toast({
              title: 'Success',
              description: 'Invoices downloaded successfully!'
            })
          }}
        />
      )}
    </div>
  )
}