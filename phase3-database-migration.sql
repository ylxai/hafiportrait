-- ============================================================================
-- PHASE 3 DATABASE MIGRATION: Google Drive Backup & Archive Support
-- HafiPortrait Photography System
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and Run this script
-- 4. Verify results in the output
-- ============================================================================

-- Add Phase 3 columns to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS google_drive_backup_url TEXT,
ADD COLUMN IF NOT EXISTS original_file_size BIGINT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_google_drive_backup ON photos(google_drive_backup_url);
CREATE INDEX IF NOT EXISTS idx_photos_is_archived ON photos(is_archived);
CREATE INDEX IF NOT EXISTS idx_photos_archived_at ON photos(archived_at);
CREATE INDEX IF NOT EXISTS idx_photos_original_file_size ON photos(original_file_size);

-- Add column comments for documentation
COMMENT ON COLUMN photos.google_drive_backup_url IS 'Google Drive URL for original uncompressed photo backup';
COMMENT ON COLUMN photos.original_file_size IS 'Size of original uncompressed file in bytes (before Sharp processing)';
COMMENT ON COLUMN photos.is_archived IS 'True if photo is archived (soft delete) - hidden from galleries';
COMMENT ON COLUMN photos.archived_at IS 'Timestamp when photo was archived';

-- Update existing photos: set original_file_size from file_size if null
UPDATE photos 
SET original_file_size = file_size 
WHERE original_file_size IS NULL AND file_size IS NOT NULL;

-- Create view for backup status analytics
CREATE OR REPLACE VIEW photo_backup_analytics AS
SELECT 
  -- Basic counts
  COUNT(*) as total_photos,
  COUNT(CASE WHEN google_drive_backup_url IS NOT NULL THEN 1 END) as photos_with_backup,
  COUNT(CASE WHEN is_archived = true THEN 1 END) as archived_photos,
  
  -- Size analytics
  SUM(file_size) as total_compressed_size,
  SUM(original_file_size) as total_original_size,
  
  -- Backup status by album
  album_name,
  COUNT(CASE WHEN google_drive_backup_url IS NOT NULL THEN 1 END) as backup_count_by_album,
  
  -- Date ranges
  MIN(uploaded_at) as first_upload,
  MAX(uploaded_at) as last_upload
FROM photos 
GROUP BY album_name
ORDER BY backup_count_by_album DESC;

-- Grant permissions for analytics view
GRANT SELECT ON photo_backup_analytics TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES - Check results after migration
-- ============================================================================

-- Check if columns were added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('google_drive_backup_url', 'original_file_size', 'is_archived', 'archived_at')
ORDER BY column_name;

-- Check current backup status
SELECT 
  'PHASE 3 MIGRATION RESULTS' as status,
  COUNT(*) as total_photos,
  COUNT(CASE WHEN google_drive_backup_url IS NOT NULL THEN 1 END) as with_backup_url,
  COUNT(CASE WHEN original_file_size IS NOT NULL THEN 1 END) as with_original_size,
  COUNT(CASE WHEN is_archived = true THEN 1 END) as archived_count,
  
  -- Size comparison
  ROUND(AVG(file_size)::numeric, 0) as avg_compressed_size,
  ROUND(AVG(original_file_size)::numeric, 0) as avg_original_size,
  
  -- Backup percentage
  ROUND(
    (COUNT(CASE WHEN google_drive_backup_url IS NOT NULL THEN 1 END)::float / COUNT(*) * 100), 2
  ) as backup_percentage
FROM photos;

-- Show recent photos for testing
SELECT 
  id,
  original_name,
  album_name,
  file_size,
  original_file_size,
  google_drive_backup_url IS NOT NULL as has_backup,
  is_archived,
  uploaded_at
FROM photos 
ORDER BY uploaded_at DESC 
LIMIT 10;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '🎉 PHASE 3 DATABASE MIGRATION COMPLETED SUCCESSFULLY!' as result;