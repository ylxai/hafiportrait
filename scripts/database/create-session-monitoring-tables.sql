-- Session Monitoring Database Schema
-- Create tables for session analytics and monitoring

-- Session Events Table
CREATE TABLE IF NOT EXISTS session_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('login', 'logout', 'auth_check', 'auth_failure', 'timeout')),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_events_timestamp ON session_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_event_type ON session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_session_events_user_id ON session_events(user_id);
CREATE INDEX IF NOT EXISTS idx_session_events_ip_address ON session_events(ip_address);

-- Session Health Metrics View
CREATE OR REPLACE VIEW session_health_metrics AS
SELECT 
    COUNT(DISTINCT s.session_id) as active_sessions_24h,
    COUNT(CASE WHEN e.event_type = 'login' THEN 1 END) as login_events_7d,
    COUNT(CASE WHEN e.event_type = 'auth_failure' THEN 1 END) as failure_events_7d,
    COUNT(CASE WHEN e.event_type = 'auth_check' THEN 1 END) as auth_checks_7d,
    AVG(EXTRACT(EPOCH FROM (s.last_activity - s.created_at)) * 1000) as avg_session_duration_ms,
    MAX(e.timestamp) as last_activity
FROM admin_sessions s
LEFT JOIN session_events e ON e.timestamp >= NOW() - INTERVAL '7 days'
WHERE s.created_at >= NOW() - INTERVAL '24 hours'
  AND s.deleted_at IS NULL;

-- Function to cleanup old session events (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_session_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_events 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-session-events', '0 2 * * *', 'SELECT cleanup_old_session_events();');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON session_events TO authenticated;
GRANT SELECT ON session_health_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_session_events() TO authenticated;

-- Insert sample data for testing
INSERT INTO session_events (session_id, user_id, event_type, ip_address, user_agent, metadata) VALUES
('sample-session-1', 1, 'login', '147.251.255.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"login_method": "password"}'),
('sample-session-1', 1, 'auth_check', '147.251.255.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"check_type": "periodic"}'),
('sample-session-2', 1, 'login', '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', '{"login_method": "password"}');

COMMENT ON TABLE session_events IS 'Tracks all session-related events for monitoring and analytics';
COMMENT ON VIEW session_health_metrics IS 'Aggregated session health metrics for monitoring dashboard';