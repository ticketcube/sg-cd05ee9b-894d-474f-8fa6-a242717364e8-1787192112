-- Drop city columns from newsletter_subscribers as decided (Option B)
ALTER TABLE newsletter_subscribers 
DROP COLUMN IF EXISTS city_id,
DROP COLUMN IF EXISTS raw_city_input;

-- Ensure we have the right columns for the newsletter system
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);