import { supabase } from '@/lib/supabase-client';
import type { Database } from '@/lib/database.types';
import type {
  HSCode,
  ExportPort,
  Certificate,
  Incoterm,
  TargetMarket,
  ProductCategory,
  CustomerExportFormData
} from '@/types/export-types';

export class ExportFieldsService {
  // Save customer export fields
  static async saveCustomerExportFields(customerId: string, data: CustomerExportFormData) {
    try {
      // Update customer table with basic export fields
      const updateData: Database['public']['Tables']['customers']['Update'] = {
        export_license_number: data.export_license_number || null,
        customs_broker: data.customs_broker || null,
        credit_limit_usd: data.credit_limit_usd || null,
        payment_terms_export: data.payment_terms_export || null,
        preferred_currency: data.preferred_currency || null,
        export_documentation_language: data.export_documentation_language || null,
        special_handling_requirements: data.special_handling_requirements || null,
        compliance_notes: data.compliance_notes || null
      };
      
      // Add export_license_expiry if provided
      if (data.export_license_expiry) {
        updateData.export_license_expiry = data.export_license_expiry;
      }
      
      const { error: customerError } = await (supabase as any)
        .from('customers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (customerError) throw customerError;

      // Save junction table relationships
      await Promise.all([
        this.saveCustomerHSCodes(customerId, data.hs_code_ids || []),
        this.saveCustomerExportPorts(customerId, data.export_port_ids || []),
        this.saveCustomerCertificates(customerId, data.certificate_ids || []),
        this.saveCustomerIncoterms(customerId, data.incoterm_ids || []),
        this.saveCustomerTargetMarkets(customerId, data.target_market_ids || []),
        this.saveCustomerProductCategories(customerId, data.product_category_ids || [])
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error saving customer export fields:', error);
      throw error;
    }
  }

  // Load customer export fields
  static async loadCustomerExportFields(customerId: string): Promise<CustomerExportFormData> {
    try {
      // Get customer basic export data
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select(`
          export_license_number,
          customs_broker,
          credit_limit_usd,
          payment_terms_export,
          preferred_currency,
          export_documentation_language
        `)
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
      if (!customer) throw new Error('Customer not found');

      // Load junction table data
      const [hsCodes, ports, certificates, incoterms, markets, categories] = await Promise.all([
        this.getCustomerHSCodes(customerId),
        this.getCustomerExportPorts(customerId),
        this.getCustomerCertificates(customerId),
        this.getCustomerIncoterms(customerId),
        this.getCustomerTargetMarkets(customerId),
        this.getCustomerProductCategories(customerId)
      ]);

      const customerData = customer as any;
      return {
        export_license_number: customerData.export_license_number || '',
        export_license_expiry: customerData.export_license_expiry || '',
        customs_broker: customerData.customs_broker || '',
        credit_limit_usd: customerData.credit_limit_usd || 0,
        payment_terms_export: customerData.payment_terms_export || '',
        preferred_currency: customerData.preferred_currency || 'USD',
        export_documentation_language: customerData.export_documentation_language || '',
        special_handling_requirements: customerData.special_handling_requirements || '',
        compliance_notes: customerData.compliance_notes || '',
        hs_code_ids: [],
        export_port_ids: [],
        certificate_ids: [],
        incoterm_ids: [],
        target_market_ids: [],
        product_category_ids: []
      };
    } catch (error) {
      console.error('Error loading customer export fields:', error);
      throw error;
    }
  }

  // HS Codes management
  private static async saveCustomerHSCodes(customerId: string, hsCodeIds: string[]) {
    // Delete existing relationships
    await supabase
      .from('customer_hs_codes')
      .delete()
      .eq('customer_id', customerId);

    // Insert new relationships
    if (hsCodeIds.length > 0) {
      const relationships = hsCodeIds.map((hsCodeId, index) => ({
        customer_id: customerId,
        hs_code_id: hsCodeId,
        is_primary: index === 0
      }));

      const { error } = await supabase
      .from('customer_hs_codes')
      .insert(relationships as any);

      if (error) throw error;
    }
  }

  private static async getCustomerHSCodes(customerId: string): Promise<HSCode[]> {
    const { data, error } = await supabase
      .from('customer_hs_codes')
      .select(`
        hs_codes (
          id,
          code,
          description,
          category,
          duty_rate,
          created_at
        )
      `)
      .eq('customer_id', customerId);

    if (error) throw error;
    return data?.map((item: { hs_codes: HSCode }) => item.hs_codes).filter(Boolean) || [];
  }

  // Export Ports management
  private static async saveCustomerExportPorts(customerId: string, portIds: string[]) {
    // Delete existing relationships
    await supabase
      .from('customer_export_ports')
      .delete()
      .eq('customer_id', customerId);

    // Insert new relationships
    if (portIds.length > 0) {
      const relationships = portIds.map((exportPortId, index) => ({
        customer_id: customerId,
        export_port_id: exportPortId,
        is_preferred: index === 0
      }));

      const { error } = await supabase
      .from('customer_export_ports')
      .insert(relationships as any);

      if (error) throw error;
    }
  }

  private static async getCustomerExportPorts(customerId: string): Promise<ExportPort[]> {
    const { data, error } = await supabase
      .from('customer_export_ports')
      .select(`
        export_ports (
          id,
          port_code,
          port_name,
          city,
          country,
          port_type,
          is_active,
          created_at
        )
      `)
      .eq('customer_id', customerId);

    if (error) throw error;
    return data?.map((item: { export_ports: any }) => ({
      ...item.export_ports,
      port_type: item.export_ports.port_type as 'seaport' | 'airport' | 'land_border'
    })).filter(Boolean) || [];
  }

  // Certificates management
  private static async saveCustomerCertificates(customerId: string, certificateIds: string[]) {
    // Delete existing relationships
    await supabase
      .from('customer_certificates')
      .delete()
      .eq('customer_id', customerId);

    // Insert new relationships
    if (certificateIds.length > 0) {
      const relationships = certificateIds.map(certificateId => ({
        customer_id: customerId,
        certificate_id: certificateId,
        status: 'pending' as const
      }));

      const { error } = await supabase
      .from('customer_certificates')
      .insert(relationships as any);

      if (error) throw error;
    }
  }

  private static async getCustomerCertificates(customerId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('customer_certificates')
      .select(`
        certificates (
          id,
          certificate_code,
          certificate_name,
          description,
          issuing_body,
          validity_period_months,
          is_mandatory,
          created_at
        )
      `)
      .eq('customer_id', customerId);

    if (error) throw error;
    return data?.map((item: { certificates: Certificate }) => item.certificates).filter(Boolean) || [];
  }

  // Incoterms management
  private static async saveCustomerIncoterms(customerId: string, incotermIds: string[]) {
    // Delete existing relationships
    await supabase
      .from('customer_incoterms')
      .delete()
      .eq('customer_id', customerId);

    // Insert new relationships
    if (incotermIds.length > 0) {
      const relationships = incotermIds.map((incotermId, index) => ({
        customer_id: customerId,
        incoterm_id: incotermId,
        is_preferred: index === 0
      }));

      const { error } = await supabase
      .from('customer_incoterms')
      .insert(relationships as any);

      if (error) throw error;
    }
  }

  private static async getCustomerIncoterms(customerId: string): Promise<Incoterm[]> {
    const { data, error } = await supabase
      .from('customer_incoterms')
      .select(`
        incoterms (
          id,
          term_code,
          term_name,
          description,
          risk_transfer_point,
          cost_responsibility,
          created_at
        )
      `)
      .eq('customer_id', customerId);

    if (error) throw error;
    return data?.map((item: { incoterms: Incoterm }) => item.incoterms).filter(Boolean) || [];
  }

  // Target Markets management
  private static async saveCustomerTargetMarkets(customerId: string, marketIds: string[]) {
    // Delete existing relationships
    await supabase
      .from('customer_target_markets')
      .delete()
      .eq('customer_id', customerId);

    // Insert new relationships
    if (marketIds.length > 0) {
      const relationships = marketIds.map((targetMarketId, index) => ({
        customer_id: customerId,
        target_market_id: targetMarketId,
        market_priority: index + 1
      }));

      const { error } = await supabase
      .from('customer_target_markets')
      .insert(relationships as any);

      if (error) throw error;
    }
  }

  private static async getCustomerTargetMarkets(customerId: string): Promise<TargetMarket[]> {
    const { data, error } = await supabase
      .from('customer_target_markets')
      .select(`
        target_markets (
          id,
          market_code,
          market_name,
          region,
          regulatory_requirements,
          market_notes,
          is_active,
          created_at
        )
      `)
      .eq('customer_id', customerId)
      .order('market_priority');

    if (error) throw error;
    return data?.map((item: { target_markets: TargetMarket }) => item.target_markets).filter(Boolean) || [];
  }

  // Product Categories management
  private static async saveCustomerProductCategories(customerId: string, categoryIds: string[]) {
    // Delete existing relationships
    await supabase
      .from('customer_product_categories')
      .delete()
      .eq('customer_id', customerId);

    // Insert new relationships
    if (categoryIds.length > 0) {
      const relationships = categoryIds.map((productCategoryId, index) => ({
        customer_id: customerId,
        product_category_id: productCategoryId,
        is_primary: index === 0
      }));

      const { error } = await supabase
      .from('customer_product_categories')
      .insert(relationships as any);

      if (error) throw error;
    }
  }

  private static async getCustomerProductCategories(customerId: string): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('customer_product_categories')
      .select(`
        product_categories (
          id,
          category_code,
          category_name,
          parent_category_id,
          description,
          export_restrictions,
          created_at
        )
      `)
      .eq('customer_id', customerId);

    if (error) throw error;
    return data?.map((item: { product_categories: ProductCategory }) => item.product_categories).filter(Boolean) || [];
  }

  // Validation helpers
  static validateExportFields(data: CustomerExportFormData): string[] {
    const errors: string[] = [];

    if (data.credit_limit_usd && data.credit_limit_usd < 0) {
      errors.push('Credit limit cannot be negative');
    }

    if (data.export_license_number && data.export_license_number.length < 5) {
      errors.push('Export license number must be at least 5 characters');
    }

    if (data.hs_code_ids && data.hs_code_ids.length === 0) {
      errors.push('At least one HS code must be selected');
    }

    if (data.target_market_ids && data.target_market_ids.length === 0) {
      errors.push('At least one target market must be selected');
    }

    return errors;
  }

  // Reference data loading
  static async getReferenceData() {
    try {
      const [hsCodes, exportPorts, certificates, incoterms, targetMarkets, productCategories] = await Promise.all([
        supabase.from('hs_codes').select('id, code, description, category, duty_rate, created_at'),
        supabase.from('export_ports').select('id, port_code, port_name, city, country, port_type, is_active, created_at'),
        supabase.from('certificates').select('id, certificate_code, certificate_name, description, is_mandatory, issuing_body, validity_period_months, created_at'),
        supabase.from('incoterms').select('id, term_code, term_name, description, risk_transfer_point, cost_responsibility, created_at'),
        supabase.from('target_markets').select('id, market_code, market_name, region, regulatory_requirements, market_notes, is_active, created_at'),
        supabase.from('product_categories').select('id, category_code, category_name, description, created_at')
      ]);

      if (hsCodes.error) throw hsCodes.error;
      if (exportPorts.error) throw exportPorts.error;
      if (certificates.error) throw certificates.error;
      if (incoterms.error) throw incoterms.error;
      if (targetMarkets.error) throw targetMarkets.error;
      if (productCategories.error) throw productCategories.error;

      return {
        hs_codes: hsCodes.data || [],
        export_ports: (exportPorts.data || []).map(port => ({
          ...port,
          port_type: port.port_type as 'seaport' | 'airport' | 'land_border'
        })),
        certificates: certificates.data || [],
        incoterms: incoterms.data || [],
        target_markets: targetMarkets.data || [],
        product_categories: productCategories.data || []
      };
    } catch (error) {
      console.error('Error loading reference data:', error);
      throw error;
    }
  }

  // Export data loading (alias for getReferenceData)
  static async getExportData() {
    return this.getReferenceData();
  }

  // Get customer export fields (alias for loadCustomerExportFields)
  static async getCustomerExportFields(customerId: string) {
    return this.loadCustomerExportFields(customerId);
  }

  // Statistics and reporting
  static async getExportStatistics(customerId: string) {
    try {
      const [hsCodeCount, portCount, certCount, marketCount] = await Promise.all([
        supabase.from('customer_hs_codes').select('id', { count: 'exact' }).eq('customer_id', customerId),
        supabase.from('customer_export_ports').select('id', { count: 'exact' }).eq('customer_id', customerId),
        supabase.from('customer_certificates').select('id', { count: 'exact' }).eq('customer_id', customerId),
        supabase.from('customer_target_markets').select('id', { count: 'exact' }).eq('customer_id', customerId)
      ]);

      return {
        hsCodesCount: hsCodeCount.count || 0,
        exportPortsCount: portCount.count || 0,
        certificatesCount: certCount.count || 0,
        targetMarketsCount: marketCount.count || 0
      };
    } catch (error) {
      console.error('Error getting export statistics:', error);
      return {
        hsCodesCount: 0,
        exportPortsCount: 0,
        certificatesCount: 0,
        targetMarketsCount: 0
      };
    }
  }
}

export default ExportFieldsService;