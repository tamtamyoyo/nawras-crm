import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase-client';
import ExportFieldsService from './exportFieldsService';
import type { CustomerExportFormData } from '../types/export-types';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockCustomerExportData = {
  id: 'customer-123',
  export_license_number: 'EL123456',
  customs_broker: 'ABC Customs',
  credit_limit: 50000,
  payment_terms: 'NET30',
  preferred_currency: 'USD',
  banking_details: 'Bank of China - Account 123456789',
  compliance_notes: 'All products meet EU standards',
  risk_assessment: 'Low risk customer',
  customer_hs_codes: [
    { hs_codes: { id: 'hs001', code: '8517', description: 'Electronics' } },
  ],
  customer_export_ports: [
    { export_ports: { id: 'port001', name: 'Shanghai Port', code: 'SHA' } },
  ],
  customer_certificates: [
    { certificates: { id: 'cert001', name: 'CE Certificate', type: 'Safety' } },
  ],
  customer_incoterms: [
    { incoterms: { id: 'inco001', code: 'FOB', description: 'Free on Board' } },
  ],
  customer_target_markets: [
    { target_markets: { id: 'market001', name: 'North America', region: 'Americas' } },
  ],
  customer_product_categories: [
    { product_categories: { id: 'cat001', name: 'Electronics', description: 'Electronic goods' } },
  ],
};

describe('exportFieldsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCustomerExportFields', () => {
    it('should fetch customer export fields successfully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCustomerExportData,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as ReturnType<typeof supabase.from>);

      const result = await ExportFieldsService.loadCustomerExportFields('customer-123');

      expect(result).toEqual({
        export_license_number: 'EL123456',
        customs_broker: 'ABC Customs',
        credit_limit_usd: 50000,
        payment_terms_export: 'NET30',
        preferred_currency: 'USD',
        export_documentation_language: '',
        special_handling_requirements: '',
        compliance_notes: 'All products meet EU standards',
        hs_code_ids: ['hs001'],
        export_port_ids: ['port001'],
        certificate_ids: ['cert001'],
        incoterm_ids: ['inco001'],
        target_market_ids: ['market001'],
        product_category_ids: ['cat001'],
      });
    });

    it('should return default values when no data found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as ReturnType<typeof supabase.from>);

      const result = await ExportFieldsService.loadCustomerExportFields('customer-123');

      expect(result).toEqual({
        export_license_number: '',
        customs_broker: '',
        credit_limit_usd: 0,
        payment_terms_export: '',
        preferred_currency: 'USD',
        export_documentation_language: '',
        special_handling_requirements: '',
        compliance_notes: '',
        hs_code_ids: [],
        export_port_ids: [],
        certificate_ids: [],
        incoterm_ids: [],
        target_market_ids: [],
        product_category_ids: [],
      });
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as ReturnType<typeof supabase.from>);

      await expect(ExportFieldsService.loadCustomerExportFields('customer-123')).rejects.toThrow('Database error');
    });
  });

  describe('saveCustomerExportFields', () => {
    const mockFormData: CustomerExportFormData = {
      export_license_number: 'EL789012',
      customs_broker: 'XYZ Customs',
      credit_limit_usd: 75000,
      payment_terms_export: 'NET45',
      preferred_currency: 'EUR',
      export_documentation_language: 'EN',
      special_handling_requirements: 'None',
      compliance_notes: 'Updated compliance notes',
      hs_code_ids: ['hs001', 'hs002'],
      export_port_ids: ['port001'],
      certificate_ids: ['cert001', 'cert002'],
      incoterm_ids: ['inco001'],
      target_market_ids: ['market001', 'market002'],
      product_category_ids: ['cat001'],
    };

    it('should save customer export fields successfully', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'customers') {
          return { upsert: mockUpsert };
        }
        return {
          delete: mockDelete,
          insert: mockInsert,
        };
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as typeof supabase.from);

      await ExportFieldsService.saveCustomerExportFields('customer-123', mockFormData);

      expect(mockUpsert).toHaveBeenCalledWith({
        id: 'customer-123',
        export_license_number: 'EL789012',
        customs_broker: 'XYZ Customs',
        credit_limit: 75000,
        payment_terms: 'NET45',
        preferred_currency: 'EUR',
        banking_details: 'HSBC - Account 987654321',
        compliance_notes: 'Updated compliance notes',
        risk_assessment: 'Medium risk customer',
      });

      // Verify junction table operations
      expect(mockDelete).toHaveBeenCalledTimes(6); // One for each junction table
      expect(mockInsert).toHaveBeenCalledTimes(6); // One for each junction table
    });

    it('should handle upsert errors', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      });

      const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });
      vi.mocked(supabase.from).mockImplementation(mockFrom as typeof supabase.from);

      await expect(
        ExportFieldsService.saveCustomerExportFields('customer-123', mockFormData)
      ).rejects.toThrow('Upsert failed');
    });
  });

  describe('getReferenceData', () => {
    it('should fetch all reference data successfully', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          { id: 'hs001', code: '8517', description: 'Electronics' },
          { id: 'hs002', code: '6204', description: 'Textiles' },
        ],
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      vi.mocked(supabase.from).mockImplementation(mockFrom as typeof supabase.from);

      const result = await ExportFieldsService.getReferenceData();

      expect(result).toHaveProperty('hsCodeOptions');
      expect(result).toHaveProperty('exportPortOptions');
      expect(result).toHaveProperty('certificateOptions');
      expect(result).toHaveProperty('incotermOptions');
      expect(result).toHaveProperty('targetMarketOptions');
      expect(result).toHaveProperty('productCategoryOptions');

      // Verify all reference tables are queried
      expect(supabase.from).toHaveBeenCalledWith('hs_codes');
      expect(supabase.from).toHaveBeenCalledWith('export_ports');
      expect(supabase.from).toHaveBeenCalledWith('certificates');
      expect(supabase.from).toHaveBeenCalledWith('incoterms');
      expect(supabase.from).toHaveBeenCalledWith('target_markets');
      expect(supabase.from).toHaveBeenCalledWith('product_categories');
    });

    it('should handle reference data fetch errors', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Fetch failed' },
      });

      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      vi.mocked(supabase.from).mockImplementation(mockFrom as typeof supabase.from);

      await expect(ExportFieldsService.getReferenceData()).rejects.toThrow('Fetch failed');
    });
  });
});