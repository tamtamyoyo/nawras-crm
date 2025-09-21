import { Database } from '../lib/database.types';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

// Extended invoice type with customer data for UI components
export type InvoiceWithCustomer = Invoice & {
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
};

// Extended invoice type with properly typed items
export type InvoiceWithItems = Omit<Invoice, 'items'> & {
  items: InvoiceItem[];
};

export type InvoiceInsertWithItems = Omit<InvoiceInsert, 'items'> & {
  items: InvoiceItem[];
};

export type InvoiceUpdateWithItems = Omit<InvoiceUpdate, 'items'> & {
  items?: InvoiceItem[];
};