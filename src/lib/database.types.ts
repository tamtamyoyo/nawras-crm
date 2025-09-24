export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'manager' | 'sales_rep' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'sales_rep' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'sales_rep' | null
          created_at?: string | null
          updated_at?: string | null
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
          status: 'active' | 'inactive' | 'prospect' | null
          tags: string[] | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          source: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          export_license_number: string | null
          export_license_expiry: string | null
          customs_broker: string | null
          preferred_currency: string | null
          payment_terms_export: string | null
          credit_limit_usd: number | null
          export_documentation_language: string | null
          special_handling_requirements: string | null
          compliance_notes: string | null
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          version: number | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'prospect' | null
          tags?: string[] | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          export_license_number?: string | null
          export_license_expiry?: string | null
          customs_broker?: string | null
          preferred_currency?: string | null
          payment_terms_export?: string | null
          credit_limit_usd?: number | null
          export_documentation_language?: string | null
          special_handling_requirements?: string | null
          compliance_notes?: string | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          version?: number | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'prospect' | null
          tags?: string[] | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          export_license_number?: string | null
          export_license_expiry?: string | null
          customs_broker?: string | null
          preferred_currency?: string | null
          payment_terms_export?: string | null
          credit_limit_usd?: number | null
          export_documentation_language?: string | null
          special_handling_requirements?: string | null
          compliance_notes?: string | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          version?: number | null
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          source: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | null
          score: number | null
          notes: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          lifecycle_stage: 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist' | 'other' | null
          lead_score: number | null
          priority_level: 'low' | 'medium' | 'high' | 'urgent' | null
          contact_preferences: string[] | null
          follow_up_date: string | null
          lead_source_detail: string | null
          version: number | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | null
          score?: number | null
          notes?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          lifecycle_stage?: 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist' | 'other' | null
          lead_score?: number | null
          priority_level?: 'low' | 'medium' | 'high' | 'urgent' | null
          contact_preferences?: string[] | null
          follow_up_date?: string | null
          lead_source_detail?: string | null
          version?: number | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | null
          score?: number | null
          notes?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          lifecycle_stage?: 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist' | 'other' | null
          lead_score?: number | null
          priority_level?: 'low' | 'medium' | 'high' | 'urgent' | null
          contact_preferences?: string[] | null
          follow_up_date?: string | null
          lead_source_detail?: string | null
          version?: number | null
        }
      }
      deals: {
        Row: {
          id: string
          title: string
          customer_id: string | null
          lead_id: string | null
          value: number
          stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | null
          probability: number | null
          expected_close_date: string | null
          description: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          source: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          deal_source_detail: string | null
          competitor_info: string | null
          decision_maker_name: string | null
          decision_maker_email: string | null
          decision_maker_phone: string | null
          deal_type: 'new_business' | 'existing_business' | 'renewal' | 'upsell' | 'cross_sell' | null
          version: number | null
        }
        Insert: {
          id?: string
          title: string
          customer_id?: string | null
          lead_id?: string | null
          value?: number
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | null
          probability?: number | null
          expected_close_date?: string | null
          description?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          deal_source_detail?: string | null
          competitor_info?: string | null
          decision_maker_name?: string | null
          decision_maker_email?: string | null
          decision_maker_phone?: string | null
          deal_type?: 'new_business' | 'existing_business' | 'renewal' | 'upsell' | 'cross_sell' | null
          version?: number | null
        }
        Update: {
          id?: string
          title?: string
          customer_id?: string | null
          lead_id?: string | null
          value?: number
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | null
          probability?: number | null
          expected_close_date?: string | null
          description?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          deal_source_detail?: string | null
          competitor_info?: string | null
          decision_maker_name?: string | null
          decision_maker_email?: string | null
          decision_maker_phone?: string | null
          deal_type?: 'new_business' | 'existing_business' | 'renewal' | 'upsell' | 'cross_sell' | null
          version?: number | null
        }
      }
      proposals: {
        Row: {
          id: string
          title: string
          deal_id: string | null
          customer_id: string | null
          content: string
          status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | null
          valid_until: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          notes: string | null
          total_amount: number | null
          source: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          proposal_type: 'standard' | 'custom' | 'template' | 'rfp_response' | 'quote' | null
          validity_period: number | null
          approval_workflow: 'single_approval' | 'multi_level_approval' | 'committee_approval' | 'auto_approval' | null
          template_used: string | null
          delivery_method: 'email' | 'portal' | 'physical_mail' | 'in_person' | 'fax' | null
          estimated_value: number | null
          version: number | null
        }
        Insert: {
          id?: string
          title: string
          deal_id?: string | null
          customer_id?: string | null
          content: string
          status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | null
          valid_until?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          notes?: string | null
          total_amount?: number | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          proposal_type?: 'standard' | 'custom' | 'template' | 'rfp_response' | 'quote' | null
          validity_period?: number | null
          approval_workflow?: 'single_approval' | 'multi_level_approval' | 'committee_approval' | 'auto_approval' | null
          template_used?: string | null
          delivery_method?: 'email' | 'portal' | 'physical_mail' | 'in_person' | 'fax' | null
          estimated_value?: number | null
          version?: number | null
        }
        Update: {
          id?: string
          title?: string
          deal_id?: string | null
          customer_id?: string | null
          content?: string
          status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | null
          valid_until?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          notes?: string | null
          total_amount?: number | null
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          proposal_type?: 'standard' | 'custom' | 'template' | 'rfp_response' | 'quote' | null
          validity_period?: number | null
          approval_workflow?: 'single_approval' | 'multi_level_approval' | 'committee_approval' | 'auto_approval' | null
          template_used?: string | null
          delivery_method?: 'email' | 'portal' | 'physical_mail' | 'in_person' | 'fax' | null
          estimated_value?: number | null
          version?: number | null
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
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | null
          due_date: string
          paid_date: string | null
          items: any
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          payment_terms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | null
          tax_rate: number
          source: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          billing_address: string | null
          purchase_order_number: string | null
          payment_method: 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'check' | 'paypal' | 'stripe' | 'other' | null
          currency_code: 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'CNY' | 'JPY' | null
          discount_amount: number | null
          discount_percentage: number | null
          version: number | null
        }
        Insert: {
          id?: string
          invoice_number: string
          customer_id: string
          deal_id?: string | null
          amount?: number
          tax_amount?: number
          total_amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | null
          due_date: string
          paid_date?: string | null
          items?: any
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | null
          tax_rate?: number
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          billing_address?: string | null
          purchase_order_number?: string | null
          payment_method?: 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'check' | 'paypal' | 'stripe' | 'other' | null
          currency_code?: 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'CNY' | 'JPY' | null
          discount_amount?: number | null
          discount_percentage?: number | null
          version?: number | null
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_id?: string
          deal_id?: string | null
          amount?: number
          tax_amount?: number
          total_amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | null
          due_date?: string
          paid_date?: string | null
          items?: any
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | null
          tax_rate?: number
          source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other' | null
          responsible_person?: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed'
          billing_address?: string | null
          purchase_order_number?: string | null
          payment_method?: 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'check' | 'paypal' | 'stripe' | 'other' | null
          currency_code?: 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'CNY' | 'JPY' | null
          discount_amount?: number | null
          discount_percentage?: number | null
          version?: number | null
        }
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
