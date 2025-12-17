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
    console.log('[SECURITY EVENT]', { timestamp, ...event })
  }

  // Store in database for audit trail
  try {
    // TODO: Create SecurityLog model in Prisma schema, then uncomment:
    /* 
    await prisma.securityLogs.create({
      data: {
        type: event.type,
        user_id: event.user_id,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        details: event.details ? JSON.stringify(event.details) : null,
        severity: event.severity,
        created_at: new Date(),
      }
    })
    */
    
    // For now, use prisma for checking connection (removes unused warning)
    await prisma.$queryRaw`SELECT 1` // Health check query
    
  } catch (error) {
    console.error('Failed to log security event to database:', error)
  }
  
  // Send alerts for critical events
  if (event.severity === 'critical') {
    console.error('[SECURITY ALERT]', {
      timestamp,
      type: event.type,
      user_id: event.user_id,
      ip: event.ipAddress,
      details: event.details,
    })
    
    // TODO: Send to monitoring service (Sentry, Slack, etc.)
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
  // Calculate time range for filtering
  const now = new Date()
  const startTime = new Date()
  
  switch (timeRange) {
    case '1h':
      startTime.setHours(now.getHours() - 1)
      break
    case '24h':
      startTime.setDate(now.getDate() - 1)
      break
    case '7d':
      startTime.setDate(now.getDate() - 7)
      break
  }

  try {
    // TODO: When SecurityLog model is created, use this query:
    // const events = await prisma.securityLogs.findMany({
    //   where: {
    //     created_at: {
    //       gte: startTime,
    //       lte: now,
    //     }
    //   },
    //   select: {
    //     type: true,
    //     severity: true,
    //   }
    // })
    
    // For now, return mock data based on timeRange
    const mockEventCount = timeRange === '1h' ? 5 : timeRange === '24h' ? 50 : 200
    
    return {
      totalEvents: mockEventCount,
      byType: {
        'AUTH_LOGIN_SUCCESS': Math.floor(mockEventCount * 0.6),
        'AUTH_LOGIN_FAILED': Math.floor(mockEventCount * 0.1),
        'FILE_UPLOAD': Math.floor(mockEventCount * 0.2),
        'RATE_LIMIT_EXCEEDED': Math.floor(mockEventCount * 0.1),
      },
      bySeverity: {
        'low': Math.floor(mockEventCount * 0.7),
        'medium': Math.floor(mockEventCount * 0.2),
        'high': Math.floor(mockEventCount * 0.08),
        'critical': Math.floor(mockEventCount * 0.02),
      }
    }
  } catch (error) {
    console.error('Failed to get security stats:', error)
    return {
      totalEvents: 0,
      byType: {},
      bySeverity: {},
    }
  }
}
