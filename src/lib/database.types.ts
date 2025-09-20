export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'sales_rep'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'sales_rep'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'sales_rep'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          address: string | null
          status: 'active' | 'inactive' | 'prospect'
          source: string | null
          tags: string[] | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          // Export-specific fields
          export_license_number: string | null
          export_license_expiry: string | null
          customs_broker: string | null
          preferred_currency: string | null
          payment_terms_export: string | null
          credit_limit_usd: number | null
          export_documentation_language: string | null
          special_handling_requirements: string | null
          compliance_notes: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          source?: string | null
          tags?: string[] | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          // Export-specific fields
          export_license_number?: string | null
          export_license_expiry?: string | null
          customs_broker?: string | null
          preferred_currency?: string | null
          payment_terms_export?: string | null
          credit_limit_usd?: number | null
          export_documentation_language?: string | null
          special_handling_requirements?: string | null
          compliance_notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          source?: string | null
          tags?: string[] | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          // Export-specific fields
          export_license_number?: string | null
          export_license_expiry?: string | null
          customs_broker?: string | null
          preferred_currency?: string | null
          payment_terms_export?: string | null
          credit_limit_usd?: number | null
          export_documentation_language?: string | null
          special_handling_requirements?: string | null
          compliance_notes?: string | null
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          source: string | null
          status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          score: number | null
          notes: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          lifecycle_stage: string | null
          priority_level: 'low' | 'medium' | 'high' | 'urgent' | null
          contact_preference: 'email' | 'phone' | 'whatsapp' | 'in_person' | null
          follow_up_date: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          score?: number | null
          notes?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          lifecycle_stage?: string | null
          priority_level?: 'low' | 'medium' | 'high' | 'urgent' | null
          contact_preference?: 'email' | 'phone' | 'whatsapp' | 'in_person' | null
          follow_up_date?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          score?: number | null
          notes?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          lifecycle_stage?: string | null
          priority_level?: 'low' | 'medium' | 'high' | 'urgent' | null
          contact_preference?: 'email' | 'phone' | 'whatsapp' | 'in_person' | null
          follow_up_date?: string | null
        }
      }
      deals: {
        Row: {
          id: string
          title: string
          customer_id: string | null
          lead_id: string | null
          value: number
          stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability: number
          expected_close_date: string | null
          description: string | null
          source: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          competitor_info: string | null
          decision_maker_contact: string | null
          deal_source: string | null
          deal_type: string | null
        }
        Insert: {
          id?: string
          title: string
          customer_id?: string | null
          lead_id?: string | null
          value?: number
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability?: number
          expected_close_date?: string | null
          description?: string | null
          source?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          competitor_info?: string | null
          decision_maker_contact?: string | null
          deal_source?: string | null
          deal_type?: string | null
        }
        Update: {
          id?: string
          title?: string
          customer_id?: string | null
          lead_id?: string | null
          value?: number
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability?: number
          expected_close_date?: string | null
          description?: string | null
          source?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          competitor_info?: string | null
          decision_maker_contact?: string | null
          deal_source?: string | null
          deal_type?: string | null
        }
      }
      proposals: {
        Row: {
          id: string
          title: string
          deal_id: string | null
          customer_id: string | null
          content: string
          status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
          valid_until: string | null
          source: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          proposal_type: string | null
          validity_period: number | null
          delivery_method: string | null
        }
        Insert: {
          id?: string
          title: string
          deal_id?: string | null
          customer_id?: string | null
          content: string
          status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
          valid_until?: string | null
          source?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          proposal_type?: string | null
          validity_period?: number | null
          delivery_method?: string | null
        }
        Update: {
          id?: string
          title?: string
          deal_id?: string | null
          customer_id?: string | null
          content?: string
          status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
          valid_until?: string | null
          source?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          proposal_type?: string | null
          validity_period?: number | null
          delivery_method?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_id: string
          deal_id: string | null
          amount: number
          tax_amount: number
          total_amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          paid_date: string | null
          items: Json
          notes: string | null
          payment_terms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt'
          tax_rate: number
          source: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          billing_address: string | null
          purchase_order_number: string | null
          payment_method: string | null
        }
        Insert: {
          id?: string
          invoice_number: string
          customer_id: string
          deal_id?: string | null
          amount?: number
          tax_amount?: number
          total_amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          paid_date?: string | null
          items?: Json
          notes?: string | null
          payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt'
          tax_rate?: number
          source?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          billing_address?: string | null
          purchase_order_number?: string | null
          payment_method?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_id?: string
          deal_id?: string | null
          amount?: number
          tax_amount?: number
          total_amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_date?: string | null
          items?: Json
          notes?: string | null
          payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt'
          tax_rate?: number
          source?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          billing_address?: string | null
          purchase_order_number?: string | null
          payment_method?: string | null
        }
      }
      // Export-related tables
      export_licenses: {
        Row: {
          id: string
          customer_id: string
          license_number: string
          license_type: string
          issuing_authority: string
          issue_date: string
          expiry_date: string
          status: 'active' | 'expired' | 'suspended' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          license_number: string
          license_type: string
          issuing_authority: string
          issue_date: string
          expiry_date: string
          status?: 'active' | 'expired' | 'suspended' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          license_number?: string
          license_type?: string
          issuing_authority?: string
          issue_date?: string
          expiry_date?: string
          status?: 'active' | 'expired' | 'suspended' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hs_codes: {
        Row: {
          id: string
          code: string
          description: string
          category: string | null
          duty_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description: string
          category?: string | null
          duty_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          category?: string | null
          duty_rate?: number | null
          created_at?: string
        }
      }
      export_ports: {
        Row: {
          id: string
          port_code: string
          port_name: string
          city: string
          country: string
          port_type: 'seaport' | 'airport' | 'land_border'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          port_code: string
          port_name: string
          city: string
          country?: string
          port_type?: 'seaport' | 'airport' | 'land_border'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          port_code?: string
          port_name?: string
          city?: string
          country?: string
          port_type?: 'seaport' | 'airport' | 'land_border'
          is_active?: boolean
          created_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          certificate_code: string
          certificate_name: string
          description: string | null
          issuing_body: string | null
          validity_period_months: number | null
          is_mandatory: boolean
          created_at: string
        }
        Insert: {
          id?: string
          certificate_code: string
          certificate_name: string
          description?: string | null
          issuing_body?: string | null
          validity_period_months?: number | null
          is_mandatory?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          certificate_code?: string
          certificate_name?: string
          description?: string | null
          issuing_body?: string | null
          validity_period_months?: number | null
          is_mandatory?: boolean
          created_at?: string
        }
      }
      incoterms: {
        Row: {
          id: string
          term_code: string
          term_name: string
          description: string | null
          risk_transfer_point: string | null
          cost_responsibility: string | null
          created_at: string
        }
        Insert: {
          id?: string
          term_code: string
          term_name: string
          description?: string | null
          risk_transfer_point?: string | null
          cost_responsibility?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          term_code?: string
          term_name?: string
          description?: string | null
          risk_transfer_point?: string | null
          cost_responsibility?: string | null
          created_at?: string
        }
      }
      target_markets: {
        Row: {
          id: string
          market_code: string
          market_name: string
          region: string | null
          regulatory_requirements: string | null
          market_notes: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          market_code: string
          market_name: string
          region?: string | null
          regulatory_requirements?: string | null
          market_notes?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          market_code?: string
          market_name?: string
          region?: string | null
          regulatory_requirements?: string | null
          market_notes?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          category_code: string
          category_name: string
          parent_category_id: string | null
          description: string | null
          export_restrictions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category_code: string
          category_name: string
          parent_category_id?: string | null
          description?: string | null
          export_restrictions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category_code?: string
          category_name?: string
          parent_category_id?: string | null
          description?: string | null
          export_restrictions?: string | null
          created_at?: string
        }
      }
      // Junction tables for many-to-many relationships
      customer_hs_codes: {
        Row: {
          id: string
          customer_id: string
          hs_code_id: string
          is_primary: boolean
          volume_percentage: number | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          hs_code_id: string
          is_primary?: boolean
          volume_percentage?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          hs_code_id?: string
          is_primary?: boolean
          volume_percentage?: number | null
          created_at?: string
        }
      }
      customer_export_ports: {
        Row: {
          id: string
          customer_id: string
          export_port_id: string
          is_preferred: boolean
          shipping_method: string | null
          transit_time_days: number | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          export_port_id: string
          is_preferred?: boolean
          shipping_method?: string | null
          transit_time_days?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          export_port_id?: string
          is_preferred?: boolean
          shipping_method?: string | null
          transit_time_days?: number | null
          created_at?: string
        }
      }
      customer_certificates: {
        Row: {
          id: string
          customer_id: string
          certificate_id: string
          certificate_number: string | null
          issue_date: string | null
          expiry_date: string | null
          issuing_body: string | null
          status: 'valid' | 'expired' | 'pending' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          certificate_id: string
          certificate_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          issuing_body?: string | null
          status?: 'valid' | 'expired' | 'pending' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          certificate_id?: string
          certificate_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          issuing_body?: string | null
          status?: 'valid' | 'expired' | 'pending' | 'cancelled'
          created_at?: string
        }
      }
      customer_target_markets: {
        Row: {
          id: string
          customer_id: string
          target_market_id: string
          market_priority: number | null
          annual_volume_target: number | null
          market_entry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          target_market_id: string
          market_priority?: number | null
          annual_volume_target?: number | null
          market_entry_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          target_market_id?: string
          market_priority?: number | null
          annual_volume_target?: number | null
          market_entry_date?: string | null
          created_at?: string
        }
      }
      customer_product_categories: {
        Row: {
          id: string
          customer_id: string
          product_category_id: string
          is_primary: boolean
          volume_percentage: number | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          product_category_id: string
          is_primary?: boolean
          volume_percentage?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          product_category_id?: string
          is_primary?: boolean
          volume_percentage?: number | null
          created_at?: string
        }
      }
      customer_incoterms: {
        Row: {
          id: string
          customer_id: string
          incoterm_id: string
          is_preferred: boolean
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          incoterm_id: string
          is_preferred?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          incoterm_id?: string
          is_preferred?: boolean
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']