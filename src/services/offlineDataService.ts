import { Database } from '@/lib/database.types';
import { isOfflineMode } from '../utils/offlineMode';

// Use Database types for consistency
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type Deal = Database['public']['Tables']['deals']['Row'];
export type Proposal = Database['public']['Tables']['proposals']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];

export interface ProposalContent {
  sections: string[];
  [key: string]: unknown;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Local Storage Keys
const STORAGE_KEYS = {
  CUSTOMERS: 'nawras_crm_customers',
  LEADS: 'nawras_crm_leads',
  DEALS: 'nawras_crm_deals',
  PROPOSALS: 'nawras_crm_proposals',
  INVOICES: 'nawras_crm_invoices',
  INITIALIZED: 'nawras_crm_initialized'
};

// Mock Data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    address: '123 Main St, City, State 12345',
    status: 'active',
    source: 'Website',
    tags: ['vip', 'enterprise'],
    notes: 'Important client with high value deals',
    created_by: 'user1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    responsible_person: 'Mr. Ali',
    version: 1,
    // Export-specific fields
    export_license_number: 'EXP-2024-001',
    export_license_expiry: '2025-12-31',
    customs_broker: 'Global Customs LLC',
    preferred_currency: 'USD',
    payment_terms_export: 'NET 30',
    credit_limit_usd: 100000,
    export_documentation_language: 'English',
    special_handling_requirements: 'Temperature controlled',
    compliance_notes: 'All documents verified'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@techstart.com',
    phone: '+1-555-0124',
    company: 'TechStart Inc',
    address: '456 Oak Ave, City, State 12346',
    status: 'prospect',
    source: 'Referral',
    tags: ['startup', 'tech'],
    notes: 'Potential new client, interested in our services',
    created_by: 'user1',
    created_at: '2024-01-16T09:30:00Z',
    updated_at: '2024-01-16T09:30:00Z',
    responsible_person: 'Mr. Mustafa',
    version: 1,
    // Export-specific fields
    export_license_number: null,
    export_license_expiry: null,
    customs_broker: null,
    preferred_currency: 'USD',
    payment_terms_export: null,
    credit_limit_usd: null,
    export_documentation_language: null,
    special_handling_requirements: null,
    compliance_notes: null
  }
]

const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Ahmed Al-Rashid',
    email: 'ahmed@example.com',
    phone: '+1-555-0125',
    company: 'Enterprise Corp',
    source: 'Website',
    status: 'qualified',
    score: 85,
    notes: 'Looking for comprehensive CRM solution',
    assigned_to: null,
    created_by: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    responsible_person: 'Mr. Ali',
    lifecycle_stage: 'opportunity',
    priority_level: 'high',
    contact_preferences: ['email'],
    follow_up_date: '2024-02-01',
    lead_score: 85,
    lead_source_detail: 'Contact form submission',
    version: 1
  },
  {
    id: 'lead-2',
    name: 'Sarah Johnson',
    email: 'sarah@smallbiz.com',
    phone: '+1-555-0126',
    company: 'Small Business Inc',
    source: 'Referral',
    status: 'new',
    score: 60,
    notes: 'Initial inquiry about pricing',
    assigned_to: null,
    created_by: null,
    created_at: '2024-01-16T09:30:00Z',
    updated_at: '2024-01-16T09:30:00Z',
    responsible_person: 'Mr. Mustafa',
    lifecycle_stage: 'lead',
    priority_level: 'medium',
    contact_preferences: ['phone'],
    follow_up_date: null,
    lead_score: 60,
    lead_source_detail: 'Partner referral',
    version: 1
  }
]

const MOCK_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Enterprise CRM Solution',
    customer_id: '1',
    lead_id: 'lead-1',
    stage: 'proposal',
    value: 50000,
    probability: 75,
    expected_close_date: '2024-02-15',
    description: 'Complete CRM implementation for enterprise client',
    source: 'Website',
    assigned_to: 'sales-rep-1',
    created_by: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    responsible_person: 'Mr. Ali',
    deal_source_detail: 'Website contact form',
    competitor_info: null,
    decision_maker_name: 'John Doe',
    decision_maker_email: 'john@enterprise.com',
    decision_maker_phone: '+1-555-0123',
    deal_type: 'new_business',
    version: 1
  },
  {
    id: 'deal-2',
    title: 'Small Business Package',
    customer_id: '2',
    lead_id: null,
    stage: 'negotiation',
    value: 15000,
    probability: 60,
    expected_close_date: '2024-02-20',
    description: 'CRM solution for small business',
    source: 'Referral',
    assigned_to: null,
    created_by: null,
    created_at: '2024-01-16T09:30:00Z',
    updated_at: '2024-01-16T09:30:00Z',
    responsible_person: 'Mr. Mustafa',
    deal_source_detail: 'Partner referral',
    competitor_info: null,
    decision_maker_name: 'Jane Smith',
    decision_maker_email: 'jane@smallbiz.com',
    decision_maker_phone: '+1-555-0126',
    deal_type: 'new_business',
    version: 1
  }
];

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    title: 'CRM Implementation Proposal',
    customer_id: 'cust-1',
    deal_id: 'deal-1',
    status: 'sent',
    content: 'Complete CRM implementation proposal with overview, implementation plan, and pricing details.',
    created_by: 'offline-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    valid_until: '2024-12-31T23:59:59Z',
    notes: null,
    total_amount: 50000,
    source: 'Website',
    responsible_person: 'Mr. Ali',
    proposal_type: 'standard',
    validity_period: 30,
    approval_workflow: null,
    template_used: null,
    delivery_method: 'email',
    estimated_value: 50000,
    version: 1
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'invoice-1',
    invoice_number: 'INV-001',
    customer_id: 'customer-1',
    deal_id: 'deal-1',
    amount: 4500,
    tax_amount: 500,
    total_amount: 5000,
    status: 'sent',
    due_date: '2024-02-15',
    paid_date: null,
    items: [{ description: 'Consulting Services', quantity: 1, rate: 4500, amount: 4500 }],
    notes: null,
    payment_terms: 'net_30',
    tax_rate: 0.1,
    source: 'Website',
    created_by: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    responsible_person: 'Mr. Ali',
    billing_address: '123 Main St, City, State 12345',
    purchase_order_number: 'PO-2024-001',
    payment_method: 'bank_transfer',
    currency_code: 'USD',
    discount_amount: null,
    discount_percentage: null,
    version: 1
  },
  {
    id: 'invoice-2',
    invoice_number: 'INV-002',
    customer_id: 'customer-2',
    deal_id: 'deal-2',
    amount: 2700,
    tax_amount: 300,
    total_amount: 3000,
    status: 'paid',
    due_date: '2024-01-30',
    paid_date: '2024-01-20',
    items: [{ description: 'Software License', quantity: 1, rate: 2700, amount: 2700 }],
    notes: 'Payment received on time',
    payment_terms: 'net_15',
    tax_rate: 0.1,
    source: 'Referral',
    created_by: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    responsible_person: 'Mr. Mustafa',
    billing_address: '456 Oak Ave, City, State 12346',
    purchase_order_number: null,
    payment_method: 'credit_card',
    currency_code: 'USD',
    discount_amount: null,
    discount_percentage: null,
    version: 1
  }
];

class OfflineDataService {
  private initializeStorage(): void {
    if (!isOfflineMode()) return;
    
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(MOCK_LEADS));
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(MOCK_DEALS));
      localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(MOCK_PROPOSALS));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(MOCK_INVOICES));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      console.log('🔧 Offline data initialized');
    }
  }

  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
    }
  }

  private generateId(): string {
    return `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize the service
  init(): void {
    this.initializeStorage();
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return this.getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const customers = await this.getCustomers();
    return customers.find(c => c.id === id) || null;
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const customers = await this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    this.saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const customers = await this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    
    customers[index] = {
      ...customers[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
  }

  async deleteCustomer(id: string): Promise<void> {
    const customers = await this.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    this.saveToStorage(STORAGE_KEYS.CUSTOMERS, filtered);
  }

  // Lead operations
  async getLeads(): Promise<Lead[]> {
    return this.getFromStorage<Lead>(STORAGE_KEYS.LEADS);
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const leads = await this.getLeads();
    const newLead: Lead = {
      ...lead,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    leads.push(newLead);
    this.saveToStorage(STORAGE_KEYS.LEADS, leads);
    return newLead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const leads = await this.getLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lead not found');
    
    leads[index] = {
      ...leads[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveToStorage(STORAGE_KEYS.LEADS, leads);
    return leads[index];
  }

  async deleteLead(id: string): Promise<void> {
    const leads = await this.getLeads();
    const filtered = leads.filter(l => l.id !== id);
    this.saveToStorage(STORAGE_KEYS.LEADS, filtered);
  }

  // Deal operations
  async getDeals(): Promise<Deal[]> {
    return this.getFromStorage<Deal>(STORAGE_KEYS.DEALS);
  }

  async createDeal(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>): Promise<Deal> {
    const deals = await this.getDeals();
    const newDeal: Deal = {
      ...deal,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    deals.push(newDeal);
    this.saveToStorage(STORAGE_KEYS.DEALS, deals);
    return newDeal;
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    const deals = await this.getDeals();
    const index = deals.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Deal not found');
    
    deals[index] = {
      ...deals[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveToStorage(STORAGE_KEYS.DEALS, deals);
    return deals[index];
  }

  async deleteDeal(id: string): Promise<void> {
    const deals = await this.getDeals();
    const filtered = deals.filter(d => d.id !== id);
    this.saveToStorage(STORAGE_KEYS.DEALS, filtered);
  }

  // Proposal operations
  async getProposals(): Promise<Proposal[]> {
    return this.getFromStorage<Proposal>(STORAGE_KEYS.PROPOSALS);
  }

  async createProposal(proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> {
    const proposals = await this.getProposals();
    const newProposal: Proposal = {
      ...proposal,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    proposals.push(newProposal);
    this.saveToStorage(STORAGE_KEYS.PROPOSALS, proposals);
    return newProposal;
  }

  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
    const proposals = await this.getProposals();
    const index = proposals.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Proposal not found');
    
    proposals[index] = {
      ...proposals[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveToStorage(STORAGE_KEYS.PROPOSALS, proposals);
    return proposals[index];
  }

  async deleteProposal(id: string): Promise<void> {
    const proposals = await this.getProposals();
    const filtered = proposals.filter(p => p.id !== id);
    this.saveToStorage(STORAGE_KEYS.PROPOSALS, filtered);
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return this.getFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const newInvoice: Invoice = {
      ...invoice,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    invoices.push(newInvoice);
    this.saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    return newInvoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Invoice not found');
    
    invoices[index] = {
      ...invoices[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    return invoices[index];
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoices = await this.getInvoices();
    const filtered = invoices.filter(i => i.id !== id);
    this.saveToStorage(STORAGE_KEYS.INVOICES, filtered);
  }

  // Dashboard data
  async getDashboardData() {
    const [customers, leads, deals, proposals, invoices] = await Promise.all([
      this.getCustomers(),
      this.getLeads(),
      this.getDeals(),
      this.getProposals(),
      this.getInvoices()
    ]);

    const totalRevenue = deals
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, d) => sum + d.value, 0);

    const pipelineValue = deals
      .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
      .reduce((sum, d) => sum + d.value, 0);

    return {
      customers: customers.length,
      leads: leads.length,
      deals: deals.length,
      proposals: proposals.length,
      invoices: invoices.length,
      totalRevenue,
      pipelineValue,
      recentCustomers: customers.slice(-5),
      recentDeals: deals.slice(-5),
      monthlyRevenue: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
        revenue: Math.floor(Math.random() * 50000) + 10000
      }))
    };
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ All offline data cleared');
  }
}

// Export singleton instance
export const offlineDataService = new OfflineDataService();

// Initialize on import
offlineDataService.init();