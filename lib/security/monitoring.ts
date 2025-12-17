/**
 * Security Monitoring & Logging
 * Track security events untuk incident response
 */

import prisma from '@/lib/prisma'

export type SecurityEventType =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'CSRF_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_SESSION'
  | 'UNAUTHORIZED_ACCESS'
  | 'FILE_UPLOAD'
  | 'SUSPICIOUS_ACTIVITY'

export interface SecurityEvent {
  type: SecurityEventType
  user_id?: string
  ipAddress?: string
  userAgent?: string
  details?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Log security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const timestamp = new Date().toISOString()
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
  }

  // In production, you would:
  // 1. Store in database (create SecurityLog model)
  // 2. Send to monitoring service (Sentry, DataDog, etc.)
  // 3. Alert on critical events
  
  // For now, just log critical events
  if (event.severity === 'critical') {
    console.error('[SECURITY ALERT]', {
      timestamp,
      type: event.type,
      user_id: event.user_id,
      ip: event.ipAddress,
      details: event.details,
    })
  }
}

/**
 * Track failed login attempts
 */
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function trackFailedLogin(identifier: string): boolean {
  const now = Date.now()
  const attempts = failedLoginAttempts.get(identifier)

  if (!attempts || now - attempts.lastAttempt > 15 * 60 * 1000) {
    // Reset after 15 minutes
    failedLoginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return false
  }

  attempts.count++
  attempts.lastAttempt = now

  // Block after 5 failed attempts
  if (attempts.count >= 5) {
    logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      ipAddress: identifier,
      severity: 'high',
      details: { failedAttempts: attempts.count },
    })
    return true
  }

  return false
}

/**
 * Clear failed login attempts (after successful login)
 */
export function clearFailedLogin(identifier: string): void {
  failedLoginAttempts.delete(identifier)
}

/**
 * Get security statistics
 */
export async function getSecurityStats(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<{
  totalEvents: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
}> {
  // This would query SecurityLog model in production
  return {
    totalEvents: 0,
    byType: {},
    bySeverity: {},
  }
}
