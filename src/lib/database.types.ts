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
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          start_time: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          start_time: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_code: string
          certificate_name: string
          created_at: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          issuing_body: string | null
          updated_at: string | null
          validity_period_months: number | null
        }
        Insert: {
          certificate_code: string
          certificate_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          issuing_body?: string | null
          updated_at?: string | null
          validity_period_months?: number | null
        }
        Update: {
          certificate_code?: string
          certificate_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          issuing_body?: string | null
          updated_at?: string | null
          validity_period_months?: number | null
        }
        Relationships: []
      }
      customer_certificates: {
        Row: {
          certificate_id: string
          created_at: string | null
          customer_id: string
          id: string
        }
        Insert: {
          certificate_id: string
          created_at?: string | null
          customer_id: string
          id?: string
        }
        Update: {
          certificate_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_certificates_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_certificates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_export_ports: {
        Row: {
          created_at: string | null
          customer_id: string
          export_port_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          export_port_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          export_port_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_export_ports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_export_ports_export_port_id_fkey"
            columns: ["export_port_id"]
            isOneToOne: false
            referencedRelation: "export_ports"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_hs_codes: {
        Row: {
          created_at: string | null
          customer_id: string
          hs_code_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          hs_code_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          hs_code_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_hs_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_hs_codes_hs_code_id_fkey"
            columns: ["hs_code_id"]
            isOneToOne: false
            referencedRelation: "hs_codes"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_incoterms: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          incoterm_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          incoterm_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          incoterm_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_incoterms_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_incoterms_incoterm_id_fkey"
            columns: ["incoterm_id"]
            isOneToOne: false
            referencedRelation: "incoterms"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_product_categories: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          product_category_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          product_category_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          product_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_product_categories_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_product_categories_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_target_markets: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          target_market_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          target_market_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          target_market_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_target_markets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_target_markets_target_market_id_fkey"
            columns: ["target_market_id"]
            isOneToOne: false
            referencedRelation: "target_markets"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          compliance_notes: string | null
          created_at: string | null
          created_by: string | null
          credit_limit_usd: number | null
          customs_broker: string | null
          email: string | null
          export_documentation_language: string | null
          export_license_expiry: string | null
          export_license_number: string | null
          id: string
          name: string
          notes: string | null
          payment_terms_export: string | null
          phone: string | null
          preferred_currency: string | null
          responsible_person: string | null
          source: string | null
          special_handling_requirements: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          compliance_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit_usd?: number | null
          customs_broker?: string | null
          email?: string | null
          export_documentation_language?: string | null
          export_license_expiry?: string | null
          export_license_number?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms_export?: string | null
          phone?: string | null
          preferred_currency?: string | null
          responsible_person?: string | null
          source?: string | null
          special_handling_requirements?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          address?: string | null
          company?: string | null
          compliance_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit_usd?: number | null
          customs_broker?: string | null
          email?: string | null
          export_documentation_language?: string | null
          export_license_expiry?: string | null
          export_license_number?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms_export?: string | null
          phone?: string | null
          preferred_currency?: string | null
          responsible_person?: string | null
          source?: string | null
          special_handling_requirements?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          position: Json | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          position?: Json | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          position?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount: number
          assigned_to: string | null
          competitor_info: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deal_source_detail: string | null
        deal_type: string | null
        decision_maker_email: string | null
          decision_maker_name: string | null
        decision_maker_phone: string | null
        description: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          probability: number | null
          responsible_person: string | null
          source: string | null
          stage: string | null
          title: string | null
          updated_at: string | null
        value: number | null
        version: number | null
        }
        Insert: {
          amount: number
          assigned_to?: string | null
          competitor_info?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deal_source_detail?: string | null
        deal_type?: string | null
        decision_maker_email?: string | null
          decision_maker_name?: string | null
        decision_maker_phone?: string | null
        description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          probability?: number | null
          responsible_person?: string | null
          source?: string | null
          stage?: string | null
          title: string
          updated_at?: string | null
        value?: number | null
        version?: number | null
        }
        Update: {
          amount?: number
          assigned_to?: string | null
          competitor_info?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deal_source_detail?: string | null
        deal_type?: string | null
        decision_maker_email?: string | null
        decision_maker_name?: string | null
        decision_maker_phone?: string | null
        description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          probability?: number | null
          responsible_person?: string | null
          source?: string | null
          stage?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      export_licenses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      export_ports: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          is_active: boolean
          port_code: string
          port_name: string
          port_type: string
          updated_at: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          port_code: string
          port_name: string
          port_type: string
          updated_at?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          port_code?: string
          port_name?: string
          port_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hs_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          duty_rate: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          duty_rate?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          duty_rate?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      incoterms: {
        Row: {
          cost_responsibility: string | null
          created_at: string | null
          description: string | null
          id: string
          risk_transfer_point: string | null
          term_code: string
          term_name: string
          updated_at: string | null
        }
        Insert: {
          cost_responsibility?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          risk_transfer_point?: string | null
          term_code: string
          term_name: string
          updated_at?: string | null
        }
        Update: {
          cost_responsibility?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          risk_transfer_point?: string | null
          term_code?: string
          term_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          billing_address: string | null
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          customer_id: string | null
          deal_id: string | null
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string | null
          id: string
          invoice_number: string
          items: Json | null
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          payment_status: string | null
          payment_terms: string | null
          purchase_order_number: string | null
          responsible_person: string | null
          source: string | null
          status: string | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          amount: number
          billing_address?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          customer_id?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          items?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_terms?: string | null
          purchase_order_number?: string | null
          responsible_person?: string | null
          source?: string | null
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          amount?: number
          billing_address?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          customer_id?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          purchase_order_number?: string | null
          responsible_person?: string | null
          source?: string | null
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          contact_preferences: string[] | null
          created_at: string | null
          created_by: string | null
          email: string | null
          follow_up_date: string | null
          id: string
          lead_score: number | null
          lead_source_detail: string | null
          lifecycle_stage: string | null
          name: string
          notes: string | null
          phone: string | null
          priority_level: string | null
          responsible_person: string | null
          score: number | null
          source: string | null
          status: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          contact_preferences?: string[] | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          lead_score?: number | null
          lead_source_detail?: string | null
          lifecycle_stage?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          priority_level?: string | null
          responsible_person?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          contact_preferences?: string[] | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          lead_score?: number | null
          lead_source_detail?: string | null
          lifecycle_stage?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          priority_level?: string | null
          responsible_person?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string | null
          description: string | null
          export_restrictions: string | null
          id: string
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string | null
          description?: string | null
          export_restrictions?: string | null
          id?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string | null
          description?: string | null
          export_restrictions?: string | null
          id?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proposal_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          approval_workflow: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deal_id: string | null
          delivery_method: string | null
          estimated_value: number | null
          id: string
          notes: string | null
          proposal_type: string | null
          responsible_person: string | null
          source: string | null
          status: string | null
          template_used: string | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
          validity_period: number | null
          version: number | null
        }
        Insert: {
          approval_workflow?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deal_id?: string | null
          delivery_method?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          proposal_type?: string | null
          responsible_person?: string | null
          source?: string | null
          status?: string | null
          template_used?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          validity_period?: number | null
          version?: number | null
        }
        Update: {
          approval_workflow?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deal_id?: string | null
          delivery_method?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          proposal_type?: string | null
          responsible_person?: string | null
          source?: string | null
          status?: string | null
          template_used?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          validity_period?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      search_index: {
        Row: {
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      target_markets: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          market_code: string
          market_name: string
          market_notes: string | null
          region: string | null
          regulatory_requirements: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          market_code: string
          market_name: string
          market_notes?: string | null
          region?: string | null
          regulatory_requirements?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          market_code?: string
          market_name?: string
          market_notes?: string | null
          region?: string | null
          regulatory_requirements?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          result: Json | null
          started_at: string | null
          status: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_templates: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
