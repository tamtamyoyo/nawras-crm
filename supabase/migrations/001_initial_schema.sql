-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'sales_rep')) DEFAULT 'sales_rep',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  tags TEXT[],
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'new',
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  stage TEXT CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'prospecting',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100) DEFAULT 50,
  expected_close_date DATE,
  description TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected')) DEFAULT 'draft',
  valid_until DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  due_date DATE NOT NULL,
  paid_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_deals_customer_id ON deals(customer_id);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_created_by ON deals(created_by);
CREATE INDEX idx_proposals_deal_id ON proposals(deal_id);
CREATE INDEX idx_proposals_customer_id ON proposals(customer_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for customers table
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customers they created" ON customers
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins and managers can update all customers" ON customers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for leads table
CREATE POLICY "Authenticated users can view leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update leads assigned to them or created by them" ON leads
  FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admins and managers can update all leads" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for deals table
CREATE POLICY "Authenticated users can view deals" ON deals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert deals" ON deals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update deals assigned to them or created by them" ON deals
  FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admins and managers can update all deals" ON deals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for proposals table
CREATE POLICY "Authenticated users can view proposals" ON proposals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert proposals" ON proposals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update proposals they created" ON proposals
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins and managers can update all proposals" ON proposals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for invoices table
CREATE POLICY "Authenticated users can view invoices" ON invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update invoices they created" ON invoices
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins and managers can update all invoices" ON invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON users TO anon, authenticated;
GRANT ALL PRIVILEGES ON customers TO authenticated;
GRANT ALL PRIVILEGES ON leads TO authenticated;
GRANT ALL PRIVILEGES ON deals TO authenticated;
GRANT ALL PRIVILEGES ON proposals TO authenticated;
GRANT ALL PRIVILEGES ON invoices TO authenticated;

-- Insert sample data
INSERT INTO users (id, email, full_name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'admin@nawrascrm.com', 'Admin User', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440001', 'manager@nawrascrm.com', 'Manager User', 'manager'),
  ('550e8400-e29b-41d4-a716-446655440002', 'sales@nawrascrm.com', 'Sales Rep', 'sales_rep');

INSERT INTO customers (name, email, phone, company, status, created_by) VALUES
  ('John Smith', 'john@example.com', '+1234567890', 'Acme Corp', 'active', '550e8400-e29b-41d4-a716-446655440000'),
  ('Jane Doe', 'jane@techstart.com', '+1234567891', 'TechStart Inc', 'active', '550e8400-e29b-41d4-a716-446655440001'),
  ('Bob Johnson', 'bob@globaltech.com', '+1234567892', 'Global Tech', 'active', '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO leads (name, email, phone, company, source, status, score, assigned_to, created_by) VALUES
  ('Alice Brown', 'alice@startup.com', '+1234567893', 'Startup Co', 'Website', 'new', 75, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('Charlie Wilson', 'charlie@enterprise.com', '+1234567894', 'Enterprise Ltd', 'Referral', 'contacted', 85, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO deals (title, customer_id, value, stage, probability, expected_close_date, assigned_to, created_by) VALUES
  ('Acme Corp Software License', (SELECT id FROM customers WHERE name = 'John Smith'), 50000.00, 'proposal', 75, '2024-03-15', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('TechStart Consulting Project', (SELECT id FROM customers WHERE name = 'Jane Doe'), 25000.00, 'negotiation', 90, '2024-02-28', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001');