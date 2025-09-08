-- Add event status management columns to events table
-- Run this script in your Supabase SQL editor

-- Add status column with default value 'active'
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' 
CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived'));

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Update existing events to have 'active' status if they don't have one
UPDATE events 
SET status = 'active' 
WHERE status IS NULL;

-- Add comment to document the status column
COMMENT ON COLUMN events.status IS 'Event status: draft, active, paused, completed, cancelled, archived';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('status', 'is_archived', 'archived_at', 'google_drive_backup_url')
ORDER BY ordinal_position;