-- Add additional profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update the updated_at timestamp
UPDATE users SET updated_at = NOW() WHERE phone IS NULL AND company IS NULL AND bio IS NULL;