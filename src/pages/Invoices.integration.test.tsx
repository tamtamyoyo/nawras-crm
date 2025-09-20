import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Invoices } from './Invoices';
import { supabase } from '../lib/supabase-client';
import userEvent from '@testing-library/user-event';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock PDF generator
vi.mock('../utils/pdf-generator', () => ({
  generateInvoicePDF: vi.fn(),
  generateBatchInvoices: vi.fn(),
}));

// Mock toast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockInvoices = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2024-001',
    customer_id: 'cust-001',
    customer_name: 'Acme Corp',
    amount: 1500.00,
    status: 'pending',
    created_at: '2024-01-15T10:00:00Z',
    due_date: '2024-02-15',
    items: [
      { id: 'item-001', description: 'Product A', quantity: 2, price: 500.00, total: 1000.00 },
      { id: 'item-002', description: 'Product B', quantity: 1, price: 500.00, total: 500.00 },
    ],
    customer: {
      id: 'cust-001',
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '+1-555-0123',
      address: '123 Business St, City, State 12345',
      export_licenses: [
        { license_number: 'EXP-001', expiry_date: '2024-12-31', issuing_authority: 'Commerce Dept' }
      ],
      hs_codes: ['8471.30.01', '8471.41.01'],
      export_ports: ['Shanghai', 'Shenzhen'],
      target_markets: ['North America', 'Europe'],
      certificates: ['CE', 'ISO9001'],
      incoterms: ['FOB', 'CIF']
    }
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-2024-002',
    customer_id: 'cust-002',
    customer_name: 'Tech Solutions Ltd',
    amount: 2750.50,
    status: 'paid',
    created_at: '2024-01-20T14:30:00Z',
    due_date: '2024-02-20',
    items: [
      { id: 'item-003', description: 'Service Package', quantity: 1, price: 2750.50, total: 2750.50 },
    ],
    customer: {
      id: 'cust-002',
      name: 'Tech Solutions Ltd',
      email: 'info@techsolutions.com',
      phone: '+1-555-0456',
      address: '456 Tech Ave, Innovation City, State 67890',
      export_licenses: [],
      hs_codes: ['8523.49.20'],
      export_ports: ['Ningbo'],
      target_markets: ['Southeast Asia'],
      certificates: ['FCC', 'ROHS'],
      incoterms: ['EXW']
    }
  },
];

const mockCustomers = [
  {
    id: 'cust-001',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    company: 'Acme Corporation',
    address: '123 Business St, City, State 12345',
    status: 'active',
    source: 'website',
  },
  {
    id: 'cust-002',
    name: 'Tech Solutions Ltd',
    email: 'info@techsolutions.com',
    phone: '+1-555-0456',
    company: 'Tech Solutions Limited',
    address: '456 Tech Ave, Innovation City, State 67890',
    status: 'active',
    source: 'referral',
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Invoices Integration Tests', () => {
  const mockSupabaseQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-001', email: 'test@example.com' } },
      error: null,
    });

    // Mock Supabase queries
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery as unknown as ReturnType<typeof supabase.from>);
    
    // Default successful responses
    mockSupabaseQuery.select.mockResolvedValue({
      data: mockInvoices,
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should load and display invoices with export information', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
    });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions Ltd')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('$2,750.50')).toBeInTheDocument();
  });

  it('should create new invoice with export fields integration', async () => {
    const user = userEvent.setup();
    
    // Mock customers query for the form
    mockSupabaseQuery.select.mockImplementation((fields) => {
      if (fields?.includes('customers')) {
        return Promise.resolve({ data: mockCustomers, error: null });
      }
      return Promise.resolve({ data: mockInvoices, error: null });
    });

    // Mock successful invoice creation
    mockSupabaseQuery.insert.mockResolvedValue({
      data: [{ id: 'inv-003', invoice_number: 'INV-2024-003' }],
      error: null,
    });

    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    // Click create invoice button
    const createButton = screen.getByText('Create Invoice');
    fireEvent.click(createButton);

    // Fill in invoice form
    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Select customer
    const customerSelect = screen.getByLabelText('Customer');
    await user.selectOptions(customerSelect, 'cust-001');

    // Add invoice items
    const addItemButton = screen.getByText('Add Item');
    fireEvent.click(addItemButton);

    const descriptionInput = screen.getByLabelText('Description');
    const quantityInput = screen.getByLabelText('Quantity');
    const priceInput = screen.getByLabelText('Price');

    await user.type(descriptionInput, 'Export Product');
    await user.type(quantityInput, '5');
    await user.type(priceInput, '200.00');

    // Set due date
    const dueDateInput = screen.getByLabelText('Due Date');
    await user.type(dueDateInput, '2024-03-15');

    // Submit form
    const submitButton = screen.getByText('Create Invoice');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'cust-001',
          amount: 1000.00, // 5 * 200.00
          due_date: '2024-03-15',
          status: 'pending',
        })
      );
    });
  });

  it('should handle batch download with export customization', async () => {
    
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    // Select multiple invoices
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First invoice
    fireEvent.click(checkboxes[2]); // Second invoice

    // Click batch download
    const batchDownloadButton = screen.getByText('Batch Download');
    fireEvent.click(batchDownloadButton);

    await waitFor(() => {
      expect(screen.getByText('Batch Download Invoices')).toBeInTheDocument();
    });

    // Verify selected invoices are shown
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-002')).toBeInTheDocument();

    // Change export format to Excel
    const excelRadio = screen.getByLabelText('Excel');
    fireEvent.click(excelRadio);

    // Download selected invoices
    const downloadButton = screen.getByText('Download Selected (2)');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });
  });

  it('should customize PDF with export-specific branding', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    // Click on first invoice's download button
    const downloadButtons = screen.getAllByText('Download');
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Customize PDF Export')).toBeInTheDocument();
    });

    // Change template to Professional (suitable for export documents)
    const professionalTemplate = screen.getByLabelText('Professional');
    fireEvent.click(professionalTemplate);

    // Set custom header for export compliance
    const headerInput = screen.getByLabelText('Custom Header:');
    await user.type(headerInput, 'EXPORT INVOICE - FOR CUSTOMS CLEARANCE');

    // Enable watermark for document security
    const watermarkToggle = screen.getByLabelText('Enable Watermark');
    fireEvent.click(watermarkToggle);

    const watermarkText = screen.getByLabelText('Watermark Text:');
    await user.type(watermarkText, 'ORIGINAL');

    // Set page size to A4 (international standard)
    const a4Size = screen.getByLabelText('A4');
    fireEvent.click(a4Size);

    // Generate preview
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Generating Preview...')).toBeInTheDocument();
    });

    // Download with custom settings
    const downloadButton = screen.getByText('Download PDF');
    fireEvent.click(downloadButton);

    // Verify the download was called with export-optimized settings
    await waitFor(() => {
      expect(screen.queryByText('Customize PDF Export')).not.toBeInTheDocument();
    });
  });

  it('should filter invoices by export status and customer', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
    });

    // Filter by status
    const statusFilter = screen.getByLabelText('Filter by Status');
    await user.selectOptions(statusFilter, 'pending');

    // Should only show pending invoices
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    expect(screen.queryByText('INV-2024-002')).not.toBeInTheDocument();

    // Clear status filter and filter by customer
    await user.selectOptions(statusFilter, 'all');
    
    const customerFilter = screen.getByLabelText('Filter by Customer');
    await user.selectOptions(customerFilter, 'cust-002');

    // Should only show Tech Solutions invoices
    expect(screen.queryByText('INV-2024-001')).not.toBeInTheDocument();
    expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
  });

  it('should handle invoice editing with export field updates', async () => {
    const user = userEvent.setup();
    
    // Mock single invoice query for editing
    mockSupabaseQuery.single.mockResolvedValue({
      data: mockInvoices[0],
      error: null,
    });

    // Mock successful update
    mockSupabaseQuery.update.mockResolvedValue({
      data: [{ ...mockInvoices[0], amount: 1750.00 }],
      error: null,
    });

    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    // Click edit button for first invoice
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Invoice')).toBeInTheDocument();
    });

    // Modify invoice amount by adding an item
    const addItemButton = screen.getByText('Add Item');
    fireEvent.click(addItemButton);

    const newDescriptionInput = screen.getAllByLabelText('Description').pop();
    const newQuantityInput = screen.getAllByLabelText('Quantity').pop();
    const newPriceInput = screen.getAllByLabelText('Price').pop();

    if (newDescriptionInput && newQuantityInput && newPriceInput) {
      await user.type(newDescriptionInput, 'Export Documentation Fee');
      await user.type(newQuantityInput, '1');
      await user.type(newPriceInput, '250.00');
    }

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1750.00, // Original 1500 + new 250
        })
      );
    });
  });

  it('should display export compliance information in invoice details', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    // Click on invoice to view details
    const invoiceRow = screen.getByText('INV-2024-001');
    fireEvent.click(invoiceRow);

    await waitFor(() => {
      expect(screen.getByText('Invoice Details')).toBeInTheDocument();
    });

    // Verify export information is displayed
    expect(screen.getByText('Export License: EXP-001')).toBeInTheDocument();
    expect(screen.getByText('HS Codes: 8471.30.01, 8471.41.01')).toBeInTheDocument();
    expect(screen.getByText('Export Ports: Shanghai, Shenzhen')).toBeInTheDocument();
    expect(screen.getByText('Target Markets: North America, Europe')).toBeInTheDocument();
    expect(screen.getByText('Certificates: CE, ISO9001')).toBeInTheDocument();
    expect(screen.getByText('Incoterms: FOB, CIF')).toBeInTheDocument();
  });

  it('should handle error states gracefully', async () => {
    // Mock error response
    mockSupabaseQuery.select.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
    });

    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading invoices')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    // Verify retry button is available
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should validate export compliance before invoice creation', async () => {
    const user = userEvent.setup();
    
    // Mock customer without export licenses
    const customerWithoutExport = {
      ...mockCustomers[0],
      export_licenses: [],
    };

    mockSupabaseQuery.select.mockImplementation((fields) => {
      if (fields?.includes('customers')) {
        return Promise.resolve({ data: [customerWithoutExport], error: null });
      }
      return Promise.resolve({ data: mockInvoices, error: null });
    });

    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    // Try to create invoice for customer without export license
    const createButton = screen.getByText('Create Invoice');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    const customerSelect = screen.getByLabelText('Customer');
    await user.selectOptions(customerSelect, customerWithoutExport.id);

    // Should show export compliance warning
    expect(screen.getByText('Warning: Customer has no export licenses on file')).toBeInTheDocument();
    expect(screen.getByText('This may affect international shipping and customs clearance')).toBeInTheDocument();
  });
});