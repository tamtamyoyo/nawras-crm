import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ExportFieldsForm } from '../ExportFieldsForm'
import { supabase } from '@/lib/supabase-client'
import type { CustomerExportFormData } from '@/types/export-types'

// Mock supabase
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}))

const mockHSCodes = [
  { id: 'hs-1', code: '8471.30', description: 'Portable digital automatic data processing machines' },
  { id: 'hs-2', code: '8471.41', description: 'Data processing machines' },
  { id: 'hs-3', code: '8471.49', description: 'Other data processing machines' }
]

const mockExportPorts = [
  { id: 'port-1', port_name: 'Shanghai Port', port_code: 'CNSHA', city: 'Shanghai', country: 'China', port_type: 'seaport', is_active: true },
  { id: 'port-2', port_name: 'Shenzhen Port', port_code: 'CNSZX', city: 'Shenzhen', country: 'China', port_type: 'seaport', is_active: true },
  { id: 'port-3', port_name: 'Beijing Capital Airport', port_code: 'CNPEK', city: 'Beijing', country: 'China', port_type: 'airport', is_active: true }
]

const mockCertificates = [
  { id: 'cert-1', certificate_name: 'CE Marking', certificate_code: 'CE', description: 'European Conformity', is_mandatory: true },
  { id: 'cert-2', certificate_name: 'FCC Certification', certificate_code: 'FCC', description: 'Federal Communications Commission', is_mandatory: false },
  { id: 'cert-3', certificate_name: 'ISO 9001', certificate_code: 'ISO9001', description: 'Quality Management System', is_mandatory: false }
]

const mockIncoterms = [
  { id: 'inco-1', term_code: 'FOB', term_name: 'Free On Board', description: 'Seller delivers goods on board' },
  { id: 'inco-2', term_code: 'CIF', term_name: 'Cost, Insurance and Freight', description: 'Seller pays for shipping and insurance' },
  { id: 'inco-3', term_code: 'EXW', term_name: 'Ex Works', description: 'Buyer collects from seller premises' }
]

const mockTargetMarkets = [
  { id: 'market-1', market_name: 'United States', market_code: 'US', region: 'North America', is_active: true },
  { id: 'market-2', market_name: 'European Union', market_code: 'EU', region: 'Europe', is_active: true },
  { id: 'market-3', market_name: 'Japan', market_code: 'JP', region: 'Asia', is_active: true }
]

const mockProductCategories = [
  { id: 'cat-1', category_name: 'Electronics', category_code: 'ELEC', description: 'Electronic devices and components' },
  { id: 'cat-2', category_name: 'Machinery', category_code: 'MACH', description: 'Industrial machinery and equipment' },
  { id: 'cat-3', category_name: 'Textiles', category_code: 'TEXT', description: 'Textile products and materials' }
]

const mockInitialData: CustomerExportFormData = {
  export_license_number: 'EXP-2024-001',
  customs_broker: 'Global Customs Services',
  credit_limit_usd: 100000,
  payment_terms_export: 'LC_30_days',
  preferred_currency: 'USD',
  export_documentation_language: 'English documentation required',
  compliance_notes: 'All certifications up to date',
  special_handling_requirements: 'medium',
  hs_code_ids: [mockHSCodes[0]],
  export_port_ids: [mockExportPorts[0]],
  certificate_ids: [mockCertificates[0]],
  incoterm_ids: [mockIncoterms[0]],
  target_market_ids: [mockTargetMarkets[0]],
  product_category_ids: [mockProductCategories[0]]
}

describe('ExportFieldsForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock supabase responses
    const mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
    
    vi.mocked(supabase.from).mockImplementation(mockSupabaseFrom)
    
    // Setup specific mock responses for each table
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const mockData = {
        'hs_codes': mockHSCodes,
        'export_ports': mockExportPorts,
        'certificates': mockCertificates,
        'incoterms': mockIncoterms,
        'target_markets': mockTargetMarkets,
        'product_categories': mockProductCategories
      }[table] || []
      
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      }
    })
  })

  it('renders form with all fields', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('China Export Business Fields')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Export License Number')).toBeInTheDocument()
    expect(screen.getByLabelText('Customs Broker')).toBeInTheDocument()
    expect(screen.getByLabelText('Credit Limit (USD)')).toBeInTheDocument()
    expect(screen.getByLabelText('Payment Terms')).toBeInTheDocument()
    expect(screen.getByLabelText('Preferred Currency')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Loading export fields...')).toBeInTheDocument()
  })

  it('loads initial data when provided', async () => {
    render(
      <ExportFieldsForm
        initialData={mockInitialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('EXP-2024-001')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Global Customs Services')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('LC_30_days')).toBeInTheDocument()
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
  })

  it('handles text input changes', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Export License Number')).toBeInTheDocument()
    })

    const licenseInput = screen.getByLabelText('Export License Number')
    fireEvent.change(licenseInput, { target: { value: 'NEW-LICENSE-123' } })

    expect(licenseInput).toHaveValue('NEW-LICENSE-123')
  })

  it('handles number input changes', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Credit Limit (USD)')).toBeInTheDocument()
    })

    const creditInput = screen.getByLabelText('Credit Limit (USD)')
    fireEvent.change(creditInput, { target: { value: '50000' } })

    expect(creditInput).toHaveValue(50000)
  })

  it('handles select input changes', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Payment Terms')).toBeInTheDocument()
    })

    const paymentSelect = screen.getByLabelText('Payment Terms')
    fireEvent.change(paymentSelect, { target: { value: 'TT_advance' } })

    expect(paymentSelect).toHaveValue('TT_advance')
  })

  it('handles currency selection', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Preferred Currency')).toBeInTheDocument()
    })

    const currencySelect = screen.getByLabelText('Preferred Currency')
    fireEvent.change(currencySelect, { target: { value: 'EUR' } })

    expect(currencySelect).toHaveValue('EUR')
  })

  it('handles textarea changes', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Compliance Notes')).toBeInTheDocument()
    })

    const complianceTextarea = screen.getByLabelText('Compliance Notes')
    fireEvent.change(complianceTextarea, { target: { value: 'Updated compliance notes' } })

    expect(complianceTextarea).toHaveValue('Updated compliance notes')
  })

  it('handles risk assessment selection', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Risk Assessment')).toBeInTheDocument()
    })

    const riskSelect = screen.getByLabelText('Risk Assessment')
    fireEvent.change(riskSelect, { target: { value: 'high' } })

    expect(riskSelect).toHaveValue('high')
  })

  it('renders multi-select sections', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('HS Codes')).toBeInTheDocument()
    })

    expect(screen.getByText('Export Ports')).toBeInTheDocument()
    expect(screen.getByText('Required Certificates')).toBeInTheDocument()
    expect(screen.getByText('Incoterms')).toBeInTheDocument()
    expect(screen.getByText('Target Markets')).toBeInTheDocument()
    expect(screen.getByText('Product Categories')).toBeInTheDocument()
  })

  it('handles multi-select item selection', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('8471.30')).toBeInTheDocument()
    })

    const hsCodeButton = screen.getByText('8471.30')
    fireEvent.click(hsCodeButton)

    // Should show selected badge
    await waitFor(() => {
      expect(hsCodeButton).toHaveClass('bg-blue-100')
    })
  })

  it('handles multi-select item deselection', async () => {
    render(
      <ExportFieldsForm
        initialData={mockInitialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('8471.30')).toBeInTheDocument()
    })

    const hsCodeButton = screen.getByText('8471.30')
    fireEvent.click(hsCodeButton)

    // Should remove selection
    await waitFor(() => {
      expect(hsCodeButton).not.toHaveClass('bg-blue-100')
    })
  })

  it('shows selected items as badges', async () => {
    render(
      <ExportFieldsForm
        initialData={mockInitialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      // Should show badges for initially selected items
      const badges = screen.getAllByRole('button')
      const badgeWithX = badges.find(badge => 
        badge.querySelector('svg') && 
        badge.textContent?.includes('8471.30')
      )
      expect(badgeWithX).toBeInTheDocument()
    })
  })

  it('handles badge removal', async () => {
    render(
      <ExportFieldsForm
        initialData={mockInitialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      const badges = screen.getAllByRole('button')
      const badgeWithX = badges.find(badge => 
        badge.querySelector('svg') && 
        badge.textContent?.includes('8471.30')
      )
      expect(badgeWithX).toBeInTheDocument()
    })

    // Find and click the X button in the badge
    const badges = screen.getAllByRole('button')
    const badgeWithX = badges.find(badge => 
      badge.querySelector('svg') && 
      badge.textContent?.includes('8471.30')
    )
    
    if (badgeWithX) {
      fireEvent.click(badgeWithX)
      
      await waitFor(() => {
        const updatedBadges = screen.getAllByRole('button')
        const removedBadge = updatedBadges.find(badge => 
          badge.querySelector('svg') && 
          badge.textContent?.includes('8471.30')
        )
        expect(removedBadge).not.toBeInTheDocument()
      })
    }
  })

  it('calls onSave when save button is clicked', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Export Fields')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Save Export Fields')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      export_license_number: '',
      customs_broker: '',
      credit_limit_usd: 0,
      payment_terms_export: '',
      preferred_currency: 'USD'
    }))
  })

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('shows saving state when save is in progress', async () => {
    const slowSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <ExportFieldsForm
        onSave={slowSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Export Fields')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Save Export Fields')
    fireEvent.click(saveButton)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
  })

  it('disables buttons during save', async () => {
    const slowSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <ExportFieldsForm
        onSave={slowSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Export Fields')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Save Export Fields')
    const cancelButton = screen.getByText('Cancel')
    
    fireEvent.click(saveButton)

    expect(saveButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })

  it('handles save errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errorSave = vi.fn(() => Promise.reject(new Error('Save failed')))
    
    render(
      <ExportFieldsForm
        onSave={errorSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Export Fields')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Save Export Fields')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error saving export fields:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('handles reference data loading errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock supabase to return error
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.reject(new Error('Database error'))),
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.reject(new Error('Database error')))
        }))
      }))
    }))
    
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading reference data:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('handles invalid number inputs', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Credit Limit (USD)')).toBeInTheDocument()
    })

    const creditInput = screen.getByLabelText('Credit Limit (USD)')
    fireEvent.change(creditInput, { target: { value: 'invalid' } })

    expect(creditInput).toHaveValue(0)
  })

  it('renders all payment terms options', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Payment Terms')).toBeInTheDocument()
    })

    const paymentSelect = screen.getByLabelText('Payment Terms')
    expect(paymentSelect).toBeInTheDocument()
    
    // Check that options exist in the select
    expect(screen.getByText('LC at Sight')).toBeInTheDocument()
    expect(screen.getByText('TT in Advance')).toBeInTheDocument()
    expect(screen.getByText('Open Account')).toBeInTheDocument()
  })

  it('renders all currency options', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Preferred Currency')).toBeInTheDocument()
    })

    const currencySelect = screen.getByLabelText('Preferred Currency')
    expect(currencySelect).toBeInTheDocument()
    
    // Check that currency options exist
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
  })

  it('renders all risk assessment options', async () => {
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Risk Assessment')).toBeInTheDocument()
    })

    const riskSelect = screen.getByLabelText('Risk Assessment')
    expect(riskSelect).toBeInTheDocument()
    
    // Check that risk options exist
    expect(screen.getByText('Low Risk')).toBeInTheDocument()
    expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
    expect(screen.getByText('Critical Risk')).toBeInTheDocument()
  })

  it('handles empty reference data gracefully', async () => {
    // Mock empty responses
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
    
    render(
      <ExportFieldsForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('China Export Business Fields')).toBeInTheDocument()
    })

    // Form should still render even with empty reference data
    expect(screen.getByText('HS Codes')).toBeInTheDocument()
    expect(screen.getByText('Export Ports')).toBeInTheDocument()
  })
})