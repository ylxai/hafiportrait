/**
 * Secure Gallery Session Management
 * Priority: HIGH (CVSS 6.8)
 * 
 * Replace weak gallery session IDs dengan cryptographically secure tokens
 * untuk guest access control pada photography events
 */

import { randomBytes, createHash } from 'crypto'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Gallery session configuration
export const GALLERY_SESSION_CONFIG = {
  defaultExpiryHours: 24 * 7, // 7 days default
  maxExpiryHours: 24 * 30, // 30 days maximum
  tokenLength: 64,
  cleanupIntervalHours: 6,
} as const

export interface GallerySession {
  id: string
  sessionId: string
  event_id: string
  guestToken: string
  ipAddress?: string
  userAgent?: string
  created_at: Date
  expiresAt: Date
  lastAccessAt: Date
}

/**
 * Generate cryptographically secure gallery session token
 */
export function generateSecureToken(): string {
  return randomBytes(GALLERY_SESSION_CONFIG.tokenLength).toString('hex')
}

/**
 * Generate guest token (untuk identify guest dalam event)
 */
export function generateGuestToken(): string {
  const random = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString(36)
  return `guest_${timestamp}_${random}`
}

/**
 * Hash session ID untuk storage
 */
export function hashSessionId(sessionId: string): string {
  return createHash('sha256').update(sessionId).digest('hex')
}

/**
 * Create new gallery session untuk event access
 */
export async function createGallerySession(
  event_id: string,
  request?: NextRequest,
  expiryHours?: number
): Promise<{ sessionId: string; guestToken: string }> {
  const sessionId = generateSecureToken()
  const guestToken = generateGuestToken()

  // Calculate expiry time
  const expiry = expiryHours || GALLERY_SESSION_CONFIG.defaultExpiryHours
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + Math.min(expiry, GALLERY_SESSION_CONFIG.maxExpiryHours))

  // Extract request metadata
  const ipAddress = request?.headers.get('x-forwarded-for') ||
    request?.headers.get('x-real-ip') ||
    'unknown'
  const userAgent = request?.headers.get('user-agent') || 'unknown'

  // Store session di database
  await prisma.guest_sessions.create({
    data: {
      id: crypto.randomUUID(),
      session_id: hashSessionId(sessionId),
      event_id,
      guest_token: guestToken,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      expires_at: expiresAt,
      last_access_at: new Date(),
    }
  })

  return { sessionId, guestToken }
}

/**
 * Validate gallery session
 */
export async function validateGallerySession(
  sessionId: string,
  event_id: string
): Promise<{ valid: boolean; guestToken?: string; session?: GallerySession }> {
  try {
    const hashedSessionId = hashSessionId(sessionId)

    const session = await prisma.guest_sessions.findFirst({
      where: {
        session_id: hashedSessionId,
        event_id,
        expires_at: {
          gt: new Date()
        }
      }
    })

    if (!session) {
      return { valid: false }
    }

    // Update last access time
    await prisma.guest_sessions.update({
      where: { id: session.id },
      data: { last_access_at: new Date() }
    })

    return {
      valid: true,
      guestToken: session.guest_token, // Keep guestToken as camelCase for return type
      session: {
        ...session,
        sessionId: session.session_id,
        guestToken: session.guest_token,
        ipAddress: session.ip_address || undefined,
        userAgent: session.user_agent || undefined,
        expiresAt: session.expires_at,
        lastAccessAt: session.last_access_at,
      } as GallerySession // Cast to original interface
    }
  } catch (error) {
    console.error('Gallery session validation error:', error)
    return { valid: false }
  }
}

/**
 * Invalidate gallery session (manual logout)
 */
export async function invalidateGallerySession(sessionId: string): Promise<void> {
  const hashedSessionId = hashSessionId(sessionId)

  await prisma.guest_sessions.delete({
    where: { session_id: hashedSessionId }
  }).catch(() => {
    // Session mungkin sudah tidak ada
  })
}

/**
 * Invalidate all sessions untuk event (event archived)
 */
export async function invalidateEventSessions(event_id: string): Promise<number> {
  const result = await prisma.guest_sessions.deleteMany({
    where: { event_id }
  })

  return result.count
}

/**
 * Get active sessions untuk event (monitoring)
 */
export async function getActiveEventSessions(event_id: string): Promise<number> {
  const count = await prisma.guest_sessions.count({
    where: {
      event_id,
      expires_at: {
        gt: new Date()
      }
    }
  })

  return count
}

/**
 * Cleanup expired gallery sessions
 */
export async function cleanupExpiredGallerySessions(): Promise<number> {
  const result = await prisma.guest_sessions.deleteMany({
    where: {
      expires_at: {
        lt: new Date()
      }
    }
  })

  return result.count
}

/**
 * Extend session expiry (untuk active users)
 */
export async function extendGallerySession(
  sessionId: string,
  additionalHours: number = GALLERY_SESSION_CONFIG.defaultExpiryHours
): Promise<boolean> {
  try {
    const hashedSessionId = hashSessionId(sessionId)
    const newExpiresAt = new Date()
    newExpiresAt.setHours(newExpiresAt.getHours() + additionalHours)

    await prisma.guest_sessions.update({
      where: { session_id: hashedSessionId },
      data: {
        expires_at: newExpiresAt,
        last_access_at: new Date()
      }
    })

    return true
  } catch (error) {
    return false
  }
}

/**
 * Extract gallery session dari request cookies
 */
export function extractGallerySession(
  request: NextRequest,
  eventSlug: string
): string | null {
  return request.cookies.get(`gallery-session-${eventSlug}`)?.value || null
}

/**
 * Get session statistics untuk monitoring
 */
export async function getSessionStatistics(event_id: string): Promise<{
  total: number
  active: number
  expired: number
  lastAccess?: Date
}> {
  const now = new Date()

  const [total, active] = await Promise.all([
    prisma.guest_sessions.count({ where: { event_id } }),
    prisma.guest_sessions.count({
      where: {
        event_id,
        expires_at: { gt: now }
      }
    }),
    prisma.guest_sessions.findFirst({
      where: { event_id },
      orderBy: { last_access_at: 'desc' },
      select: { last_access_at: true }
    })
  ])

  return {
    total,
    active,
    expired: total - active,
  }
}
