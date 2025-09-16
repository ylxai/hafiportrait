-- Migration: Optimize Homepage Performance  
-- Created: 2025-09-13
-- Purpose: Add indexes and optimizations for faster homepage loading

-- 1. Add composite index for homepage photos query
-- This will speed up: SELECT * FROM photos WHERE is_homepage = true ORDER BY uploaded_at DESC LIMIT 20
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_homepage_uploaded 
ON photos (is_homepage, uploaded_at DESC) 
WHERE is_homepage = true;

-- 2. Add index for events date ordering  
-- This will speed up: SELECT * FROM events ORDER BY date DESC LIMIT 6
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_desc 
ON events (date DESC);

-- 3. Add index for events homepage query optimization
-- This will speed up filtered events queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_status
ON events (date DESC, status) 
WHERE status IN ('active', 'live', 'upcoming');

-- 4. Add index for photo optimization status
-- This helps identify photos that need optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_optimized
ON photos (id) 
WHERE optimized_images IS NOT NULL;

-- 5. Add index for messages performance (if needed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_event_created
ON messages (event_id, created_at DESC);

-- 6. Update table statistics for better query planning
ANALYZE photos;
ANALYZE events;
ANALYZE messages;

-- 7. Comments for documentation
COMMENT ON INDEX idx_photos_homepage_uploaded IS 'Optimizes homepage photos query: WHERE is_homepage = true ORDER BY uploaded_at DESC';
COMMENT ON INDEX idx_events_date_desc IS 'Optimizes events listing: ORDER BY date DESC';  
COMMENT ON INDEX idx_events_date_status IS 'Optimizes homepage events query with status filter';
COMMENT ON INDEX idx_photos_optimized IS 'Helps identify photos with optimization data';
COMMENT ON INDEX idx_messages_event_created IS 'Optimizes event messages queries';

-- Performance monitoring query (for future use)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE indexname LIKE 'idx_%homepage%' OR indexname LIKE 'idx_%photos%' OR indexname LIKE 'idx_%events%';