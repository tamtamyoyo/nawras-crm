import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, Building, MapPin, TestTube, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase-client'
import { offlineDataService } from '../services/offlineDataService'
import { devConfig } from '../config/development'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuthHook'
import { toast } from 'sonner'
import { runComprehensiveTests } from '../utils/test-runner'
import { addDemoData, clearDemoData } from '../utils/demo-data'
import { ExportFieldsForm } from '../components/export-fields/ExportFieldsForm'
import { isOfflineMode, handleSupabaseError, protectFromExtensionInterference } from '../utils/offlineMode'
import type { Database } from '../lib/database.types'


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

  const loadCustomers = useCallback(async () => {
    console.log('🔄 Starting loadCustomers function');
    setLoading(true);
    
    // Protect from browser extension interference
    protectFromExtensionInterference();
    
    try {
      // Check if we're in offline mode
      const offlineMode = isOfflineMode()
      console.log('🔧 [Customers] Loading data - offlineMode:', offlineMode)
      
      if (offlineMode) {
        console.log('📱 Loading customers from offline service')
        const customersData = await offlineDataService.getCustomers()
        console.log('✅ Customers loaded from offline service:', customersData);
        setCustomers(customersData);
        toast.success('Customers loaded (offline mode)')
      } else {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('💥 Supabase error:', error);
          throw error;
        }
        
        console.log('✅ Customers loaded from Supabase:', data);
        setCustomers(data || []);
      }
    } catch (err) {
      console.error('💥 Error in loadCustomers:', err);
      
      // Use enhanced error handling
      const shouldFallback = handleSupabaseError(err, 'customer loading');
      
      if (shouldFallback) {
        try {
          console.log('🔄 Falling back to offline mode due to error')
          const fallbackData = await offlineDataService.getCustomers()
          setCustomers(fallbackData);
          toast.warning('Using offline data due to connection issues')
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError)
          toast.error('Failed to load customers. Please try again.');
        }
      } else {
        toast.error('Failed to load customers. Please try again.');
      }
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [setCustomers, setLoading]);

  useEffect(() => {
    console.log('🔥 useEffect triggered - calling loadCustomers')
    loadCustomers()
  }, [loadCustomers])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setLoading(true)

    try {
      console.log('💾 Starting customer save operation...');
      
      // Protect from browser extension interference
      protectFromExtensionInterference();
      
      // Check if we're in offline mode
      const offlineMode = isOfflineMode()
      console.log('🔧 [Customers] Saving data - offlineMode:', offlineMode)
      
      if (offlineMode) {
        if (showEditModal && selectedCustomer) {
          // Update existing customer in offline storage
          console.log('✏️ Updating customer in offline storage...');
          const updatedCustomer = await offlineDataService.updateCustomer(selectedCustomer.id, {
            ...formData,
            updated_at: new Date().toISOString()
          });
          
          updateCustomer(selectedCustomer.id, updatedCustomer);
          toast.success('Customer updated successfully (offline)');
          console.log('✅ Customer updated offline:', updatedCustomer);
        } else {
          // Create new customer in offline storage
          console.log('➕ Creating new customer in offline storage...');
          const newCustomer = await offlineDataService.createCustomer({
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            company: formData.company || '',
            address: formData.address || '',
            status: (formData.status as 'active' | 'inactive' | 'prospect') || 'prospect',
            source: formData.source || 'Other',
            tags: formData.tags || null,
            notes: formData.notes || '',
            responsible_person: formData.responsible_person || 'Mr. Ali',
            created_by: user?.id || null, // Use null for anonymous users
            // Export-specific fields
            export_license_number: null,
            export_license_expiry: null,
            customs_broker: null,
            preferred_currency: null,
            payment_terms_export: null,
            credit_limit_usd: null,
            export_documentation_language: null,
            special_handling_requirements: null,
            compliance_notes: null
          });
          
          addCustomer(newCustomer);
          toast.success('Customer added successfully (offline)');
          console.log('✅ Customer created offline:', newCustomer);
        }
      } else {
        if (showEditModal && selectedCustomer) {
          // Update existing customer
          console.log('✏️ Updating customer in Supabase...');
          const { data, error } = await supabase
            .from('customers')
            .update({
              ...formData,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedCustomer.id)
            .select()
            .single();
          
          if (error) throw error;
          
          updateCustomer(selectedCustomer.id, data);
          toast.success('Customer updated successfully');
          console.log('✅ Customer updated:', data);
        } else {
          // Create new customer
          console.log('➕ Creating new customer in Supabase...');
          const { data, error } = await supabase
            .from('customers')
            .insert({
              ...formData,
              created_by: user?.id || null // Use null for anonymous users
            })
            .select()
            .single();
          
          if (error) throw error;
          
          addCustomer(data);
          toast.success('Customer added successfully');
          console.log('✅ Customer created:', data);
        }
      }

      resetForm()
    } catch (error) {
      console.error('Error saving customer:', error)
      
      // Use enhanced error handling
      const shouldFallback = handleSupabaseError(error, 'customer saving');
      
      if (shouldFallback) {
        try {
          console.log('🔄 Falling back to offline mode for save operation')
        if (showEditModal && selectedCustomer) {
          const updatedCustomer = await offlineDataService.updateCustomer(selectedCustomer.id, {
            ...formData,
            updated_at: new Date().toISOString()
          });
          updateCustomer(selectedCustomer.id, updatedCustomer);
          toast.warning('Customer updated using offline storage')
        } else {
          const newCustomer = await offlineDataService.createCustomer({
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            company: formData.company || '',
            address: formData.address || '',
            status: (formData.status as 'active' | 'inactive' | 'prospect') || 'prospect',
            source: formData.source || 'Other',
            tags: formData.tags || null,
            notes: formData.notes || '',
            responsible_person: formData.responsible_person || 'Mr. Ali',
            created_by: user?.id || null, // Use null for anonymous users
            export_license_number: null,
            export_license_expiry: null,
            customs_broker: null,
            preferred_currency: null,
            payment_terms_export: null,
            credit_limit_usd: null,
            export_documentation_language: null,
            special_handling_requirements: null,
            compliance_notes: null
          });
          addCustomer(newCustomer);
          toast.warning('Customer added using offline storage')
        }
          resetForm()
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError)
          toast.error('Failed to save customer')
        }
      } else {
        toast.error('Failed to save customer')
      }
    } finally {
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) return

    try {
      setLoading(true)
      
      // Protect from browser extension interference
      protectFromExtensionInterference();
      
      // Check if we're in offline mode
      const offlineMode = isOfflineMode()
      console.log('🔧 [Customers] Deleting data - offlineMode:', offlineMode)
      
      if (offlineMode) {
        console.log('🗑️ Deleting customer from offline storage...');
        await offlineDataService.deleteCustomer(customer.id);
        removeCustomer(customer.id)
        toast.success('Customer deleted successfully (offline)')
        console.log('✅ Customer deleted offline:', customer.name);
      } else {
        console.log('🗑️ Deleting customer from Supabase...');
        
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', customer.id);
        
        if (error) throw error;
        
        removeCustomer(customer.id)
        toast.success('Customer deleted successfully')
        console.log('✅ Customer deleted:', customer.name);
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      
      // Use enhanced error handling
      const shouldFallback = handleSupabaseError(error, 'customer deletion');
      
      if (shouldFallback) {
        try {
          console.log('🔄 Falling back to offline mode for delete operation')
          await offlineDataService.deleteCustomer(customer.id);
          removeCustomer(customer.id)
          toast.warning('Customer deleted using offline storage')
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError)
          toast.error('Failed to delete customer')
        }
      } else {
        toast.error('Failed to delete customer')
      }
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name?.trim()) {
      errors.name = 'Name is required'
    }
    
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
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

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
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
                  await clearDemoData(user.id)
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
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2" data-testid="add-customer-button">
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
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) {
                        setFormErrors({ ...formErrors, name: '' })
                      }
                    }}
                    className={formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                    data-testid="customer-name-input"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600" data-testid="customer-name-error">
                      {formErrors.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: '' })
                      }
                    }}
                    className={formErrors.email ? 'border-red-500 focus:ring-red-500' : ''}
                    data-testid="customer-email-input"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600" data-testid="customer-email-error">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="customer-phone-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <Input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    data-testid="customer-company-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="customer-address-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || 'prospect'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'prospect' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="customer-status-select"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select
                    value={formData.source || 'Other'}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="customer-source-select"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Email Campaign">Email Campaign</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsible Person *
                  </label>
                  <select
                    value={formData.responsible_person || 'Mr. Ali'}
                    onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="customer-responsible-person-select"
                    required
                  >
                    <option value="Mr. Ali">Mr. Ali</option>
                    <option value="Mr. Mustafa">Mr. Mustafa</option>
                    <option value="Mr. Taha">Mr. Taha</option>
                    <option value="Mr. Mohammed">Mr. Mohammed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="customer-notes-textarea"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} data-testid="customer-cancel-button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || loading} data-testid="customer-save-button">
                    {isSubmitting || loading ? 'Saving...' : (showEditModal ? 'Update' : 'Add')} Customer
                  </Button>
                </div>
              </form>
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