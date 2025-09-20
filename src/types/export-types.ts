// TypeScript interfaces for China Export Business Fields

export interface ExportLicense {
  id: string;
  customer_id: string;
  license_number: string;
  license_type: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HSCode {
  id: string;
  code: string;
  description: string;
  category?: string;
  duty_rate?: number;
  created_at: string;
}

export interface ExportPort {
  id: string;
  port_code: string;
  port_name: string;
  city: string;
  country: string;
  port_type: 'seaport' | 'airport' | 'land_border';
  is_active: boolean;
  created_at: string;
}

export interface Certificate {
  id: string;
  certificate_code: string;
  certificate_name: string;
  description?: string;
  issuing_body?: string;
  validity_period_months?: number;
  is_mandatory: boolean;
  created_at: string;
}

export interface Incoterm {
  id: string;
  term_code: string;
  term_name: string;
  description?: string;
  risk_transfer_point?: string;
  cost_responsibility?: string;
  created_at: string;
}

export interface TargetMarket {
  id: string;
  market_code: string;
  market_name: string;
  region?: string;
  regulatory_requirements?: string;
  market_notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  category_code: string;
  category_name: string;
  parent_category_id?: string;
  description?: string;
  export_restrictions?: string;
  created_at: string;
}

// Junction table interfaces
export interface CustomerHSCode {
  id: string;
  customer_id: string;
  hs_code_id: string;
  is_primary: boolean;
  volume_percentage?: number;
  created_at: string;
  hs_code?: HSCode;
}

export interface CustomerExportPort {
  id: string;
  customer_id: string;
  export_port_id: string;
  is_preferred: boolean;
  shipping_method?: string;
  transit_time_days?: number;
  created_at: string;
  export_port?: ExportPort;
}

export interface CustomerCertificate {
  id: string;
  customer_id: string;
  certificate_id: string;
  certificate_number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_body?: string;
  status: 'valid' | 'expired' | 'pending' | 'cancelled';
  created_at: string;
  certificate?: Certificate;
}

export interface CustomerTargetMarket {
  id: string;
  customer_id: string;
  target_market_id: string;
  market_priority?: number;
  annual_volume_target?: number;
  market_entry_date?: string;
  created_at: string;
  target_market?: TargetMarket;
}

export interface CustomerProductCategory {
  id: string;
  customer_id: string;
  product_category_id: string;
  is_primary: boolean;
  volume_percentage?: number;
  created_at: string;
  product_category?: ProductCategory;
}

export interface CustomerIncoterm {
  id: string;
  customer_id: string;
  incoterm_id: string;
  is_preferred: boolean;
  created_at: string;
  incoterm?: Incoterm;
}

// Extended Customer interface with export fields
export interface CustomerWithExportFields {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  
  // Export-specific fields
  export_license_number?: string;
  export_license_expiry?: string;
  customs_broker?: string;
  preferred_currency?: string;
  payment_terms_export?: string;
  credit_limit_usd?: number;
  export_documentation_language?: string;
  special_handling_requirements?: string;
  compliance_notes?: string;
  
  // Related export data
  export_licenses?: ExportLicense[];
  customer_hs_codes?: CustomerHSCode[];
  customer_export_ports?: CustomerExportPort[];
  customer_certificates?: CustomerCertificate[];
  customer_target_markets?: CustomerTargetMarket[];
  customer_product_categories?: CustomerProductCategory[];
  customer_incoterms?: CustomerIncoterm[];
}

// Extended Lead interface with export fields
export interface LeadWithExportFields {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Export-specific fields
  export_license_number?: string;
  export_license_expiry?: string;
  customs_broker?: string;
  preferred_currency?: string;
  payment_terms_export?: string;
  credit_limit_usd?: number;
  export_documentation_language?: string;
  special_handling_requirements?: string;
  compliance_notes?: string;
}

// Extended Deal interface with export fields
export interface DealWithExportFields {
  id: string;
  title: string;
  customer_id: string;
  value: number;
  stage: string;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Export-specific fields
  export_license_number?: string;
  export_license_expiry?: string;
  customs_broker?: string;
  preferred_currency?: string;
  payment_terms_export?: string;
  credit_limit_usd?: number;
  export_documentation_language?: string;
  special_handling_requirements?: string;
  compliance_notes?: string;
}

// Form data interfaces for creating/updating
export interface ExportLicenseFormData {
  license_number: string;
  license_type: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  notes?: string;
}

export interface CustomerExportFormData {
  export_license_number?: string;
  export_license_expiry?: string;
  customs_broker?: string;
  preferred_currency?: string;
  payment_terms_export?: string;
  credit_limit_usd?: number;
  export_documentation_language?: string;
  special_handling_requirements?: string;
  compliance_notes?: string;
  
  // Multi-select field IDs
  hs_code_ids?: string[];
  export_port_ids?: string[];
  certificate_ids?: string[];
  target_market_ids?: string[];
  product_category_ids?: string[];
  incoterm_ids?: string[];
}

// API response interfaces
export interface ExportDataResponse {
  hs_codes: HSCode[];
  export_ports: ExportPort[];
  certificates: Certificate[];
  incoterms: Incoterm[];
  target_markets: TargetMarket[];
  product_categories: ProductCategory[];
}

// Multi-select option interface
export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  category?: string;
}

// Export field validation rules
export interface ExportFieldValidation {
  export_license_number?: {
    required?: boolean;
    pattern?: RegExp;
    maxLength?: number;
  };
  customs_broker?: {
    maxLength?: number;
  };
  preferred_currency?: {
    options?: string[];
  };
  credit_limit_usd?: {
    min?: number;
    max?: number;
  };
  export_documentation_language?: {
    options?: string[];
  };
}

// Export statistics interface
export interface ExportStatistics {
  total_customers_with_export: number;
  active_export_licenses: number;
  expired_licenses: number;
  top_target_markets: Array<{
    market_name: string;
    customer_count: number;
  }>;
  top_product_categories: Array<{
    category_name: string;
    customer_count: number;
  }>;
  certificate_expiry_alerts: Array<{
    customer_name: string;
    certificate_name: string;
    expiry_date: string;
  }>;
}

// Export compliance check interface
export interface ComplianceCheck {
  customer_id: string;
  checks: Array<{
    type: 'license' | 'certificate' | 'documentation';
    status: 'compliant' | 'warning' | 'non_compliant';
    message: string;
    due_date?: string;
  }>;
  overall_status: 'compliant' | 'warning' | 'non_compliant';
  last_checked: string;
}

// All types are exported individually above