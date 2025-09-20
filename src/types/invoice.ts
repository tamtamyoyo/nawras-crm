import { Database } from '../lib/database.types';

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