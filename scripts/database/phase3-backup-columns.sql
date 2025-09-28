-- Phase 3: Add backup and archive columns to photos table
-- Run this in Supabase SQL Editor

-- Add Google Drive backup and archive support
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS google_drive_backup_url TEXT,
ADD COLUMN IF NOT EXISTS original_file_size BIGINT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_google_drive_backup ON photos(google_drive_backup_url);
CREATE INDEX IF NOT EXISTS idx_photos_is_archived ON photos(is_archived);
CREATE INDEX IF NOT EXISTS idx_photos_archived_at ON photos(archived_at);

-- Add comments for documentation
COMMENT ON COLUMN photos.google_drive_backup_url IS 'Google Drive URL for original uncompressed photo backup';
COMMENT ON COLUMN photos.original_file_size IS 'Size of original uncompressed file in bytes';
COMMENT ON COLUMN photos.is_archived IS 'True if photo is archived (soft delete)';
COMMENT ON COLUMN photos.archived_at IS 'Timestamp when photo was archived';

-- Update existing photos to set original_file_size from file_size if null
UPDATE photos 
SET original_file_size = file_size 
WHERE original_file_size IS NULL AND file_size IS NOT NULL;

-- Show current schema state
SELECT 
  'Phase 3 Columns Added' as status,
  COUNT(*) as total_photos,
  COUNT(CASE WHEN google_drive_backup_url IS NOT NULL THEN 1 END) as with_backup_url,
  COUNT(CASE WHEN original_file_size IS NOT NULL THEN 1 END) as with_original_size,
  COUNT(CASE WHEN is_archived = true THEN 1 END) as archived_count
FROM photos;