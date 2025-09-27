import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Handshake, Plus, DollarSign, Trash2, TestTube } from 'lucide-react'
import { runComprehensiveTests } from '../test/test-runner'
import { addDemoData, clearDemoData } from '../utils/demo-data'
import { ExportFieldsForm } from '../components/ExportFieldsForm'

import { dealService } from '../services/dealService'
import { supabase } from '../lib/supabase-client'
import { useStore } from '../store/useStore'
import type { Deal as OfflineDeal } from '../services/offlineDataService'
import { useAuth } from '../hooks/useAuthHook'
import { toast } from 'sonner'
import type { Database } from '../lib/database.types'

import { EnhancedPipeline } from '../components/deals/EnhancedPipeline'
import { isOfflineMode, handleSupabaseError, protectFromExtensionInterference } from '../utils/offlineMode'

type Deal = Database['public']['Tables']['deals']['Row']


const DEAL_STAGES = [
  { id: 'prospecting', title: 'Prospecting', color: 'bg-blue-100 border-blue-300' },
  { id: 'qualification', title: 'Qualification', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'proposal', title: 'Proposal', color: 'bg-orange-100 border-orange-300' },
  { id: 'negotiation', title: 'Negotiation', color: 'bg-purple-100 border-purple-300' },
  { id: 'closed_won', title: 'Closed Won', color: 'bg-green-100 border-green-300' },
  { id: 'closed_lost', title: 'Closed Lost', color: 'bg-red-100 border-red-300' },
]

export default function Deals() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedDealForExport, setSelectedDealForExport] = useState<Deal | null>(null)
  const [formData, setFormData] = useState<Partial<Deal>>({
    title: '',
    customer_id: '',
    value: 0,
    stage: 'prospecting',
    probability: 0,
    expected_close_date: '',
    description: '',
    responsible_person: 'Mr. Ali',
    competitor_info: '',
    decision_maker_name: '',
    decision_maker_email: '',
    decision_maker_phone: '',
    deal_source_detail: '',
    deal_type: 'new_business'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunningTests, setIsRunningTests] = useState(false)

  const { deals, setDeals, addDeal, updateDeal, removeDeal, customers, setCustomers, loading, setLoading } = useStore()
  const { user } = useAuth()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 Deals page - Loading data')
      
      const dealsData = await dealService.getDeals()
      setDeals(dealsData)
      
      // Load customers if not already loaded
      if (!customers || customers.length === 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (customersData) {
          setCustomers(customersData)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [setDeals, setCustomers, setLoading, customers])

  useEffect(() => {
    loadData()
  }, [loadData])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.title?.trim()) {
      errors.title = 'Deal title is required'
    }
    
    if (!formData.customer_id) {
      errors.customer_id = 'Customer is required'
    }
    
    if (formData.value !== undefined && formData.value < 0) {
      errors.value = 'Deal value cannot be negative'
    }
    
    if (formData.probability !== undefined && (formData.probability < 0 || formData.probability > 100)) {
      errors.probability = 'Probability must be between 0 and 100'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit called', { formData, showAddModal, showEditModal, user })
    
    e.preventDefault()
    
    console.log('📝 Validating form...')
    if (!validateForm()) {
      console.log('❌ Form validation failed')
      return
    }
    console.log('✅ Form validation passed')
    
    if (!user) {
      console.log('❌ User not logged in', { user, userType: typeof user })
      toast.error('You must be logged in to save deals')
      return
    }
    console.log('✅ User is logged in', { userId: user.id })

    setIsSubmitting(true)
    setLoading(true)
    console.log('🔄 Set submitting and loading states')

    try {
      if (showEditModal && selectedDeal) {
        const updateData = { ...formData, updated_at: new Date().toISOString() }
        const updatedDeal = await dealService.updateDeal(selectedDeal.id, updateData)
        updateDeal(selectedDeal.id, updatedDeal)
        toast.success('Deal updated successfully')
      } else {
        const insertData = {
          title: formData.title || '',
          customer_id: formData.customer_id || null,
          amount: formData.value || 0,
          value: formData.value || 0,
          probability: formData.probability || 0,
          stage: formData.stage || 'prospecting',
          expected_close_date: formData.expected_close_date || null,
          description: formData.description || null,
          source: 'Other' as Database['public']['Tables']['deals']['Row']['source'],
          responsible_person: formData.responsible_person || 'Mr. Ali',
          competitor_info: formData.competitor_info || null,
          decision_maker_name: formData.decision_maker_name || null,
          decision_maker_email: formData.decision_maker_email || null,
          decision_maker_phone: formData.decision_maker_phone || null,
          deal_source_detail: formData.deal_source_detail || null,
          deal_type: formData.deal_type || 'new_business',
          lead_id: null,
          assigned_to: null,
          created_by: user.id
        }
        
        const newDeal = await dealService.createDeal(insertData)
        addDeal(newDeal)
        toast.success('Deal added successfully')
      }
      
      console.log('🎯 About to call resetForm')
      resetForm()
      console.log('✅ resetForm called successfully')
    } catch (error) {
      console.error('Error saving deal:', error)
      toast.error('Failed to save deal')
    } finally {
      console.log('🏁 In finally block, about to call resetForm')
      resetForm()
      console.log('✅ resetForm called successfully in finally block')
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  const handleDelete = async (deal: Deal) => {
    if (!confirm('Are you sure you want to delete this deal?')) {
      return
    }

    try {
      setLoading(true)
      console.log('🗑️ Deals page - Deleting deal:', { dealId: deal.id })
      
      await dealService.deleteDeal(deal.id)
      removeDeal(deal.id)
      toast.success('Deal deleted successfully')
    } catch (error) {
      console.error('Error deleting deal:', error)
      toast.error('Failed to delete deal')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    console.log('🔄 resetForm called - current state:', { showAddModal, showEditModal })
    
    setFormData({
      title: '',
      customer_id: '',
      value: 0,
      stage: 'prospecting',
      probability: 0,
      expected_close_date: '',
      description: '',
      responsible_person: 'Mr. Ali',
      competitor_info: '',
      decision_maker_name: '',
      deal_source_detail: '',
      deal_type: 'new_business'
    })
    setFormErrors({})
    
    console.log('🚪 Setting modals to false...')
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedDeal(null)
    console.log('✅ resetForm completed - modals should be closed')
  }

  const openEditModal = (deal: Deal) => {
    setSelectedDeal(deal)
    setFormData({
      title: deal.title,
      customer_id: deal.customer_id,
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date,
      responsible_person: deal.responsible_person || 'Mr. Ali',
      competitor_info: deal.competitor_info || '',
      decision_maker_name: deal.decision_maker_name || '',
      deal_source_detail: deal.deal_source_detail || '',
      deal_type: deal.deal_type || 'new_business',
      description: deal.description
    })
    setShowEditModal(true)
  }

  const handleExport = (deal: Deal) => {
    setSelectedDealForExport(deal)
    setShowExportModal(true)
  }

  const totalPipelineValue = (deals || []).reduce((sum, deal) => sum + (deal?.value || 0), 0)
  const wonDeals = (deals || []).filter(deal => deal && deal.stage === 'closed_won')
  const totalWonValue = wonDeals.reduce((sum, deal) => sum + (deal?.value || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Handshake className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Deals</h1>
                <p className="text-gray-600">Manage your sales pipeline</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={async () => {
                  if (!user) {
                    toast.error('Please log in to run tests')
                    return
                  }
                  setIsRunningTests(true)
                  try {
                    await runComprehensiveTests(user.id)
                    toast.success('All tests completed successfully!')
                  } catch {
                    toast.error('Some tests failed. Check console for details.')
                  } finally {
                    setIsRunningTests(false)
                  }
                }}
                variant="outline"
                className="flex items-center space-x-2"
                disabled={isRunningTests}
              >
                <TestTube className="h-4 w-4" />
                <span>{isRunningTests ? 'Running Tests...' : 'Run All Tests'}</span>
              </Button>
              <Button
                onClick={async () => {
                  if (!user) {
                    toast.error('Please log in to add demo data')
                    return
                  }
                  try {
                    await addDemoData(user.id)
                    await loadData()
                    toast.success('Demo data added successfully!')
                  } catch {
                    toast.error('Failed to add demo data')
                  }
                }}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Demo Data</span>
              </Button>
              <Button
                onClick={async () => {
                  if (!user) {
                    toast.error('Please log in to clear demo data')
                    return
                  }
                  if (confirm('Are you sure you want to clear all demo data? This action cannot be undone.')) {
                    try {
                      await clearDemoData()
                      await loadData()
                      toast.success('Demo data cleared successfully!')
                    } catch {
                      toast.error('Failed to clear demo data')
                    }
                  }
                }}
                variant="outline"
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Demo Data</span>
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2" data-testid="add-deal-button">
                <Plus className="h-4 w-4" />
                <span>Add Deal</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Pipeline Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Handshake className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                  <p className="text-2xl font-bold text-gray-900">${totalPipelineValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Won Deals</p>
                  <p className="text-2xl font-bold text-gray-900">${totalWonValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kanban Board */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading deals...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EnhancedPipeline
            deals={deals}
            customers={customers}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onExport={handleExport}
            onStageChange={async (dealId: string, newStage: string) => {
              const deal = deals.find(d => d.id === dealId)
              if (!deal || deal.stage === newStage) return

              try {
                setLoading(true)
                
                const updateData = { stage: newStage as OfflineDeal['stage'], updated_at: new Date().toISOString() }
                const updatedDeal = await dealService.updateDeal(dealId, updateData)
                updateDeal(dealId, updatedDeal)
                toast.success(`Deal moved to ${DEAL_STAGES.find(s => s.id === newStage)?.title}`)
              } catch (error) {
                console.error('Error updating deal stage:', error)
                toast.error('Failed to update deal stage')
              } finally {
                setLoading(false)
              }
            }}
            onBulkAction={async (dealIds: string[], action: string) => {
              try {
                setLoading(true)
                
                switch (action) {
                  case 'delete':
                    if (!confirm(`Are you sure you want to delete ${dealIds.length} deal(s)?`)) return
                    
                    for (const dealId of dealIds) {
                      await dealService.deleteDeal(dealId)
                      removeDeal(dealId)
                    }
                    toast.success(`${dealIds.length} deal(s) deleted successfully`)
                    break
                    
                  case 'export': {
                    const selectedDeals = deals.filter(deal => dealIds.includes(deal.id))
                    const csvContent = [
                      'Title,Customer,Value,Stage,Probability,Expected Close Date,Description',
                      ...selectedDeals.map(deal => {
                        const customer = customers.find(c => c.id === deal.customer_id)
                        return [
                          deal.title,
                          customer?.name || 'N/A',
                          deal.value,
                          deal.stage,
                          deal.probability,
                          deal.expected_close_date || 'N/A',
                          (deal.description || '').replace(/,/g, ';')
                        ].join(',')
                      })
                    ].join('\n')
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `deals-export-${new Date().toISOString().split('T')[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                    
                    toast.success(`${dealIds.length} deal(s) exported successfully`)
                    break
                  }
                    
                  default:
                    toast.error('Unknown bulk action')
                }
              } catch (error) {
                console.error('Error performing bulk action:', error)
                toast.error('Failed to perform bulk action')
              } finally {
                setLoading(false)
              }
            }}
          />
        )}
      </main>

      {/* Add/Edit Deal Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {showEditModal ? 'Edit Deal' : 'Add New Deal'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      if (formErrors.title) {
                        setFormErrors({ ...formErrors, title: '' })
                      }
                    }}
                    className={formErrors.title ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                    data-testid="deal-title-input"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600" data-testid="deal-title-error">
                      {formErrors.title}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, customer_id: e.target.value })
                      if (formErrors.customer_id) {
                        setFormErrors({ ...formErrors, customer_id: '' })
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.customer_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    required
                    data-testid="deal-customer-select"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.customer_id && (
                    <p className="mt-1 text-sm text-red-600" data-testid="deal-customer-error">
                      {formErrors.customer_id}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deal Value ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.value || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                        if (formErrors.value) {
                          setFormErrors({ ...formErrors, value: '' })
                        }
                      }}
                      className={formErrors.value ? 'border-red-500 focus:ring-red-500' : ''}
                      data-testid="deal-value-input"
                    />
                    {formErrors.value && (
                      <p className="mt-1 text-sm text-red-600" data-testid="deal-value-error">
                        {formErrors.value}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Probability (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })
                        if (formErrors.probability) {
                          setFormErrors({ ...formErrors, probability: '' })
                        }
                      }}
                      className={formErrors.probability ? 'border-red-500 focus:ring-red-500' : ''}
                      data-testid="deal-probability-input"
                    />
                    {formErrors.probability && (
                      <p className="mt-1 text-sm text-red-600" data-testid="deal-probability-error">
                        {formErrors.probability}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={formData.stage || 'prospecting'}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="deal-stage-select"
                  >
                    {DEAL_STAGES.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Close Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expected_close_date || ''}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    data-testid="deal-close-date-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Deal description..."
                    data-testid="deal-description-input"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    data-testid="deal-cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="deal-save-button"
                  >
                    {isSubmitting ? 'Saving...' : (showEditModal ? 'Update Deal' : 'Add Deal')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && selectedDealForExport && (
        <ExportFieldsForm
          customerId={selectedDealForExport?.customer_id || ''}
          onSave={() => {
            setShowExportModal(false)
            setSelectedDealForExport(null)
            toast.success('Export fields saved successfully')
          }}
          onCancel={() => {
            setShowExportModal(false)
            setSelectedDealForExport(null)
          }}
        />
      )}
    </div>
  )
}