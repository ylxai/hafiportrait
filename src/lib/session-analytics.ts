/**
 * Session Analytics & Monitoring System
 * Tracks session health, duration, and user activity
 */

import { supabase } from './supabase';

export interface SessionMetrics {
  totalActiveSessions: number;
  averageSessionDuration: number;
  loginSuccessRate: number;
  authFailureRate: number;
  sessionsByTimeOfDay: Record<string, number>;
  deviceTypes: Record<string, number>;
  ipAddresses: string[];
  lastActivity: Date;
}

export interface SessionEvent {
  id?: string;
  session_id: string;
  user_id: number;
  event_type: 'login' | 'logout' | 'auth_check' | 'auth_failure' | 'timeout';
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class SessionAnalytics {
  
  /**
   * Log session event untuk tracking
   */
  static async logSessionEvent(event: Omit<SessionEvent, 'id' | 'timestamp'>) {
    // Skip session logging in development or if disabled
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_SESSION_LOGGING === 'true') {
      return;
    }

    try {
      // Check if supabase is properly configured
      if (!supabase) {
        console.warn('Supabase not configured, skipping session event logging');
        return;
      }

      const { error } = await supabase
        .from('session_events')
        .insert({
          ...event,
          timestamp: new Date().toISOString(),
        });

      if (error) {
        // Only log error in development, silently fail in production
        if (process.env.NODE_ENV === 'development') {
          console.warn('Session event logging failed (table may not exist):', error.message);
        }
      }
    } catch (error) {
      // Only log error in development, silently fail in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('Session event logging error:', error);
      }
    }
  }

  /**
   * Get current session metrics
   */
  static async getSessionMetrics(): Promise<SessionMetrics> {
    try {
      // Get active sessions (last 24 hours)
      const { data: activeSessions, error: activeError } = await supabase
        .from('admin_sessions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .is('deleted_at', null);

      if (activeError) throw activeError;

      // Get session events for analytics
      const { data: events, error: eventsError } = await supabase
        .from('session_events')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (eventsError) throw eventsError;

      // Calculate metrics
      const totalActiveSessions = activeSessions?.length || 0;
      
      const loginEvents = events?.filter(e => e.event_type === 'login') || [];
      const failureEvents = events?.filter(e => e.event_type === 'auth_failure') || [];
      
      const loginSuccessRate = loginEvents.length > 0 
        ? (loginEvents.length / (loginEvents.length + failureEvents.length)) * 100 
        : 100;

      const authFailureRate = 100 - loginSuccessRate;

      // Session duration calculation
      const sessionDurations = activeSessions?.map(session => {
        const created = new Date(session.created_at);
        const lastActivity = new Date(session.last_activity || session.created_at);
        return lastActivity.getTime() - created.getTime();
      }) || [];

      const averageSessionDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

      // Sessions by time of day
      const sessionsByTimeOfDay: Record<string, number> = {};
      loginEvents.forEach(event => {
        const hour = new Date(event.timestamp).getHours();
        const timeSlot = `${hour}:00`;
        sessionsByTimeOfDay[timeSlot] = (sessionsByTimeOfDay[timeSlot] || 0) + 1;
      });

      // Device types from user agent
      const deviceTypes: Record<string, number> = {};
      events?.forEach(event => {
        const userAgent = event.user_agent || '';
        let deviceType = 'Unknown';
        
        if (userAgent.includes('Mobile')) deviceType = 'Mobile';
        else if (userAgent.includes('Tablet')) deviceType = 'Tablet';
        else if (userAgent.includes('Desktop') || userAgent.includes('Windows') || userAgent.includes('Mac')) deviceType = 'Desktop';
        
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
      });

      // Unique IP addresses
      const ipAddresses = [...new Set(events?.map(e => e.ip_address) || [])];

      // Last activity
      const lastActivity = events?.[0]?.timestamp ? new Date(events[0].timestamp) : new Date();

      return {
        totalActiveSessions,
        averageSessionDuration,
        loginSuccessRate,
        authFailureRate,
        sessionsByTimeOfDay,
        deviceTypes,
        ipAddresses,
        lastActivity
      };

    } catch (error) {
      console.error('Failed to get session metrics:', error);
      return {
        totalActiveSessions: 0,
        averageSessionDuration: 0,
        loginSuccessRate: 0,
        authFailureRate: 0,
        sessionsByTimeOfDay: {},
        deviceTypes: {},
        ipAddresses: [],
        lastActivity: new Date()
      };
    }
  }

  /**
   * Get session health status
   */
  static async getSessionHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: SessionMetrics;
  }> {
    const metrics = await this.getSessionMetrics();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check for issues
    if (metrics.authFailureRate > 20) {
      issues.push(`High auth failure rate: ${metrics.authFailureRate.toFixed(1)}%`);
      status = 'warning';
    }

    if (metrics.authFailureRate > 50) {
      status = 'critical';
    }

    if (metrics.totalActiveSessions === 0) {
      issues.push('No active sessions detected');
      status = 'warning';
    }

    const timeSinceLastActivity = Date.now() - metrics.lastActivity.getTime();
    if (timeSinceLastActivity > 60 * 60 * 1000) { // 1 hour
      issues.push('No recent activity detected');
      status = 'warning';
    }

    return {
      status,
      issues,
      metrics
    };
  }

  /**
   * Clean up old session events (older than 30 days)
   */
  static async cleanupOldEvents() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('session_events')
        .delete()
        .lt('timestamp', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Failed to cleanup old session events:', error);
      } else {
        console.log('Old session events cleaned up successfully');
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}