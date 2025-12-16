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
  eventId: string
  guestToken: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
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
  eventId: string,
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
  await prisma.guestSession.create({
    data: {
      sessionId: hashSessionId(sessionId),
      eventId,
      guestToken,
      ipAddress,
      userAgent,
      expiresAt,
      lastAccessAt: new Date(),
    }
  })

  return { sessionId, guestToken }
}

/**
 * Validate gallery session
 */
export async function validateGallerySession(
  sessionId: string,
  eventId: string
): Promise<{ valid: boolean; guestToken?: string; session?: GallerySession }> {
  try {
    const hashedSessionId = hashSessionId(sessionId)
    
    const session = await prisma.guestSession.findFirst({
      where: {
        sessionId: hashedSessionId,
        eventId,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!session) {
      return { valid: false }
    }

    // Update last access time
    await prisma.guestSession.update({
      where: { id: session.id },
      data: { lastAccessAt: new Date() }
    })

    return {
      valid: true,
      guestToken: session.guestToken,
      session: session as GallerySession
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
  
  await prisma.guestSession.delete({
    where: { sessionId: hashedSessionId }
  }).catch(() => {
    // Session mungkin sudah tidak ada
  })
}

/**
 * Invalidate all sessions untuk event (event archived)
 */
export async function invalidateEventSessions(eventId: string): Promise<number> {
  const result = await prisma.guestSession.deleteMany({
    where: { eventId }
  })
  
  return result.count
}

/**
 * Get active sessions untuk event (monitoring)
 */
export async function getActiveEventSessions(eventId: string): Promise<number> {
  const count = await prisma.guestSession.count({
    where: {
      eventId,
      expiresAt: {
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
  const result = await prisma.guestSession.deleteMany({
    where: {
      expiresAt: {
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

    await prisma.guestSession.update({
      where: { sessionId: hashedSessionId },
      data: { 
        expiresAt: newExpiresAt,
        lastAccessAt: new Date()
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
export async function getSessionStatistics(eventId: string): Promise<{
  total: number
  active: number
  expired: number
  lastAccess?: Date
}> {
  const now = new Date()
  
  const [total, active, lastSession] = await Promise.all([
    prisma.guestSession.count({ where: { eventId } }),
    prisma.guestSession.count({
      where: {
        eventId,
        expiresAt: { gt: now }
      }
    }),
    prisma.guestSession.findFirst({
      where: { eventId },
      orderBy: { lastAccessAt: 'desc' },
      select: { lastAccessAt: true }
    })
  ])

  return {
    total,
    active,
    expired: total - active,
    lastAccess: lastSession?.lastAccessAt
  }
}
