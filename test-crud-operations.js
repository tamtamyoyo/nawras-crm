import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqjjqfqhqjqhqjqhqjqh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxampxZnFocWpxaHFqcWhxanFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MDY4NzQsImV4cCI6MjA0ODE4Mjg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCRUDOperations() {
    console.log('=== Testing CRUD Operations After ON CONFLICT Fix ===\n');
    
    // Test 1: Create Customer
    console.log('=== Test 1: Create Customer ===');
    try {
        const { data: customer, error } = await supabase
            .from('customers')
            .insert({
                name: 'CRUD Test Customer',
                email: 'crud-test@example.com',
                phone: '+1234567890',
                company: 'Test Company',
                status: 'active'
            })
            .select()
            .single();
        
        if (error) {
            console.log('Customer creation failed:', error);
        } else {
            console.log('Customer created successfully:', customer.id);
            
            // Test 2: Read Customer
            console.log('\n=== Test 2: Read Customer ===');
            const { data: readCustomer, error: readError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', customer.id)
                .single();
            
            if (readError) {
                console.log('Customer read failed:', readError);
            } else {
                console.log('Customer read successfully:', readCustomer.name);
            }
            
            // Test 3: Update Customer
            console.log('\n=== Test 3: Update Customer ===');
            const { data: updatedCustomer, error: updateError } = await supabase
                .from('customers')
                .update({ company: 'Updated Test Company' })
                .eq('id', customer.id)
                .select()
                .single();
            
            if (updateError) {
                console.log('Customer update failed:', updateError);
            } else {
                console.log('Customer updated successfully. Version:', updatedCustomer.version);
            }
            
            // Test 4: Delete Customer
            console.log('\n=== Test 4: Delete Customer ===');
            const { error: deleteError } = await supabase
                .from('customers')
                .delete()
                .eq('id', customer.id);
            
            if (deleteError) {
                console.log('Customer deletion failed:', deleteError);
            } else {
                console.log('Customer deleted successfully');
            }
        }
    } catch (err) {
        console.log('Customer CRUD test failed:', err.message);
    }
    
    // Test 5: Create Lead
    console.log('\n=== Test 5: Create Lead ===');
    try {
        const { data: lead, error } = await supabase
            .from('leads')
            .insert({
                name: 'CRUD Test Lead',
                email: 'crud-lead@example.com',
                phone: '+1234567890',
                company: 'Lead Company',
                status: 'new',
                source: 'Website'
            })
            .select()
            .single();
        
        if (error) {
            console.log('Lead creation failed:', error);
        } else {
            console.log('Lead created successfully:', lead.id);
            
            // Clean up lead
            await supabase.from('leads').delete().eq('id', lead.id);
            console.log('Lead cleaned up');
        }
    } catch (err) {
        console.log('Lead CRUD test failed:', err.message);
    }
    
    // Test 6: Create Invoice
    console.log('\n=== Test 6: Create Invoice ===');
    try {
        // First create a customer for the invoice
        const { data: invoiceCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
                name: 'Invoice Test Customer',
                email: 'invoice-customer@example.com',
                status: 'active'
            })
            .select()
            .single();
        
        if (customerError) {
            console.log('Invoice customer creation failed:', customerError);
            return;
        }
        
        const { data: invoice, error } = await supabase
            .from('invoices')
            .insert({
                customer_id: invoiceCustomer.id,
                invoice_number: 'INV-CRUD-001',
                amount: 1000.00,
                status: 'draft',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            .select()
            .single();
        
        if (error) {
            console.log('Invoice creation failed:', error);
        } else {
            console.log('Invoice created successfully:', invoice.id);
            
            // Clean up invoice and customer
            await supabase.from('invoices').delete().eq('id', invoice.id);
            await supabase.from('customers').delete().eq('id', invoiceCustomer.id);
            console.log('Invoice and customer cleaned up');
        }
    } catch (err) {
        console.log('Invoice CRUD test failed:', err.message);
    }
    
    console.log('\n=== CRUD Operations Test Complete ===');
}

testCRUDOperations();