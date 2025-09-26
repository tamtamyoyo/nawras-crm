import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, Building, MapPin, TestTube, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { offlineDataService } from '../services/offlineDataService'

import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuthHook'
import { toast } from 'sonner'
import { runComprehensiveTests } from '../test/test-runner'
import { addDemoData, clearDemoData } from '../utils/demo-data'
import { ExportFieldsForm } from '../components/export-fields/ExportFieldsForm'
import { isOfflineMode, handleSupabaseError, protectFromExtensionInterference } from '../utils/offlineMode'
import type { Database } from '../lib/database.types'

// Import error handling services
import { useApiRetry } from '../components/ApiRetryWrapper'
import { useLoading } from '../components/LoadingIndicator'
import formValidationService from '../services/formValidationService'
import databaseErrorHandlingService from '../services/databaseErrorHandlingService'
import performanceMonitoringService from '../services/performanceMonitoringService'
import ValidatedForm, { ValidatedInput, ValidatedSelect, ValidatedTextarea } from '../components/ValidatedForm'
import { customerService } from '../services/customerService'


type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

export default function Customers() {
  console.log('🚀 Customers component is mounting')
  console.log('📡 Supabase client available:', !!supabase)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'prospect'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<CustomerInsert>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
    status: 'prospect',
    responsible_person: 'Mr. Ali'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunningTests, setIsRunningTests] = useState(false)

  const { customers, setCustomers, addCustomer, updateCustomer, removeCustomer, loading, setLoading } = useStore()
  const { user } = useAuth()
  
  // Initialize error handling services
  const { executeWithRetry } = useApiRetry()
  const { startLoading, finishLoading, updateLoading } = useLoading()
  
  // Customer validation schema is already initialized in formValidationService
  // No need to override the default schema

  const loadCustomers = useCallback(async () => {
    console.log('🔄 Loading customers...')
    setLoading(true)
    const operationId = 'load-customers-' + Date.now()
    
    const operation = {
      id: operationId,
      type: 'api' as const,
      description: 'Loading customers...',
      priority: 'medium' as const,
      showSpinner: true,
      showProgress: true
    }
    
    startLoading(operation)
    
    try {
      updateLoading(operationId, { progress: 25, message: 'Fetching customers...' })
      
      const customers = await customerService.getCustomers({
        search: searchTerm,
        status: statusFilter
      })
      
      updateLoading(operationId, { progress: 75, message: 'Processing data...' })
      setCustomers(customers)
      
      updateLoading(operationId, { progress: 100, message: 'Complete!' })
      toast.success(`Loaded ${customers.length} customers successfully`)
      
    } catch (err) {
      console.error('💥 Error in loadCustomers:', err)
      toast.error('Failed to load customers. Please try again.')
    } finally {
      finishLoading(operationId)
      setLoading(false)
    }
  }, [searchTerm, statusFilter, setCustomers, setLoading, startLoading, finishLoading, updateLoading])

  // Initial load on component mount
  useEffect(() => {
    console.log('🔥 Initial useEffect triggered - calling loadCustomers')
    loadCustomers()
  }, [loadCustomers]) // Include loadCustomers in dependency array

  // Load customers when search/filter changes
  useEffect(() => {
    console.log('🔄 Filter/search changed - reloading customers')
    loadCustomers()
  }, [searchTerm, statusFilter, loadCustomers])



  const handleSubmit = async (data: any) => {
    // ValidatedForm already handles preventDefault, so we receive the form data directly
    
    // Use form validation service
    const validationResult = formValidationService.validateForm('customer', data)
    if (!validationResult.isValid) {
      setFormErrors(validationResult.errors)
      toast.error('Please fix the form errors before submitting')
      return
    }
    
    setIsSubmitting(true)
    const operationId = 'save-customer-' + Date.now()
    startLoading(operationId, { message: 'Saving customer...' })
    
    try {
      updateLoading(operationId, { progress: 25, message: 'Validating data...' })
      
      if (selectedCustomer) {
        // Update existing customer
        updateLoading(operationId, { progress: 50, message: 'Updating customer...' })
        const updatedCustomer = await customerService.updateCustomer(selectedCustomer.id, data)
        
        updateCustomer(selectedCustomer.id, updatedCustomer)
        toast.success('Customer updated successfully!')
      } else {
        // Create new customer
        updateLoading(operationId, { progress: 50, message: 'Creating customer...' })
        const newCustomer = await customerService.createCustomer(data)
        
        addCustomer(newCustomer)
        toast.success('Customer created successfully!')
      }
      
      updateLoading(operationId, { progress: 100, message: 'Complete!' })
      resetForm()
      
      // Reload customers to ensure UI is in sync with data
      await loadCustomers()
      
    } catch (err) {
      console.error('💥 Error in handleSubmit:', err)
      toast.error('Failed to save customer. Please try again.')
    } finally {
      finishLoading(operationId)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return
    }
    
    const operationId = 'delete-customer-' + Date.now()
    startLoading(operationId, { message: 'Deleting customer...' })
    
    try {
      updateLoading(operationId, { progress: 50, message: 'Removing customer...' })
      
      await customerService.deleteCustomer(customer.id)
      
      removeCustomer(customer.id)
      updateLoading(operationId, { progress: 100, message: 'Complete!' })
      toast.success('Customer deleted successfully!')
      
    } catch (err) {
      console.error('💥 Error in handleDelete:', err)
      toast.error('Failed to delete customer. Please try again.')
    } finally {
      finishLoading(operationId)
    }
  }

  const validateForm = () => {
    // Use the form validation service
    const validationResult = formValidationService.validateForm('customer', formData);
    
    if (!validationResult.isValid) {
      setFormErrors(validationResult.errors);
      return false;
    }
    
    setFormErrors({});
    return true;
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
      status: 'prospect',
      responsible_person: 'Mr. Ali'
    })
    setFormErrors({})
    setIsSubmitting(false)
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedCustomer(null)
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
      notes: customer.notes,
      status: customer.status,
      responsible_person: customer.responsible_person || 'Mr. Ali'
    })
    setShowEditModal(true)
  }

  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter(customer => {
    if (!customer) return false
    
    const matchesSearch = (customer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (customer.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'prospect': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer relationships</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              if (!user?.id) {
                toast.error('Please log in to run tests')
                return
              }
              
              setIsRunningTests(true)
              try {
                console.log('🚀 Starting comprehensive CRM test suite...')
                toast.info('Running comprehensive tests... Check console for details')
                
                const report = await runComprehensiveTests(user.id)
                
                // Show summary toast
                if (report.failed === 0) {
                  toast.success(`All tests passed! ${report.passed}/${report.totalTests} successful`)
                } else {
                  toast.error(`${report.failed} tests failed. Check console for details.`)
                }
                
                // Refresh customers to show demo data
                await loadCustomers()
                
              } catch (error) {
                console.error('Test suite error:', error)
                toast.error('Test suite failed to run')
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
                toast.error('Please log in to add demo data')
                return
              }
              
              try {
                await addDemoData(user.id)
                await loadCustomers()
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
          <Button
            onClick={async () => {
              if (!user?.id) {
                toast.error('Please log in to clear data')
                return
              }
              
              if (confirm('Are you sure you want to clear all demo data?')) {
                try {
                  await clearDemoData()
                  await loadCustomers()
                } catch (error) {
                  console.error('Clear data error:', error)
                }
              }
            }}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Demo Data</span>
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2" id="add-customer-button" data-testid="add-customer-button">
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="customers-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'prospect')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="customer-status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>

        {/* Customer List */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading customers...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>All your customers in one place</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by adding your first customer'
                  }
                </p>
                <Button onClick={() => setShowAddModal(true)} data-testid="add-customer-empty-state">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        {customer.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.company && (
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>{customer.company}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{customer.address}</span>
                          </div>
                        )}
                      </div>
                      
                      {customer.notes && (
                        <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {customer.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setShowExportModal(true)
                        }}
                        data-testid="export-fields-button"
                        title="Manage Export Fields"
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(customer)}
                        data-testid="edit-customer-button"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        className="text-red-600 hover:text-red-700"
                        data-testid="delete-customer-button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Add/Edit Customer Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {showEditModal ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              
              <ValidatedForm
                schema="customer"
                initialData={formData}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {(formProps) => (
                  <>
                    <ValidatedInput
                      field="name"
                      label="Name *"
                      type="text"
                      required
                      formProps={formProps}
                      data-testid="customer-name-input"
                    />
                    
                    <ValidatedInput
                      field="email"
                      label="Email"
                      type="email"
                      formProps={formProps}
                      data-testid="customer-email-input"
                    />
                    
                    <ValidatedInput
                      field="phone"
                      label="Phone"
                      type="tel"
                      formProps={formProps}
                      data-testid="customer-phone-input"
                    />
                    
                    <ValidatedInput
                      field="company"
                      label="Company"
                      type="text"
                      formProps={formProps}
                      data-testid="customer-company-input"
                    />
                    
                    <ValidatedInput
                      field="address"
                      label="Address"
                      type="text"
                      formProps={formProps}
                      data-testid="customer-address-input"
                    />
                    
                    <ValidatedSelect
                      field="status"
                      label="Status"
                      options={[
                        { value: 'prospect', label: 'Prospect' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                      ]}
                      formProps={formProps}
                      data-testid="customer-status-select"
                    />
                    
                    <ValidatedSelect
                      field="source"
                      label="Source"
                      options={[
                        { value: 'Website', label: 'Website' },
                        { value: 'Referral', label: 'Referral' },
                        { value: 'Social Media', label: 'Social Media' },
                        { value: 'Cold Call', label: 'Cold Call' },
                        { value: 'Email Campaign', label: 'Email Campaign' },
                        { value: 'Trade Show', label: 'Trade Show' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      formProps={formProps}
                      data-testid="customer-source-select"
                    />
                    
                    <ValidatedSelect
                      field="responsible_person"
                      label="Responsible Person *"
                      options={[
                        { value: 'Mr. Ali', label: 'Mr. Ali' },
                        { value: 'Mr. Mustafa', label: 'Mr. Mustafa' },
                        { value: 'Mr. Taha', label: 'Mr. Taha' },
                        { value: 'Mr. Mohammed', label: 'Mr. Mohammed' }
                      ]}
                      required
                      formProps={formProps}
                      data-testid="customer-responsible-person-select"
                    />
                    
                    <ValidatedTextarea
                      field="notes"
                      label="Notes"
                      rows={3}
                      formProps={formProps}
                      data-testid="customer-notes-textarea"
                    />
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={resetForm} data-testid="customer-cancel-button">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={formProps.isSubmitting || loading} data-testid="customer-save-button">
                        {formProps.isSubmitting || loading ? 'Saving...' : (showEditModal ? 'Update' : 'Add')} Customer
                      </Button>
                    </div>
                  </>
                )}
              </ValidatedForm>
            </div>
          </div>
        </div>
      )}

      {/* Export Fields Modal */}
      {showExportModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    China Export Fields - {selectedCustomer.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Manage export-specific business information and compliance requirements
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExportModal(false)
                    setSelectedCustomer(null)
                  }}
                >
                  Close
                </Button>
              </div>
              
              <ExportFieldsForm
                customerId={selectedCustomer.id}
                onSave={() => {
                  toast.success('Export fields updated successfully')
                  setShowExportModal(false)
                  setSelectedCustomer(null)
                }}
                onCancel={() => {
                  setShowExportModal(false)
                  setSelectedCustomer(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}