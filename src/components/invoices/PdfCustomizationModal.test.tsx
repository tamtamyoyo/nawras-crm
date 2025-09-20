import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PdfCustomizationModal } from './PdfCustomizationModal';
import userEvent from '@testing-library/user-event';

// Mock file reader
Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    result: 'data:image/png;base64,mockbase64data',
  })),
});

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockInvoice = {
  id: 'inv-001',
  invoice_number: 'INV-2024-001',
  customer_id: 'cust-001',
  deal_id: null,
  amount: 1500.00,
  tax_amount: 150.00,
  total_amount: 1650.00,
  status: 'draft' as const,
  due_date: '2024-02-15',
  paid_date: null,
  items: [
    { description: 'Product A', quantity: 2, price: 500.00 },
    { description: 'Product B', quantity: 1, price: 500.00 },
  ],
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
};

describe('PdfCustomizationModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    invoice: mockInvoice,
    onDownload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the modal with customization options', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByText('Customize PDF Export')).toBeInTheDocument();
    expect(screen.getByText('Template Selection')).toBeInTheDocument();
    expect(screen.getByText('Branding Options')).toBeInTheDocument();
    expect(screen.getByText('Page Settings')).toBeInTheDocument();
  });

  it('should display template options', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByLabelText('Modern')).toBeInTheDocument();
    expect(screen.getByLabelText('Classic')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimal')).toBeInTheDocument();
    expect(screen.getByLabelText('Professional')).toBeInTheDocument();
  });

  it('should allow template selection', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    const modernTemplate = screen.getByLabelText('Modern');
    const classicTemplate = screen.getByLabelText('Classic');

    // Modern should be selected by default
    expect(modernTemplate).toBeChecked();
    expect(classicTemplate).not.toBeChecked();

    // Change to Classic template
    fireEvent.click(classicTemplate);
    expect(classicTemplate).toBeChecked();
    expect(modernTemplate).not.toBeChecked();
  });

  it('should display color scheme options', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByText('Color Scheme:')).toBeInTheDocument();
    expect(screen.getByLabelText('Blue')).toBeInTheDocument();
    expect(screen.getByLabelText('Green')).toBeInTheDocument();
    expect(screen.getByLabelText('Red')).toBeInTheDocument();
    expect(screen.getByLabelText('Purple')).toBeInTheDocument();
    expect(screen.getByLabelText('Gray')).toBeInTheDocument();
  });

  it('should allow color scheme selection', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    const blueColor = screen.getByLabelText('Blue');
    const greenColor = screen.getByLabelText('Green');

    // Blue should be selected by default
    expect(blueColor).toBeChecked();
    expect(greenColor).not.toBeChecked();

    // Change to Green
    fireEvent.click(greenColor);
    expect(greenColor).toBeChecked();
    expect(blueColor).not.toBeChecked();
  });

  it('should display logo upload section', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByText('Company Logo:')).toBeInTheDocument();
    expect(screen.getByText('Upload Logo')).toBeInTheDocument();
    expect(screen.getByText('Logo Position:')).toBeInTheDocument();
  });

  it('should handle logo upload', async () => {
    const user = userEvent.setup();
    render(<PdfCustomizationModal {...mockProps} />);

    const fileInput = screen.getByLabelText('Upload Logo');
    const file = new File(['logo content'], 'logo.png', { type: 'image/png' });

    await user.upload(fileInput, file);

    expect((fileInput as HTMLInputElement).files).toHaveLength(1);
    expect((fileInput as HTMLInputElement).files![0]).toBe(file);
  });

  it('should display logo position options', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByLabelText('Top Left')).toBeInTheDocument();
    expect(screen.getByLabelText('Top Center')).toBeInTheDocument();
    expect(screen.getByLabelText('Top Right')).toBeInTheDocument();
  });

  it('should allow logo position selection', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    const topLeft = screen.getByLabelText('Top Left');
    const topCenter = screen.getByLabelText('Top Center');

    // Top Left should be selected by default
    expect(topLeft).toBeChecked();
    expect(topCenter).not.toBeChecked();

    // Change to Top Center
    fireEvent.click(topCenter);
    expect(topCenter).toBeChecked();
    expect(topLeft).not.toBeChecked();
  });

  it('should display custom header and footer inputs', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByLabelText('Custom Header:')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom Footer:')).toBeInTheDocument();
  });

  it('should allow custom header and footer input', async () => {
    const user = userEvent.setup();
    render(<PdfCustomizationModal {...mockProps} />);

    const headerInput = screen.getByLabelText('Custom Header:');
    const footerInput = screen.getByLabelText('Custom Footer:');

    await user.type(headerInput, 'Custom Header Text');
    await user.type(footerInput, 'Custom Footer Text');

    expect(headerInput).toHaveValue('Custom Header Text');
    expect(footerInput).toHaveValue('Custom Footer Text');
  });

  it('should display page size options', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByText('Page Size:')).toBeInTheDocument();
    expect(screen.getByLabelText('A4')).toBeInTheDocument();
    expect(screen.getByLabelText('Letter')).toBeInTheDocument();
    expect(screen.getByLabelText('Legal')).toBeInTheDocument();
  });

  it('should allow page size selection', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    const a4Size = screen.getByLabelText('A4');
    const letterSize = screen.getByLabelText('Letter');

    // A4 should be selected by default
    expect(a4Size).toBeChecked();
    expect(letterSize).not.toBeChecked();

    // Change to Letter
    fireEvent.click(letterSize);
    expect(letterSize).toBeChecked();
    expect(a4Size).not.toBeChecked();
  });

  it('should display orientation options', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByText('Orientation:')).toBeInTheDocument();
    expect(screen.getByLabelText('Portrait')).toBeInTheDocument();
    expect(screen.getByLabelText('Landscape')).toBeInTheDocument();
  });

  it('should allow orientation selection', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    const portrait = screen.getByLabelText('Portrait');
    const landscape = screen.getByLabelText('Landscape');

    // Portrait should be selected by default
    expect(portrait).toBeChecked();
    expect(landscape).not.toBeChecked();

    // Change to Landscape
    fireEvent.click(landscape);
    expect(landscape).toBeChecked();
    expect(portrait).not.toBeChecked();
  });

  it('should display margin controls', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByText('Margins:')).toBeInTheDocument();
    expect(screen.getByLabelText('Top Margin (mm):')).toBeInTheDocument();
    expect(screen.getByLabelText('Bottom Margin (mm):')).toBeInTheDocument();
    expect(screen.getByLabelText('Left Margin (mm):')).toBeInTheDocument();
    expect(screen.getByLabelText('Right Margin (mm):')).toBeInTheDocument();
  });

  it('should allow margin adjustments', async () => {
    const user = userEvent.setup();
    render(<PdfCustomizationModal {...mockProps} />);

    const topMargin = screen.getByLabelText('Top Margin (mm):');
    const bottomMargin = screen.getByLabelText('Bottom Margin (mm):');

    await user.clear(topMargin);
    await user.type(topMargin, '25');
    
    await user.clear(bottomMargin);
    await user.type(bottomMargin, '30');

    expect(topMargin).toHaveValue(25);
    expect(bottomMargin).toHaveValue(30);
  });

  it('should display watermark options', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    expect(screen.getByText('Watermark:')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Watermark')).toBeInTheDocument();
    expect(screen.getByLabelText('Watermark Text:')).toBeInTheDocument();
  });

  it('should handle watermark toggle and text input', async () => {
    const user = userEvent.setup();
    render(<PdfCustomizationModal {...mockProps} />);

    const watermarkToggle = screen.getByLabelText('Enable Watermark');
    const watermarkText = screen.getByLabelText('Watermark Text:');

    // Initially watermark should be disabled
    expect(watermarkToggle).not.toBeChecked();
    expect(watermarkText).toBeDisabled();

    // Enable watermark
    fireEvent.click(watermarkToggle);
    expect(watermarkToggle).toBeChecked();
    expect(watermarkText).not.toBeDisabled();

    // Add watermark text
    await user.type(watermarkText, 'CONFIDENTIAL');
    expect(watermarkText).toHaveValue('CONFIDENTIAL');
  });

  it('should handle preview generation', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    // Should show preview loading state
    expect(screen.getByText('Generating Preview...')).toBeInTheDocument();
  });

  it('should handle download with custom settings', async () => {
    render(<PdfCustomizationModal {...mockProps} />);

    // Change some settings
    const classicTemplate = screen.getByLabelText('Classic');
    const greenColor = screen.getByLabelText('Green');
    const letterSize = screen.getByLabelText('Letter');

    fireEvent.click(classicTemplate);
    fireEvent.click(greenColor);
    fireEvent.click(letterSize);

    const downloadButton = screen.getByText('Download PDF');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockProps.onDownload).toHaveBeenCalledWith({
        template: 'classic',
        colorScheme: 'green',
        pageSize: 'letter',
        orientation: 'portrait',
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        logoPosition: 'top-left',
        watermark: { enabled: false, text: '' },
        customHeader: '',
        customFooter: '',
      });
    });
  });

  it('should validate required fields before download', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    // Enable watermark but leave text empty
    const watermarkToggle = screen.getByLabelText('Enable Watermark');
    fireEvent.click(watermarkToggle);

    const downloadButton = screen.getByText('Download PDF');
    fireEvent.click(downloadButton);

    // Should show validation error
    expect(screen.getByText('Watermark text is required when watermark is enabled')).toBeInTheDocument();
    expect(mockProps.onDownload).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<PdfCustomizationModal {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should not render when modal is closed', () => {
    render(<PdfCustomizationModal {...mockProps} isOpen={false} />);

    expect(screen.queryByText('Customize PDF Export')).not.toBeInTheDocument();
  });

  it('should reset form when modal is reopened', () => {
    const { rerender } = render(<PdfCustomizationModal {...mockProps} isOpen={false} />);
    
    // Open modal and change settings
    rerender(<PdfCustomizationModal {...mockProps} isOpen={true} />);
    
    const classicTemplate = screen.getByLabelText('Classic');
    fireEvent.click(classicTemplate);
    expect(classicTemplate).toBeChecked();

    // Close and reopen modal
    rerender(<PdfCustomizationModal {...mockProps} isOpen={false} />);
    rerender(<PdfCustomizationModal {...mockProps} isOpen={true} />);

    // Should reset to default (Modern)
    const modernTemplate = screen.getByLabelText('Modern');
    expect(modernTemplate).toBeChecked();
  });
});