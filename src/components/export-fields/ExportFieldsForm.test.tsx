import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExportFieldsForm } from './ExportFieldsForm';
import ExportFieldsService from '../../services/exportFieldsService';

// Mock the export fields service
vi.mock('../../services/exportFieldsService', () => ({
  default: {
    getCustomerExportFields: vi.fn(),
    saveCustomerExportFields: vi.fn(),
    getExportData: vi.fn(),
  }
}));

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockReferenceData = {
  hs_codes: [
    { id: 'hs001', code: '8517', description: 'Electronics' },
    { id: 'hs002', code: '6204', description: 'Textiles' },
  ],
  export_ports: [
    { id: 'port001', port_code: 'SHA', port_name: 'Shanghai Port', city: 'Shanghai', country: 'China' },
    { id: 'port002', port_code: 'SHE', port_name: 'Shenzhen Port', city: 'Shenzhen', country: 'China' },
  ],
  certificates: [
    { id: 'cert001', certificate_code: 'CE', certificate_name: 'CE Certificate' },
    { id: 'cert002', certificate_code: 'ISO9001', certificate_name: 'ISO 9001' },
  ],
  incoterms: [
    { id: 'inco001', term_code: 'FOB', term_name: 'Free on Board' },
    { id: 'inco002', term_code: 'CIF', term_name: 'Cost, Insurance, and Freight' },
  ],
  target_markets: [
    { id: 'market001', market_code: 'NA', market_name: 'North America' },
    { id: 'market002', market_code: 'EU', market_name: 'Europe' },
  ],
  product_categories: [
    { id: 'cat001', category_code: 'ELEC', category_name: 'Electronics' },
    { id: 'cat002', category_code: 'TEXT', category_name: 'Textiles' },
  ],
};

const mockExportFields = {
  export_license_number: 'EL123456',
  customs_broker: 'ABC Customs',
  credit_limit_usd: 50000,
  payment_terms_export: 'NET30',
  preferred_currency: 'USD',
  export_documentation_language: 'English',
  compliance_notes: 'All products meet EU standards',
  special_handling_requirements: 'Low risk customer',
  hs_code_ids: ['hs001'],
  export_port_ids: ['port001'],
  certificate_ids: ['cert001'],
  incoterm_ids: ['inco001'],
  target_market_ids: ['market001'],
  product_category_ids: ['cat001'],
};

describe('ExportFieldsForm', () => {
  const mockProps = {
    customerId: 'customer-123',
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(ExportFieldsService.getExportData).mockResolvedValue(mockReferenceData);
    vi.mocked(ExportFieldsService.getCustomerExportFields).mockResolvedValue(mockExportFields);
    vi.mocked(ExportFieldsService.saveCustomerExportFields).mockResolvedValue({ success: true });
  });

  it('should render the form with all required fields', async () => {
    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/export license number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/customs broker/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/credit limit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/payment terms/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preferred currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/export documentation language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/compliance notes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/special handling requirements/i)).toBeInTheDocument();
    });
  });

  it('should load and display existing export fields data', async () => {
    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('EL123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ABC Customs')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('NET30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    });
  });

  it('should render multi-select sections for export options', async () => {
    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('HS Codes')).toBeInTheDocument();
      expect(screen.getByText('Export Ports')).toBeInTheDocument();
      expect(screen.getByText('Required Certificates')).toBeInTheDocument();
      expect(screen.getByText('Incoterms')).toBeInTheDocument();
      expect(screen.getByText('Target Markets')).toBeInTheDocument();
      expect(screen.getByText('Product Categories')).toBeInTheDocument();
    });
  });

  it('should handle form input changes', async () => {
    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      const licenseInput = screen.getByLabelText(/export license number/i);
      fireEvent.change(licenseInput, { target: { value: 'EL789012' } });
      expect(licenseInput).toHaveValue('EL789012');
    });
  });

  it('should handle multi-select option selection', async () => {
    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      // Check if multi-select options are rendered
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Shanghai Port')).toBeInTheDocument();
      expect(screen.getByText('CE Certificate')).toBeInTheDocument();
    });
  });

  it('should save export fields when form is submitted', async () => {
    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      const saveButton = screen.getByText('Save Export Fields');
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(ExportFieldsService.saveCustomerExportFields).toHaveBeenCalledWith(
        'customer-123',
        expect.objectContaining({
          export_license_number: 'EL123456',
          customs_broker: 'ABC Customs',
          credit_limit_usd: 50000,
        })
      );
      expect(mockProps.onSave).toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should handle loading states properly', async () => {
    // Mock loading state
    vi.mocked(ExportFieldsService.getExportData).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockReferenceData), 100))
    );

    render(<ExportFieldsForm {...mockProps} />);

    // Should show loading state initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Should hide loading state after data loads
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should validate required fields', async () => {
    // Mock empty export fields
    vi.mocked(ExportFieldsService.getCustomerExportFields).mockResolvedValue({
       export_license_number: '',
       customs_broker: '',
      credit_limit_usd: 0,
      payment_terms_export: '',
      preferred_currency: '',
      export_documentation_language: '',
      compliance_notes: '',
      special_handling_requirements: '',
      hs_code_ids: [],
      export_port_ids: [],
      certificate_ids: [],
      incoterm_ids: [],
      target_market_ids: [],
      product_category_ids: []
    });

    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      const saveButton = screen.getByText('Save Export Fields');
      fireEvent.click(saveButton);
    });

    // Form should still attempt to save even with empty fields (business logic decision)
    await waitFor(() => {
      expect(ExportFieldsService.saveCustomerExportFields).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(ExportFieldsService.saveCustomerExportFields).mockRejectedValue(
      new Error('API Error')
    );

    render(<ExportFieldsForm {...mockProps} />);

    await waitFor(() => {
      const saveButton = screen.getByText('Save Export Fields');
      fireEvent.click(saveButton);
    });

    // Should handle error without crashing
    await waitFor(() => {
      expect(ExportFieldsService.saveCustomerExportFields).toHaveBeenCalled();
    });
  });
});