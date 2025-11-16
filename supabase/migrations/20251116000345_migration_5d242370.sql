-- Add new columns to ticketmaster_events table
ALTER TABLE ticketmaster_events
ADD COLUMN IF NOT EXISTS artist_name TEXT,
ADD COLUMN IF NOT EXISTS artist_image TEXT,
ADD COLUMN IF NOT EXISTS artist_videolink TEXT;