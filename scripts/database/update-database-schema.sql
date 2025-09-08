-- Update database schema to support Smart Storage Manager metadata
-- Run this script in your Supabase SQL editor

-- Add Smart Storage columns to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS storage_tier VARCHAR(50),
ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS compression_used VARCHAR(50),
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS storage_etag VARCHAR(255),
ADD COLUMN IF NOT EXISTS storage_file_id VARCHAR(255);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_storage_tier ON photos(storage_tier);
CREATE INDEX IF NOT EXISTS idx_photos_storage_provider ON photos(storage_provider);
CREATE INDEX IF NOT EXISTS idx_photos_file_size ON photos(file_size);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at);

-- Add comments for documentation
COMMENT ON COLUMN photos.storage_tier IS 'Smart Storage tier: cloudflareR2, googleDrive, local';
COMMENT ON COLUMN photos.storage_provider IS 'Actual storage provider used';
COMMENT ON COLUMN photos.compression_used IS 'Compression level applied: premium, standard, thumbnail';
COMMENT ON COLUMN photos.file_size IS 'Final file size in bytes after compression';
COMMENT ON COLUMN photos.storage_path IS 'Full path in storage system';
COMMENT ON COLUMN photos.storage_etag IS 'ETag for Cloudflare R2 or similar';
COMMENT ON COLUMN photos.storage_file_id IS 'File ID for Google Drive or similar';

-- Create view for Smart Storage analytics
CREATE OR REPLACE VIEW smart_storage_analytics AS
SELECT 
  storage_tier,
  storage_provider,
  compression_used,
  album_name,
  COUNT(*) as photo_count,
  SUM(file_size) as total_size,
  AVG(file_size) as avg_size,
  MIN(uploaded_at) as first_upload,
  MAX(uploaded_at) as last_upload
FROM photos 
WHERE storage_tier IS NOT NULL
GROUP BY storage_tier, storage_provider, compression_used, album_name
ORDER BY photo_count DESC;

-- Create function to get storage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE(
  tier VARCHAR(50),
  provider VARCHAR(50),
  total_photos BIGINT,
  total_size BIGINT,
  avg_size NUMERIC,
  compression_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.storage_tier as tier,
    p.storage_provider as provider,
    COUNT(*) as total_photos,
    SUM(p.file_size) as total_size,
    AVG(p.file_size) as avg_size,
    jsonb_object_agg(p.compression_used, COUNT(*)) as compression_breakdown
  FROM photos p
  WHERE p.storage_tier IS NOT NULL
  GROUP BY p.storage_tier, p.storage_provider
  ORDER BY total_photos DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON smart_storage_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_stats() TO authenticated;

-- Insert sample data for testing (optional)
-- UPDATE photos SET 
--   storage_tier = 'cloudflareR2',
--   storage_provider = 'cloudflare-r2',
--   compression_used = 'standard',
--   file_size = 1024000
-- WHERE storage_tier IS NULL 
-- LIMIT 5;