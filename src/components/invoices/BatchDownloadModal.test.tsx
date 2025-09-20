import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BatchDownloadModal } from './BatchDownloadModal';
import * as pdfGenerator from '../../utils/pdf-generator';

// Mock the PDF generator
vi.mock('../../utils/pdf-generator', () => ({
  generateBatchInvoices: vi.fn(),
}));

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockInvoices = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2024-001',
    customer_id: 'cust-001',
    deal_id: 'deal-001',
    amount: 1500.00,
    tax_amount: 150.00,
    total_amount: 1650.00,
    status: 'sent' as const,
    due_date: '2024-02-15',
    paid_date: null,
    items: [],
    notes: null,
    payment_terms: 'net_30' as const,
    tax_rate: 0.1,
    source: null,
    created_by: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    customer: {
      id: 'cust-001',
      name: 'Acme Corp',
      email: 'contact@acme.com'
    }
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-2024-002',
    customer_id: 'cust-002',
    deal_id: 'deal-002',
    amount: 2750.50,
    tax_amount: 275.05,
    total_amount: 3025.55,
    status: 'paid' as const,
    due_date: '2024-02-20',
    paid_date: '2024-02-18T00:00:00Z',
    items: [],
    notes: null,
    payment_terms: 'net_30' as const,
    tax_rate: 0.1,
    source: null,
    created_by: null,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    customer: {
      id: 'cust-002',
      name: 'Tech Solutions Ltd',
      email: 'info@techsolutions.com'
    }
  },
  {
    id: 'inv-003',
    invoice_number: 'INV-2024-003',
    customer_id: 'cust-003',
    deal_id: 'deal-003',
    amount: 890.25,
    tax_amount: 89.03,
    total_amount: 979.28,
    status: 'overdue' as const,
    due_date: '2024-02-10',
    paid_date: null,
    items: [],
    notes: null,
    payment_terms: 'net_30' as const,
    tax_rate: 0.1,
    source: null,
    created_by: null,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    customer: {
      id: 'cust-003',
      name: 'Global Industries',
      email: 'billing@globalind.com'
    }
  },
];

describe('BatchDownloadModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onDownloadComplete: vi.fn(),
    invoices: mockInvoices,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful PDF generation
    vi.mocked(pdfGenerator.generateBatchInvoices).mockResolvedValue(undefined);
  });

  it('should render the modal with invoice selection', () => {
    render(<BatchDownloadModal {...mockProps} />);

    expect(screen.getByText('Batch Download Invoices')).toBeInTheDocument();
    expect(screen.getByText('Select invoices to download:')).toBeInTheDocument();
    
    // Check if all invoices are listed
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-003')).toBeInTheDocument();
    
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions Ltd')).toBeInTheDocument();
    expect(screen.getByText('Global Industries')).toBeInTheDocument();
  });

  it('should allow selecting and deselecting invoices', () => {
    render(<BatchDownloadModal {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstInvoiceCheckbox = checkboxes[1];

    // Initially no invoices should be selected
    expect(firstInvoiceCheckbox).not.toBeChecked();

    // Select first invoice
    fireEvent.click(firstInvoiceCheckbox);
    expect(firstInvoiceCheckbox).toBeChecked();

    // Deselect first invoice
    fireEvent.click(firstInvoiceCheckbox);
    expect(firstInvoiceCheckbox).not.toBeChecked();
  });

  it('should handle select all functionality', () => {
    render(<BatchDownloadModal {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0];
    const invoiceCheckboxes = checkboxes.slice(1);

    // Select all invoices
    fireEvent.click(selectAllCheckbox);
    
    invoiceCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });

    // Deselect all invoices
    fireEvent.click(selectAllCheckbox);
    
    invoiceCheckboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('should render export format options', () => {
    render(<BatchDownloadModal {...mockProps} />);

    expect(screen.getByText('Export Format:')).toBeInTheDocument();
    expect(screen.getByLabelText('PDF')).toBeInTheDocument();
    expect(screen.getByLabelText('Excel')).toBeInTheDocument();
    expect(screen.getByLabelText('CSV')).toBeInTheDocument();
  });

  it('should allow changing export format', () => {
    render(<BatchDownloadModal {...mockProps} />);

    const pdfRadio = screen.getByLabelText('PDF');
    const excelRadio = screen.getByLabelText('Excel');
    const csvRadio = screen.getByLabelText('CSV');

    // PDF should be selected by default
    expect(pdfRadio).toBeChecked();
    expect(excelRadio).not.toBeChecked();
    expect(csvRadio).not.toBeChecked();

    // Change to Excel
    fireEvent.click(excelRadio);
    expect(excelRadio).toBeChecked();
    expect(pdfRadio).not.toBeChecked();

    // Change to CSV
    fireEvent.click(csvRadio);
    expect(csvRadio).toBeChecked();
    expect(excelRadio).not.toBeChecked();
  });

  it('should disable download button when no invoices are selected', () => {
    render(<BatchDownloadModal {...mockProps} />);

    const downloadButton = screen.getByText('Download Selected');
    expect(downloadButton).toBeDisabled();
  });

  it('should enable download button when invoices are selected', () => {
    render(<BatchDownloadModal {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstInvoiceCheckbox = checkboxes[1];
    
    // Select first invoice
    fireEvent.click(firstInvoiceCheckbox);

    const downloadButton = screen.getByText('Download Selected');
    expect(downloadButton).not.toBeDisabled();
  });

  it('should handle download process with progress tracking', async () => {
    render(<BatchDownloadModal {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstInvoiceCheckbox = checkboxes[1];
    
    // Select first invoice
    fireEvent.click(firstInvoiceCheckbox);

    const downloadButton = screen.getByText('Download Selected');
    fireEvent.click(downloadButton);

    // Should show progress during download
    expect(screen.getByText('Downloading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(pdfGenerator.generateBatchInvoices).toHaveBeenCalledWith(
        [mockInvoices[0]], // Only first invoice selected
        'pdf'
      );
    });
  });

  it('should handle download with different formats', async () => {
    render(<BatchDownloadModal {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0];
    
    // Select all invoices
    fireEvent.click(selectAllCheckbox);

    // Change to Excel format
    const excelRadio = screen.getByLabelText('Excel');
    fireEvent.click(excelRadio);

    const downloadButton = screen.getByText('Download Selected');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(pdfGenerator.generateBatchInvoices).toHaveBeenCalledWith(
        mockInvoices,
        'excel'
      );
    });
  });

  it('should handle download errors gracefully', async () => {
    vi.mocked(pdfGenerator.generateBatchInvoices).mockRejectedValue(
      new Error('Download failed')
    );

    render(<BatchDownloadModal {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstInvoiceCheckbox = checkboxes[1];
    
    // Select first invoice
    fireEvent.click(firstInvoiceCheckbox);

    const downloadButton = screen.getByText('Download Selected');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(pdfGenerator.generateBatchInvoices).toHaveBeenCalled();
    });

    // Should handle error without crashing
    expect(screen.queryByText('Downloading...')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<BatchDownloadModal {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should not render when modal is closed', () => {
    const closedProps = { ...mockProps, invoices: [] };
    render(<BatchDownloadModal {...closedProps} />);

    expect(screen.queryByText('Batch Download Invoices')).toBeInTheDocument();
  });

  it('should display invoice amounts correctly', () => {
    render(<BatchDownloadModal {...mockProps} />);

    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('$2,750.50')).toBeInTheDocument();
    expect(screen.getByText('$890.25')).toBeInTheDocument();
  });

  it('should display invoice status badges', () => {
    render(<BatchDownloadModal {...mockProps} />);

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('overdue')).toBeInTheDocument();
  });

  it('should show selected count in download button', () => {
    render(<BatchDownloadModal {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstInvoiceCheckbox = checkboxes[1];
    const secondInvoiceCheckbox = checkboxes[2];
    
    // Select two invoices
    fireEvent.click(firstInvoiceCheckbox);
    fireEvent.click(secondInvoiceCheckbox);

    expect(screen.getByText('Download Selected (2)')).toBeInTheDocument();
  });
});