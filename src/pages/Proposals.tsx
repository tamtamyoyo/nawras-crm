import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  FileText, Plus, Search, Eye, Edit3, Trash2,
  Send, Clock, CheckCircle, XCircle, Calendar, DollarSign, CheckSquare
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ProposalTemplate } from '../components/proposals/ProposalTemplate'
import { proposalService } from '../services/proposalService'

import { getStandardTemplate, createProposalFromStandardTemplate } from '../lib/standardTemplate'
import { protectFromExtensionInterference } from '../utils/extensionProtection'
import { Database } from '@/lib/database.types'

type Proposal = Database['public']['Tables']['proposals']['Row']

const PROFORMA_INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit3 },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  { value: 'viewed', label: 'Viewed', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: Clock }
]

export default function ProformaInvoices() {
  const { toast } = useToast()
  const [proformaInvoices, setProformaInvoices] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showProformaInvoiceDialog, setShowProformaInvoiceDialog] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedProformaInvoice, setSelectedProformaInvoice] = useState<Proposal | null>(null)

  const loadProformaInvoices = useCallback(async () => {
    protectFromExtensionInterference()
    console.log('📋 Loading proforma invoices data...')
    
    try {
      const proposals = await proposalService.getProposals()
      setProformaInvoices(proposals as any)
    } catch (error) {
      console.error('Error loading proforma invoices:', error)
      // Use mock data as fallback
      setProformaInvoices(getMockProformaInvoices())
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      await loadProformaInvoices()
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [loadProformaInvoices])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getMockProformaInvoices = (): Proposal[] => [
    {
      id: '1',
      title: 'Website Development Proposal',
      status: 'draft' as const,
      deal_id: 'deal-1',
      customer_id: 'customer-1',
      content: '',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      responsible_person: 'Mr. Ali',
      source: 'Other',
      created_by: 'user-1',
      proposal_type: 'standard',
      validity_period: 30,
      delivery_method: 'email',
      notes: null,
      total_amount: null,
      approval_workflow: null,
      template_used: null,
      estimated_value: null,
      version: 1
    },
    {
      id: '2',
      title: 'Marketing Campaign Proposal',
      status: 'viewed' as const,
      deal_id: 'deal-2',
      customer_id: 'customer-2',
      content: '',
      valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      responsible_person: 'Mr. Ali',
      source: 'Other',
      created_by: 'user-1',
      proposal_type: 'standard',
      validity_period: 15,
      delivery_method: 'email',
      notes: null,
      total_amount: null,
      approval_workflow: null,
      template_used: null,
      estimated_value: null,
      version: 1
    }
  ]



  const handleCreateProformaInvoice = () => {
    // Always use the standardized template for new proforma invoices
    setSelectedProformaInvoice(null)
    setEditMode('create')
    setShowProformaInvoiceDialog(true)
  }

  const handleEditProformaInvoice = (proformaInvoice: Proposal) => {
    setSelectedProformaInvoice(proformaInvoice)
    setEditMode('edit')
    setShowProformaInvoiceDialog(true)
  }

  const handleViewProformaInvoice = (proformaInvoice: Proposal) => {
    setSelectedProformaInvoice(proformaInvoice)
    setEditMode('view')
    setShowProformaInvoiceDialog(true)
  }

  const handleDeleteProformaInvoice = async (proformaInvoiceId: string) => {
    if (!confirm('Are you sure you want to delete this proforma invoice?')) return

    protectFromExtensionInterference()
    console.log('🗑️ Deleting proforma invoice...', { proformaInvoiceId })

    try {
      await proposalService.deleteProposal(proformaInvoiceId)
      const updatedProformaInvoices = proformaInvoices.filter(p => p.id !== proformaInvoiceId)
      setProformaInvoices(updatedProformaInvoices)
      
      toast({
        title: "Success",
        description: "Proposal deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting proforma invoice:', error)
      toast({
        title: "Error",
        description: "Failed to delete proposal",
        variant: "destructive"
      })
    }
  }



  const handleSendProformaInvoice = async (proformaInvoiceId: string) => {
    protectFromExtensionInterference()
    
    try {
      const updates = { status: 'sent' as const, updated_at: new Date().toISOString() }
      await proposalService.updateProposal(proformaInvoiceId, updates)
      
      setProformaInvoices(proformaInvoices.map(p => 
        p.id === proformaInvoiceId ? { ...p, ...updates } : p
      ))
      
      toast({
        title: "Success",
        description: "Proposal sent successfully"
      })
    } catch (error) {
      console.error('Error sending proforma invoice:', error)
      toast({
        title: "Error",
        description: "Failed to send proposal",
        variant: "destructive"
      })
    }
  }

  // Memoized proposal statistics for performance
  const proposalStats = useMemo(() => {
    const total = proformaInvoices.length
    const pending = proformaInvoices.filter(p => p.status === 'draft' || p.status === 'sent').length
    const accepted = proformaInvoices.filter(p => p.status === 'accepted').length
    const totalValue = proformaInvoices.reduce((sum, p) => sum + ((p as any).total_amount || 0), 0)
    
    return { total, pending, accepted, totalValue }
  }, [proformaInvoices])

  // Memoized filtered proposals for performance
  const filteredProformaInvoices = useMemo(() => {
    return proformaInvoices.filter(proformaInvoice => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = proformaInvoice.title.toLowerCase().includes(searchLower) ||
                           ((proformaInvoice as any).description || '').toLowerCase().includes(searchLower)
      const matchesStatus = statusFilter === 'all' || proformaInvoice.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [proformaInvoices, searchTerm, statusFilter])

  // Memoized status config lookup
  const getStatusConfig = useCallback((status: string) => {
    return PROFORMA_INVOICE_STATUSES.find(s => s.value === status) || PROFORMA_INVOICE_STATUSES[0]
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Proforma Invoices
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track your proforma invoices
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => loadData()} className="w-full sm:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateProformaInvoice} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Proforma Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Proforma Invoices</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{proposalStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{proposalStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{proposalStats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">${proposalStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search proforma invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PROFORMA_INVOICE_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProformaInvoices.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proforma invoices found</h3>
          <p className="text-gray-600 mb-4">
            {proformaInvoices.length === 0 
              ? "Get started by creating your first proforma invoice" 
              : "Try adjusting your search or filter criteria"}
          </p>
          <Button onClick={handleCreateProformaInvoice}>
            <Plus className="h-4 w-4 mr-2" />
            Create Proforma Invoice
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProformaInvoices.map((proformaInvoice) => {
            const statusConfig = getStatusConfig(proformaInvoice.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <Card key={proformaInvoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{proformaInvoice.title}</CardTitle>
                      <p className="text-sm text-gray-600">{proformaInvoice.customer_id}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">${((proformaInvoice as any).total_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valid Until:</span>
                      <span className="font-medium">{new Date(proformaInvoice.valid_until).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(proformaInvoice.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                            <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProformaInvoice(proformaInvoice)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProformaInvoice(proformaInvoice)}
                      className="flex-1"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProformaInvoice(proformaInvoice.id)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    {proformaInvoice.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendProformaInvoice(proformaInvoice.id)}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}



      {/* Proforma Invoice Dialog */}
      <Dialog open={showProformaInvoiceDialog} onOpenChange={setShowProformaInvoiceDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode === 'create' ? 'Create New Proforma Invoice' : 
               editMode === 'edit' ? 'Edit Proforma Invoice' : 'View Proforma Invoice'}
            </DialogTitle>
          </DialogHeader>
          <ProposalTemplate
            template={getStandardTemplate()}
            dealData={selectedProformaInvoice}
            onSave={async (template) => {
              try {
                const proformaInvoiceData = {
                  id: selectedProformaInvoice?.id || `proforma-invoice-${Date.now()}`,
                  title: template.name,
                  description: template.description || '',
                  status: 'draft' as const,
                  customer_id: 'customer-1', // This should come from form data
                  deal_id: null,
                  content: JSON.stringify(template.sections),
                  variables: template.variables,
                  total_amount: 0, // This should be calculated
                  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  responsible_person: 'user-1',
                  sent_at: null,
                  viewed_at: null,
                  responded_at: null,
                  source: 'manual',
                  created_by: 'user-1',
                  proposal_type: 'proforma',
                  validity_period: 30,
                  delivery_method: 'email'
                }

                if (selectedProformaInvoice) {
                  const updatedProposal = await proposalService.updateProposal(selectedProformaInvoice.id, proformaInvoiceData as any)
                  setProformaInvoices(proformaInvoices.map(p => p.id === selectedProformaInvoice.id ? updatedProposal as any : p))
                } else {
                  const newProposal = await proposalService.createProposal(proformaInvoiceData as any)
                  setProformaInvoices([...proformaInvoices, newProposal as any])
                }
                
                setShowProformaInvoiceDialog(false)
                toast({
                  title: "Success",
                  description: selectedProformaInvoice ? 'Proforma invoice updated successfully' : 'Proforma invoice saved successfully'
                })
              } catch (error) {
                console.error('Error saving proforma invoice:', error)
                toast({
                  title: "Error",
                  description: 'Failed to save proforma invoice',
                  variant: "destructive"
                })
              }
            }}
            onGenerate={async (template) => {
              try {
                const proformaInvoiceData = {
                  id: selectedProformaInvoice?.id || `proforma-invoice-${Date.now()}`,
                  title: template.name,
                  description: template.description || '',
                  status: 'sent' as const,
                  customer_id: 'customer-1', // This should come from form data
                  deal_id: null,
                  content: JSON.stringify(template.sections),
                  variables: template.variables,
                  total_amount: 0, // This should be calculated
                  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  sent_at: new Date().toISOString(),
                  responsible_person: 'user-1',
                  viewed_at: null,
                  responded_at: null,
                  source: 'manual',
                  created_by: 'user-1',
                  proposal_type: 'proforma',
                  validity_period: 30,
                  delivery_method: 'email'
                }

                if (selectedProformaInvoice) {
                  await proposalService.updateProposal(selectedProformaInvoice.id, proformaInvoiceData as any)
                } else {
                  await proposalService.createProposal(proformaInvoiceData as any)
                }
                
                await loadProformaInvoices()
                setShowProformaInvoiceDialog(false)
                toast({
                  title: "Success",
                  description: 'Proforma invoice generated and sent successfully'
                })
              } catch (error) {
                console.error('Error generating proforma invoice:', error)
                toast({
                  title: "Error",
                  description: 'Failed to generate proforma invoice',
                  variant: "destructive"
                })
              }
            }}
            mode={editMode === 'view' ? 'preview' : 'generate'}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}