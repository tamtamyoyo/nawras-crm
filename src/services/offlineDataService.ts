import { devConfig } from '../config/development';
import { Database } from '@/lib/database.types';

// Use Database types for consistency
type Lead = Database['public']['Tables']['leads']['Row'];

// Types for our CRM entities
export interface Customer {
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

// Lead type is now imported from Database types above

export interface Deal {
  id: string;
  title: string;
  customer_id: string | null;
  lead_id: string | null;
  customer_name?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  probability: number;
  expected_close_date: string | null;
  description: string | null;
  source: string | null;
  assigned_to: string | null;
  notes?: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Additional required properties to match database schema
  responsible_person: 'Mr. Ali' | 'Mr. Mustafa' | 'Mr. Taha' | 'Mr. Mohammed';
  competitor_info: string | null;
  decision_maker_contact: string | null;
  deal_source: string | null;
  deal_type: string;
}

export interface ProposalContent {
  sections: string[];
  [key: string]: unknown;
}

export interface Proposal {
  id: string;
  title: string;
  customer_id: string;
  customer_name?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  total_amount: number;
  source: string | null;
  content?: ProposalContent;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
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
  items: InvoiceItem[]
  notes: string | null
  payment_terms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt'
  tax_rate: number
  source: string | null
  created_by: string | null
  created_at: string
  updated_at: string
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
    // Export-specific fields
    export_license_number: null,
    export_license_expiry: null,
    customs_broker: null,
    preferred_currency: null,
    payment_terms_export: null,
    credit_limit_usd: null,
    export_documentation_language: null,
    special_handling_requirements: null,
    compliance_notes: null
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
    // Export-specific fields
    export_license_number: null,
    export_license_expiry: null,
    customs_broker: null,
    preferred_currency: null,
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
    contact_preference: 'email',
    follow_up_date: '2024-02-01'
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
    contact_preference: 'phone',
    follow_up_date: null
  }
]

const MOCK_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Enterprise CRM Solution',
    customer_id: '1',
    lead_id: 'lead-1',
    customer_name: 'John Doe',
    stage: 'proposal',
    value: 50000,
    probability: 75,
    expected_close_date: '2024-02-15',
    description: 'Complete CRM implementation for enterprise client',
    source: 'Website',
    assigned_to: 'sales-rep-1',
    notes: 'Proposal sent, awaiting feedback',
    created_by: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'deal-2',
    title: 'Small Business Package',
    customer_id: '2',
    lead_id: null,
    customer_name: 'Jane Smith',
    stage: 'negotiation',
    value: 15000,
    probability: 60,
    expected_close_date: '2024-02-20',
    description: 'CRM solution for small business',
    source: 'Referral',
    assigned_to: null,
    notes: 'In negotiation phase',
    created_by: null,
    created_at: '2024-01-16T09:30:00Z',
    updated_at: '2024-01-16T09:30:00Z'
  }
];

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    title: 'CRM Implementation Proposal',
    customer_id: 'cust-1',
    customer_name: 'Ahmed Al-Rashid',
    status: 'sent',
    total_amount: 45000,
    source: 'Website',
    content: { sections: ['Overview', 'Implementation', 'Pricing'] },
    created_by: 'offline-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    updated_at: '2024-01-15T10:00:00Z'
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
    updated_at: '2024-01-20T10:00:00Z'
  }
];

class OfflineDataService {
  private isOfflineMode(): boolean {
    return devConfig.OFFLINE_MODE || import.meta.env.MODE === 'development';
  }

  private initializeStorage(): void {
    if (!this.isOfflineMode()) return;
    
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
    if (!this.isOfflineMode()) throw new Error('Not in offline mode');
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
    if (!this.isOfflineMode()) throw new Error('Not in offline mode');
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
    if (!this.isOfflineMode()) throw new Error('Not in offline mode');
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
    if (!this.isOfflineMode()) throw new Error('Not in offline mode');
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
    if (!this.isOfflineMode()) throw new Error('Not in offline mode');
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