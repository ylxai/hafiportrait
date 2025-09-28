-- Add original storage support to photos table
-- HafiPortrait Photography - Dual Storage System

-- Add new columns for original storage tracking
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS original_url TEXT,
ADD COLUMN IF NOT EXISTS original_file_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS original_size BIGINT,
ADD COLUMN IF NOT EXISTS web_url TEXT,
ADD COLUMN IF NOT EXISTS is_original_available BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_original_available ON photos(is_original_available);
CREATE INDEX IF NOT EXISTS idx_photos_original_file_id ON photos(original_file_id);

-- Add comments for documentation
COMMENT ON COLUMN photos.original_url IS 'Google Drive URL for 100% original quality';
COMMENT ON COLUMN photos.original_file_id IS 'Google Drive file ID for original download';
COMMENT ON COLUMN photos.original_size IS 'Original file size in bytes (before compression)';
COMMENT ON COLUMN photos.web_url IS 'Cloudflare R2 URL for web-optimized version';
COMMENT ON COLUMN photos.is_original_available IS 'True if 100% original is available for download';

-- Update existing photos based on storage_file_id
UPDATE photos 
SET is_original_available = (storage_file_id IS NOT NULL),
    original_file_id = storage_file_id,
    web_url = url
WHERE storage_file_id IS NOT NULL;

-- Show current state after update
SELECT 
  'AFTER SCHEMA UPDATE' as status,
  COUNT(*) as total_photos,
  COUNT(CASE WHEN is_original_available = true THEN 1 END) as with_original,
  COUNT(CASE WHEN original_file_id IS NOT NULL THEN 1 END) as with_original_id,
  COUNT(CASE WHEN web_url IS NOT NULL THEN 1 END) as with_web_url
FROM photos;