-- China Export Business Fields Migration
-- Add comprehensive export-specific tables and fields for China business operations

-- Create export licenses table
CREATE TABLE IF NOT EXISTS export_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  license_number VARCHAR(100) NOT NULL,
  license_type VARCHAR(50) NOT NULL,
  issuing_authority VARCHAR(200) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HS codes table for customs classification
CREATE TABLE IF NOT EXISTS hs_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100),
  duty_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create export ports table
CREATE TABLE IF NOT EXISTS export_ports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  port_code VARCHAR(10) NOT NULL UNIQUE,
  port_name VARCHAR(200) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'China',
  port_type VARCHAR(50) CHECK (port_type IN ('seaport', 'airport', 'land_border')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_code VARCHAR(20) NOT NULL UNIQUE,
  certificate_name VARCHAR(200) NOT NULL,
  description TEXT,
  issuing_body VARCHAR(200),
  validity_period_months INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create incoterms table
CREATE TABLE IF NOT EXISTS incoterms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_code VARCHAR(10) NOT NULL UNIQUE,
  term_name VARCHAR(100) NOT NULL,
  description TEXT,
  risk_transfer_point TEXT,
  cost_responsibility TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create target markets table
CREATE TABLE IF NOT EXISTS target_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL UNIQUE,
  market_name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  regulatory_requirements TEXT,
  market_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_code VARCHAR(20) NOT NULL UNIQUE,
  category_name VARCHAR(200) NOT NULL,
  parent_category_id UUID REFERENCES product_categories(id),
  description TEXT,
  export_restrictions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add export-specific fields to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS export_license_number VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS export_license_expiry DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customs_broker VARCHAR(200);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms_export VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit_usd DECIMAL(15,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS export_documentation_language VARCHAR(20) DEFAULT 'English';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS special_handling_requirements TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS compliance_notes TEXT;

-- Create junction tables for many-to-many relationships

-- Customer HS Codes (many-to-many)
CREATE TABLE IF NOT EXISTS customer_hs_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  hs_code_id UUID REFERENCES hs_codes(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  volume_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, hs_code_id)
);

-- Customer Export Ports (many-to-many)
CREATE TABLE IF NOT EXISTS customer_export_ports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  export_port_id UUID REFERENCES export_ports(id) ON DELETE CASCADE,
  is_preferred BOOLEAN DEFAULT false,
  shipping_method VARCHAR(50),
  transit_time_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, export_port_id)
);

-- Customer Certificates (many-to-many)
CREATE TABLE IF NOT EXISTS customer_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  issuing_body VARCHAR(200),
  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'pending', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, certificate_id)
);

-- Customer Target Markets (many-to-many)
CREATE TABLE IF NOT EXISTS customer_target_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  target_market_id UUID REFERENCES target_markets(id) ON DELETE CASCADE,
  market_priority INTEGER CHECK (market_priority BETWEEN 1 AND 10),
  annual_volume_target DECIMAL(15,2),
  market_entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, target_market_id)
);

-- Customer Product Categories (many-to-many)
CREATE TABLE IF NOT EXISTS customer_product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  volume_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_category_id)
);

-- Customer Incoterms (many-to-many)
CREATE TABLE IF NOT EXISTS customer_incoterms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  incoterm_id UUID REFERENCES incoterms(id) ON DELETE CASCADE,
  is_preferred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, incoterm_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_export_licenses_customer_id ON export_licenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_export_licenses_status ON export_licenses(status);
CREATE INDEX IF NOT EXISTS idx_export_licenses_expiry ON export_licenses(expiry_date);

CREATE INDEX IF NOT EXISTS idx_customer_hs_codes_customer_id ON customer_hs_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_export_ports_customer_id ON customer_export_ports(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_certificates_customer_id ON customer_certificates(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_target_markets_customer_id ON customer_target_markets(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_categories_customer_id ON customer_product_categories(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_incoterms_customer_id ON customer_incoterms(customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE export_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incoterms ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_hs_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_export_ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_target_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_incoterms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view all export data" ON export_licenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert export licenses" ON export_licenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update export licenses" ON export_licenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete export licenses" ON export_licenses FOR DELETE USING (auth.role() = 'authenticated');

-- Apply similar policies to all tables
CREATE POLICY "Users can view hs_codes" ON hs_codes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage hs_codes" ON hs_codes FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view export_ports" ON export_ports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage export_ports" ON export_ports FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view certificates" ON certificates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage certificates" ON certificates FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view incoterms" ON incoterms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage incoterms" ON incoterms FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view target_markets" ON target_markets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage target_markets" ON target_markets FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view product_categories" ON product_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage product_categories" ON product_categories FOR ALL USING (auth.role() = 'authenticated');

-- Junction table policies
CREATE POLICY "Users can manage customer_hs_codes" ON customer_hs_codes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage customer_export_ports" ON customer_export_ports FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage customer_certificates" ON customer_certificates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage customer_target_markets" ON customer_target_markets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage customer_product_categories" ON customer_product_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage customer_incoterms" ON customer_incoterms FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial data for reference tables

-- Insert common export ports
INSERT INTO export_ports (port_code, port_name, city, port_type) VALUES
('CNSHA', 'Port of Shanghai', 'Shanghai', 'seaport'),
('CNSZX', 'Port of Shenzhen', 'Shenzhen', 'seaport'),
('CNNGB', 'Port of Ningbo', 'Ningbo', 'seaport'),
('CNTAO', 'Port of Qingdao', 'Qingdao', 'seaport'),
('CNTXG', 'Port of Tianjin', 'Tianjin', 'seaport'),
('CNCAN', 'Port of Guangzhou', 'Guangzhou', 'seaport'),
('CNXMN', 'Port of Xiamen', 'Xiamen', 'seaport'),
('CNDLC', 'Port of Dalian', 'Dalian', 'seaport')
ON CONFLICT (port_code) DO NOTHING;

-- Insert common certificates
INSERT INTO certificates (certificate_code, certificate_name, description, issuing_body) VALUES
('CE', 'CE Marking', 'European Conformity certification for products sold in European Economic Area', 'Notified Bodies'),
('ISO9001', 'ISO 9001', 'Quality Management System certification', 'ISO Certification Bodies'),
('FDA', 'FDA Approval', 'US Food and Drug Administration approval', 'US FDA'),
('CCC', 'China Compulsory Certificate', 'Mandatory certification for products sold in China', 'CNCA'),
('ROHS', 'RoHS Compliance', 'Restriction of Hazardous Substances certification', 'Various Bodies'),
('FCC', 'FCC Certification', 'Federal Communications Commission certification for electronic devices', 'US FCC'),
('UL', 'UL Certification', 'Underwriters Laboratories safety certification', 'UL LLC'),
('GS', 'GS Mark', 'German safety certification', 'German Testing Bodies')
ON CONFLICT (certificate_code) DO NOTHING;

-- Insert common Incoterms
INSERT INTO incoterms (term_code, term_name, description, risk_transfer_point, cost_responsibility) VALUES
('FOB', 'Free On Board', 'Seller delivers goods on board vessel', 'Ships rail at port of shipment', 'Seller pays until goods on board'),
('CIF', 'Cost, Insurance and Freight', 'Seller pays costs and freight to destination', 'Ships rail at port of shipment', 'Seller pays cost, insurance, freight'),
('EXW', 'Ex Works', 'Seller makes goods available at premises', 'Sellers premises', 'Buyer pays all costs from sellers premises'),
('DDP', 'Delivered Duty Paid', 'Seller delivers goods cleared for import', 'Destination country', 'Seller pays all costs including duties'),
('DAP', 'Delivered At Place', 'Seller delivers goods to named place', 'Named place of destination', 'Seller pays transport to destination'),
('CFR', 'Cost and Freight', 'Seller pays cost and freight to destination', 'Ships rail at port of shipment', 'Seller pays cost and freight'),
('CPT', 'Carriage Paid To', 'Seller pays carriage to named destination', 'Carrier at origin', 'Seller pays carriage to destination'),
('FCA', 'Free Carrier', 'Seller delivers goods to carrier', 'Named place (carrier)', 'Seller pays until delivery to carrier')
ON CONFLICT (term_code) DO NOTHING;

-- Insert target markets
INSERT INTO target_markets (market_code, market_name, region, regulatory_requirements) VALUES
('NA', 'North America', 'Americas', 'FDA, FCC, UL certifications may be required'),
('EU', 'European Union', 'Europe', 'CE marking, ROHS compliance required'),
('SEA', 'Southeast Asia', 'Asia Pacific', 'Various local certifications required'),
('ME', 'Middle East', 'Middle East & Africa', 'Local import licenses and certifications'),
('SA', 'South America', 'Americas', 'Local regulatory compliance required'),
('AF', 'Africa', 'Middle East & Africa', 'Import permits and local certifications'),
('OC', 'Oceania', 'Asia Pacific', 'Australian/New Zealand standards compliance'),
('EA', 'East Asia', 'Asia Pacific', 'Local market specific requirements')
ON CONFLICT (market_code) DO NOTHING;

-- Insert product categories
INSERT INTO product_categories (category_code, category_name, description) VALUES
('ELEC', 'Electronics', 'Electronic devices and components'),
('TEXT', 'Textiles', 'Clothing, fabrics, and textile products'),
('MACH', 'Machinery', 'Industrial machinery and equipment'),
('CHEM', 'Chemicals', 'Chemical products and materials'),
('FOOD', 'Food Products', 'Food and beverage items'),
('AUTO', 'Automotive', 'Automotive parts and accessories'),
('FURN', 'Furniture', 'Furniture and home furnishings'),
('TOYS', 'Toys & Games', 'Toys, games, and recreational products'),
('MEDI', 'Medical Devices', 'Medical and healthcare equipment'),
('CONS', 'Consumer Goods', 'General consumer products')
ON CONFLICT (category_code) DO NOTHING;

-- Insert common HS codes (sample)
INSERT INTO hs_codes (code, description, category) VALUES
('8517.12.00', 'Telephones for cellular networks or for other wireless networks', 'Electronics'),
('6109.10.00', 'T-shirts, singlets and other vests, knitted or crocheted, of cotton', 'Textiles'),
('8471.30.01', 'Portable automatic data processing machines, weighing not more than 10 kg', 'Electronics'),
('3004.90.91', 'Medicaments consisting of mixed or unmixed products for therapeutic uses', 'Pharmaceuticals'),
('9403.10.00', 'Metal furniture of a kind used in offices', 'Furniture')
ON CONFLICT (code) DO NOTHING;

-- Add updated_at trigger for all new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_export_licenses_updated_at BEFORE UPDATE ON export_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_hs_codes_updated_at BEFORE UPDATE ON customer_hs_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_export_ports_updated_at BEFORE UPDATE ON customer_export_ports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_certificates_updated_at BEFORE UPDATE ON customer_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_target_markets_updated_at BEFORE UPDATE ON customer_target_markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_product_categories_updated_at BEFORE UPDATE ON customer_product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_incoterms_updated_at BEFORE UPDATE ON customer_incoterms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();