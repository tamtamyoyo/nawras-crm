-- Add optimistic locking support with version columns and triggers
-- This migration adds version control to prevent race conditions and data corruption

-- Add version columns to all main tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create function to increment version on updates
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment version if this is an actual update (not insert)
    IF TG_OP = 'UPDATE' THEN
        NEW.version = OLD.version + 1;
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for version increment on all tables
DROP TRIGGER IF EXISTS customers_version_trigger ON customers;
CREATE TRIGGER customers_version_trigger
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS leads_version_trigger ON leads;
CREATE TRIGGER leads_version_trigger
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS deals_version_trigger ON deals;
CREATE TRIGGER deals_version_trigger
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS proposals_version_trigger ON proposals;
CREATE TRIGGER proposals_version_trigger
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS invoices_version_trigger ON invoices;
CREATE TRIGGER invoices_version_trigger
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS calendar_events_version_trigger ON calendar_events;
CREATE TRIGGER calendar_events_version_trigger
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Initialize version for existing records
UPDATE customers SET version = 1 WHERE version IS NULL;
UPDATE leads SET version = 1 WHERE version IS NULL;
UPDATE deals SET version = 1 WHERE version IS NULL;
UPDATE proposals SET version = 1 WHERE version IS NULL;
UPDATE invoices SET version = 1 WHERE version IS NULL;
UPDATE calendar_events SET version = 1 WHERE version IS NULL;

-- Add indexes for better performance on version-based queries
CREATE INDEX IF NOT EXISTS idx_customers_version ON customers(id, version);
CREATE INDEX IF NOT EXISTS idx_leads_version ON leads(id, version);
CREATE INDEX IF NOT EXISTS idx_deals_version ON deals(id, version);
CREATE INDEX IF NOT EXISTS idx_proposals_version ON proposals(id, version);
CREATE INDEX IF NOT EXISTS idx_invoices_version ON invoices(id, version);
CREATE INDEX IF NOT EXISTS idx_calendar_events_version ON calendar_events(id, version);

-- Create function to check for calendar event conflicts
CREATE OR REPLACE FUNCTION check_calendar_conflicts(
    p_start_date DATE,
    p_start_time TIME,
    p_end_date DATE,
    p_end_time TIME,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    start_date DATE,
    start_time TIME,
    end_date DATE,
    end_time TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.start_date,
        ce.start_time,
        ce.end_date,
        ce.end_time
    FROM calendar_events ce
    WHERE 
        ce.status != 'cancelled'
        AND (p_exclude_id IS NULL OR ce.id != p_exclude_id)
        AND (
            -- Check for date overlap
            (ce.start_date <= p_end_date AND ce.end_date >= p_start_date)
            AND (
                -- If same day, check time overlap
                (ce.start_date = p_start_date AND ce.end_date = p_end_date AND 
                 ce.start_time < p_end_time AND ce.end_time > p_start_time)
                OR
                -- If different days, there's definitely overlap
                (ce.start_date != p_end_date OR ce.end_date != p_start_date)
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION check_calendar_conflicts TO authenticated;
GRANT EXECUTE ON FUNCTION check_calendar_conflicts TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION increment_version() IS 'Automatically increments version column on record updates for optimistic locking';
COMMENT ON FUNCTION check_calendar_conflicts IS 'Checks for conflicting calendar events in the given time range';

-- Add constraints to ensure version is always positive
ALTER TABLE customers ADD CONSTRAINT customers_version_positive CHECK (version > 0);
ALTER TABLE leads ADD CONSTRAINT leads_version_positive CHECK (version > 0);
ALTER TABLE deals ADD CONSTRAINT deals_version_positive CHECK (version > 0);
ALTER TABLE proposals ADD CONSTRAINT proposals_version_positive CHECK (version > 0);
ALTER TABLE invoices ADD CONSTRAINT invoices_version_positive CHECK (version > 0);
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_version_positive CHECK (version > 0);