import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, Search, Mail, Phone, Building, Edit, Trash2, Star, UserPlus, Clock, TrendingUp, CheckCircle, FileText, TestTube, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../hooks/useAuthHook'
import { offlineDataService } from '../services/offlineDataService'

import { runComprehensiveTests } from '../test/test-runner'
import { addDemoData } from '../utils/demo-data'
import { ExportFieldsForm } from '@/components/ExportFieldsForm'
import { isOfflineMode, handleSupabaseError, protectFromExtensionInterference } from '../utils/offlineMode'

import { Database } from '@/lib/database.types'

type Lead = Database['public']['Tables']['leads']['Row']

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(['Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other']).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  lead_score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  responsible_person: z.enum(['Mr. Ali', 'Mr. Mustafa', 'Mr. Taha', 'Mr. Mohammed']),
  lifecycle_stage: z.enum(['subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist', 'other']).optional(),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  contact_preferences: z.array(z.string()).default(['email']),
  follow_up_date: z.string().optional()
})

type LeadFormData = z.infer<typeof leadSchema>

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedLeadForExport, setSelectedLeadForExport] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      source: 'Website',
      status: 'new',
      lead_score: 50,
      notes: '',
      responsible_person: 'Mr. Ali',
      lifecycle_stage: 'lead',
      priority_level: 'medium',
      contact_preferences: ['email'],
      follow_up_date: ''
    }
  })

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true)
      protectFromExtensionInterference()
      const offline = isOfflineMode()
      console.log('🔧 [Leads] Loading data...', { offlineMode: offline })
      
      // Check if we're in offline mode
      if (offline) {
        console.log('📱 Loading leads from offline storage')
        const data = await offlineDataService.getLeads()
        // Set leads data directly from offline service
        setLeads(data || [])
        return
      }
      
      // Try Supabase first, fallback to offline mode on error
      try {
        console.log('🔧 [Leads] Querying Supabase...')
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        console.log('🔧 [Leads] Supabase response:', { leadsCount: data?.length || 0, data })
        // Only replace data if we get a successful response from Supabase
        if (data) {
          setLeads(data)
        }
      } catch (supabaseError) {
        console.warn('Supabase failed, checking if should fallback to offline mode:', supabaseError)
        if (handleSupabaseError(supabaseError)) {
          const data = await offlineDataService.getLeads()
          // Preserve existing data and merge with offline data
          setLeads(prevLeads => {
            const existingIds = new Set(prevLeads.map(l => l.id))
            const newLeads = (data || []).filter(l => !existingIds.has(l.id))
            return [...prevLeads, ...newLeads]
          })
        } else {
          throw supabaseError
        }
      }
    } catch (error) {
      console.error('Error loading leads:', error)
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [setLoading, setLeads])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const handleOfflineOperation = async (data: LeadFormData, editingLead: Lead | null) => {
    if (editingLead) {
      const updateData: Partial<Lead> = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        source: data.source || null,
        status: data.status,
        lead_score: data.lead_score || null,
        notes: data.notes || null,
        responsible_person: data.responsible_person,
        lifecycle_stage: data.lifecycle_stage || null,
        priority_level: data.priority_level,
        contact_preferences: data.contact_preferences,
        follow_up_date: data.follow_up_date || null,
        assigned_to: null
      }
      const updatedLead = await offlineDataService.updateLead(editingLead.id, updateData)
      setLeads(leads.map(lead => lead.id === editingLead.id ? updatedLead : lead))
      loadLeads().catch(console.error)
      setIsEditModalOpen(false)
    } else {
      const insertData: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        source: data.source || null,
        status: data.status,
        lead_score: data.lead_score || null,
        notes: data.notes || null,
        responsible_person: data.responsible_person,
        lifecycle_stage: data.lifecycle_stage || null,
        priority_level: data.priority_level,
        contact_preferences: data.contact_preferences,
        follow_up_date: data.follow_up_date || null,
        assigned_to: null,
        created_by: user?.id || '00000000-0000-0000-0000-000000000000',
        score: null,
        lead_source_detail: null,
        version: null
      }
      const newLead = await offlineDataService.createLead(insertData)
      setLeads([newLead, ...leads])
      loadLeads().catch(console.error)
      setIsAddModalOpen(false)
    }
    toast({
      title: editingLead ? "Lead updated" : "Lead created",
      description: editingLead ? "Lead has been updated successfully." : "New lead has been created successfully."
    })
  }

  const handleSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true)
      protectFromExtensionInterference()
      
      const offline = isOfflineMode()
      console.log('🔧 [Leads] Saving data...', { offlineMode: offline })
      
      // Check if we're in offline mode
      if (offline) {
        console.log('📱 Using offline mode for lead operations')
        
        if (editingLead) {
          // Update existing lead
          const updateData: Partial<Lead> = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company: data.company || null,
            source: data.source || null,
            status: data.status,
            lead_score: data.lead_score || null,
            notes: data.notes || null,
            responsible_person: data.responsible_person,
            lifecycle_stage: data.lifecycle_stage || null,
            priority_level: data.priority_level,
            contact_preferences: data.contact_preferences,
            follow_up_date: data.follow_up_date || null,
            assigned_to: null
          }
          
          const updatedLead = await offlineDataService.updateLead(editingLead.id, updateData)
          // Use functional update to ensure we don't lose existing leads
          setLeads(prevLeads => prevLeads.map(lead => lead.id === editingLead.id ? updatedLead : lead))
          loadLeads().catch(console.error)
          setIsEditModalOpen(false)
          toast({
            title: "Lead updated",
            description: "Lead has been updated successfully."
          })
        } else {
          // Create new lead
          const insertData: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company: data.company || null,
            source: data.source || null,
            status: data.status,
            lead_score: data.lead_score || null,
            notes: data.notes || null,
            responsible_person: data.responsible_person,
            lifecycle_stage: data.lifecycle_stage || null,
            priority_level: data.priority_level,
            contact_preferences: data.contact_preferences,
            follow_up_date: data.follow_up_date || null,
            assigned_to: null,
            created_by: user?.id || '00000000-0000-0000-0000-000000000000', // Use default UUID for anonymous users
            score: null,
            lead_source_detail: null,
            version: null
          }
          
          const newLead = await offlineDataService.createLead(insertData)
          // Use functional update to ensure we don't lose existing leads
          setLeads(prevLeads => [newLead, ...prevLeads])
          loadLeads().catch(console.error)
          setIsAddModalOpen(false)
          toast({
            title: "Lead created",
            description: "New lead has been created successfully."
          })
        }
        
        // Reset form
        form.reset()
        setEditingLead(null)
        return
      }
      
      // Try Supabase first, fallback to offline mode on error
      try {
        if (editingLead) {
          // Update existing lead
          const updateData: Database['public']['Tables']['leads']['Update'] = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company: data.company || null,
            source: data.source || null,
            status: data.status,
            lead_score: data.lead_score || null,
            notes: data.notes || null,
            responsible_person: data.responsible_person,
            lifecycle_stage: data.lifecycle_stage || null,
            priority_level: data.priority_level,
            contact_preferences: data.contact_preferences,
            follow_up_date: data.follow_up_date || null
          }
          const { error } = await (supabase as any)
            .from('leads')
            .update(updateData)
            .eq('id', editingLead.id)

          if (error) throw error

          setLeads(leads.map(lead => 
            lead.id === editingLead.id 
              ? { ...lead, ...data, updated_at: new Date().toISOString() }
              : lead
          ))
          loadLeads().catch(console.error)
          setIsEditModalOpen(false)
          toast({
            title: "Lead updated",
            description: "Lead has been updated successfully."
          })
        } else {
          // Create new lead
          const insertData: Database['public']['Tables']['leads']['Insert'] = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company: data.company || null,
            source: data.source || null,
            status: data.status,
            lead_score: data.lead_score || null,
            notes: data.notes || null,
            responsible_person: data.responsible_person,
            lifecycle_stage: data.lifecycle_stage || null,
            priority_level: data.priority_level,
            contact_preferences: data.contact_preferences,
            follow_up_date: data.follow_up_date || null,
            created_by: user?.id || null // Use null if no authenticated user
          }
          const { error } = await (supabase as any)
            .from('leads')
            .insert([insertData])
            .select()
            .single()

          if (error) throw error

          // Reload leads to get the updated list
          loadLeads()
          setIsAddModalOpen(false)
          toast({
            title: "Lead created",
            description: "New lead has been created successfully."
          })
        }
      } catch (supabaseError) {
        console.warn('Supabase failed, checking if should fallback to offline mode:', supabaseError)
        if (handleSupabaseError(supabaseError)) {
          // Fallback to offline mode
          await handleOfflineOperation(data, editingLead)
        } else {
          throw supabaseError
        }
      }

      // Reset form
      form.reset()
      setEditingLead(null)
    } catch (error) {
      console.error('Error saving lead:', error)
      toast({
        title: "Error",
        description: "Failed to save lead. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Are you sure you want to delete ${lead.name}?`)) return

    try {
      setLoading(true)
      protectFromExtensionInterference()
      
      const offline = isOfflineMode()
      console.log('🔧 [Leads] Deleting data...', { offlineMode: offline })
      
      // Check if we're in offline mode
      if (offline) {
        console.log('📱 Using offline mode for lead deletion')
        await offlineDataService.deleteLead(lead.id)
        setLeads(leads.filter(l => l.id !== lead.id))
        toast({
          title: "Success",
          description: "Lead deleted successfully"
        })
        return
      }
      
      // Try Supabase first, fallback to offline mode on error
      try {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', lead.id)

        if (error) throw error
        setLeads(leads.filter(l => l.id !== lead.id))
        toast({
          title: "Success",
          description: "Lead deleted successfully"
        })
      } catch (supabaseError) {
        console.warn('Supabase failed, checking if should fallback to offline mode:', supabaseError)
        if (handleSupabaseError(supabaseError)) {
          await offlineDataService.deleteLead(lead.id)
          setLeads(leads.filter(l => l.id !== lead.id))
          toast({
            title: "Success",
            description: "Lead deleted successfully"
          })
        } else {
          throw supabaseError
        }
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToCustomer = async (lead: Lead) => {
    try {
      setLoading(true)
      protectFromExtensionInterference()
      
      const offline = isOfflineMode()
      console.log('🔧 [Leads] Converting lead to customer...', { offlineMode: offline })
      
      if (offline) {
        console.log('📱 Using offline mode for lead conversion')
        // In offline mode, just update the lead status
        const updateData: Partial<Lead> = { status: 'closed_won' }
        const updatedLead = await offlineDataService.updateLead(lead.id, updateData)
        setLeads(leads.map(l => l.id === lead.id ? updatedLead : l))
        toast({
          title: "Success",
          description: "Lead converted to customer successfully (offline mode)"
        })
        return
      }
      
      // Create customer from lead
      const customerData: Database['public']['Tables']['customers']['Insert'] = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: 'active' as const,
        notes: `Converted from lead. Original notes: ${lead.notes || 'None'}`,
        created_by: user?.id || null, // Use null if no authenticated user
        responsible_person: (lead.responsible_person as 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed') || 'Mr. Ali'
      }
      const { error: customerError } = await (supabase as any)
          .from('customers')
          .insert(customerData)
          .select()
          .single()

      if (customerError) throw customerError

      // Update lead status to closed_won (converted)
      const leadUpdateData: Database['public']['Tables']['leads']['Update'] = { status: 'closed_won' }
      const { error: leadError } = await (supabase as any)
          .from('leads')
          .update(leadUpdateData)
          .eq('id', lead.id)

      if (leadError) throw leadError

      // Update local state
      setLeads(leads.map(l => l.id === lead.id ? { ...l, status: 'closed_won' as const } : l))
      toast({
        title: "Success",
        description: "Lead converted to customer successfully"
      })
      
      // Reload leads to reflect changes
      loadLeads()
    } catch (error) {
      console.error('Error converting lead:', error)
      toast({
        title: "Error",
        description: "Failed to convert lead to customer",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }



  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    form.reset({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || 'Other',
      status: lead.status,
      lead_score: lead.lead_score || 50,
      notes: lead.notes || '',
      responsible_person: lead.responsible_person || 'Mr. Ali',
      lifecycle_stage: lead.lifecycle_stage || 'lead',
      priority_level: lead.priority_level || 'medium',
      contact_preferences: (lead.contact_preferences as ('email' | 'phone' | 'whatsapp' | 'in_person')[]) || ['email'],
      follow_up_date: lead.follow_up_date || ''
    })
    setIsEditModalOpen(true)
  }

  const handleAdd = () => {
    form.reset()
    setEditingLead(null)
    setIsAddModalOpen(true)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
    return matchesSearch && matchesStatus && matchesSource
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-indigo-100 text-indigo-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />
      case 'contacted': return <Mail className="h-4 w-4" />
      case 'qualified': return <TrendingUp className="h-4 w-4" />
      case 'proposal': return <FileText className="h-4 w-4" />
      case 'negotiation': return <TrendingUp className="h-4 w-4" />
      case 'closed_won': return <CheckCircle className="h-4 w-4" />
      case 'closed_lost': return <Trash2 className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <UserPlus className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Leads</h1>
                <p className="text-gray-600">Track and qualify potential customers</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!user?.id) {
                    toast({
                      title: "Error",
                      description: "Please log in to run tests",
                      variant: "destructive"
                    })
                    return
                  }
                  
                  setIsRunningTests(true)
                  try {
                    console.log('🚀 Starting comprehensive CRM test suite...')
                    toast({
                      title: "Info",
                      description: "Running comprehensive tests... Check console for details"
                    })
                    
                    const report = await runComprehensiveTests(user.id)
                    
                    // Show summary toast
                    if (report.failed === 0) {
                      toast({
                        title: "Success",
                        description: `All tests passed! ${report.passed}/${report.totalTests} successful`
                      })
                    } else {
                      toast({
                        title: "Error",
                        description: `${report.failed} tests failed. Check console for details.`,
                        variant: "destructive"
                      })
                    }
                    
                    // Refresh leads to show demo data
                    await loadLeads()
                    
                  } catch (error) {
                    console.error('Test suite error:', error)
                    toast({
                      title: "Error",
                      description: "Test suite failed to run",
                      variant: "destructive"
                    })
                  } finally {
                    setIsRunningTests(false)
                  }
                }}
                disabled={isRunningTests}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <TestTube className="h-4 w-4" />
                <span>{isRunningTests ? 'Running Tests...' : 'Run All Tests'}</span>
              </Button>
              <Button
                onClick={async () => {
                  if (!user?.id) {
                    toast({
                      title: "Error",
                      description: "Please log in to add demo data",
                      variant: "destructive"
                    })
                    return
                  }
                  
                  try {
                    await addDemoData(user.id)
                    await loadLeads()
                  } catch (error) {
                    console.error('Demo data error:', error)
                  }
                }}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Demo Data</span>
              </Button>
              <Button onClick={handleAdd} className="flex items-center space-x-2" data-testid="add-lead-button">
                <Plus className="h-4 w-4" />
                <span>Add Lead</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="leads-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'new' | 'contacted' | 'qualified' | 'unqualified')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="leads-status-filter"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>

          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'all' | 'website' | 'referral' | 'social_media' | 'email_campaign' | 'cold_call' | 'trade_show' | 'other')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="leads-source-filter"
          >
            <option value="all">All Sources</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social_media">Social Media</option>
            <option value="email_campaign">Email Campaign</option>
            <option value="cold_call">Cold Call</option>
            <option value="trade_show">Trade Show</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Lead List */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading leads...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>Track and qualify potential customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' ? 'No leads found' : 'No leads yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first lead'
                  }
                </p>
                <Button onClick={handleAdd} data-testid="add-lead-empty-button">
                   <Plus className="h-4 w-4 mr-2" />
                   Add Lead
                 </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(lead.status)}`}>
                            {getStatusIcon(lead.status)}
                            <span>{lead.status}</span>
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className={`h-4 w-4 ${getScoreColor(lead.score || 0)}`} />
                            <span className={`text-sm font-medium ${getScoreColor(lead.score || 0)}`}>
                              {lead.score || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        {lead.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.company && (
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>{lead.company}</span>
                          </div>
                        )}

                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <span>Source: {lead.source?.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {lead.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {lead.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLeadForExport(lead.id)
                            setShowExportModal(true)
                          }}
                          title="Manage Export Fields"
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lead)}
                          data-testid="edit-lead-button"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lead)}
                          className="text-red-600 hover:text-red-700"
                          data-testid="delete-lead-button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {lead.status === 'qualified' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToCustomer(lead)}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="convert-lead-button"
                        >
                          Convert to Customer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Lead Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {isEditModalOpen ? 'Edit Lead' : 'Add New Lead'}
              </h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="lead-name-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="lead-email-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} data-testid="lead-phone-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="lead-company-input" />
                        </FormControl>
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
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="lead-source-select"
                          >
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Email Campaign">Email Campaign</option>
                            <option value="Cold Call">Cold Call</option>
                            <option value="Trade Show">Trade Show</option>
                            <option value="Other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="lead-status-select"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed_won">Closed Won</option>
                            <option value="closed_lost">Closed Lost</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lead_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Score (0-100)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="lead-score-input" />
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
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="lead-responsible-person-select"
                          >
                            <option value="Mr. Ali">Mr. Ali</option>
                            <option value="Mr. Mustafa">Mr. Mustafa</option>
                            <option value="Mr. Taha">Mr. Taha</option>
                            <option value="Mr. Mohammed">Mr. Mohammed</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lifecycle_stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lifecycle Stage</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="lead-lifecycle-stage-select"
                          >
                            <option value="">Select Stage</option>
                            <option value="subscriber">Subscriber</option>
                            <option value="lead">Lead</option>
                            <option value="marketing_qualified_lead">Marketing Qualified Lead</option>
                            <option value="sales_qualified_lead">Sales Qualified Lead</option>
                            <option value="opportunity">Opportunity</option>
                            <option value="customer">Customer</option>
                            <option value="evangelist">Evangelist</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="lead-priority-level-select"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contact_preferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Preferences</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {['email', 'phone', 'whatsapp', 'in_person'].map((option) => (
                              <label key={option} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value?.includes(option as 'email' | 'phone' | 'whatsapp' | 'in_person') || false}
                                  onChange={(e) => {
                                    const currentValue = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...currentValue, option]);
                                    } else {
                                      field.onChange(currentValue.filter((v: string) => v !== option));
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                  data-testid={`lead-contact-preference-${option}`}
                                />
                                <span className="capitalize">{option.replace('_', ' ')}</span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="follow_up_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="lead-follow-up-date-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="lead-notes-textarea"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setEditingLead(null); form.reset(); }} data-testid="lead-cancel-button">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} data-testid="lead-save-button">
                      {loading ? 'Saving...' : (isEditModalOpen ? 'Update' : 'Add')} Lead
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Export Fields Modal */}
      {showExportModal && selectedLeadForExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Manage Export Fields</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowExportModal(false)
                    setSelectedLeadForExport(null)
                  }}
                >
                  ×
                </Button>
              </div>
              <ExportFieldsForm
                leadId={selectedLeadForExport}
                onSave={() => {
                  setShowExportModal(false)
                  setSelectedLeadForExport(null)
                  toast({
                    title: "Success",
                    description: "Export fields saved successfully"
                  })
                }}
                onCancel={() => {
                  setShowExportModal(false)
                  setSelectedLeadForExport(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}