/**
 * Socket.IO Authentication & Authorization
 * Priority: MEDIUM-HIGH (CVSS 5.8)
 * 
 * SECURITY FIX: Proper JWT type inheritance and socket validation
 * - Fixed JWTPayload import to use custom type from @/lib/auth
 * - Implemented proper socket JWT verification with type safety
 * - Enhanced WebSocket authentication validation
 * - Room-based authorization per event access
 * - Connection rate limiting
 * - Real-time photo likes/comments security
 */

import { verifyJWT, type JWTPayload } from '@/lib/auth'
import { validateGallerySession } from './gallery-session'

export interface SocketAuthPayload {
  user_id?: string
  role?: string
  guestToken?: string
  event_id?: string
  sessionType: 'authenticated' | 'guest' | 'admin'
}

/**
 * Verify Socket.IO authentication token
 * SECURITY FIX: Enhanced JWT verification with proper error handling
 */
export async function verifySocketAuth(
  token?: string,
  guestSessionId?: string,
  event_id?: string
): Promise<{ valid: boolean; payload?: SocketAuthPayload; error?: string }> {
  // Check JWT token untuk authenticated users (admin/client)
  if (token) {
    try {
      const jwtPayload: JWTPayload | null = await verifyJWT(token)
      
      if (jwtPayload) {
        // Validate required JWT fields
        if (!jwtPayload.user_id || !jwtPayload.role) {
          return {
            valid: false,
            error: 'Invalid JWT payload: missing required fields'
          }
        }

        return {
          valid: true,
          payload: {
            user_id: jwtPayload.user_id,
            role: jwtPayload.role,
            sessionType: jwtPayload.role === 'ADMIN' ? 'admin' : 'authenticated',
          },
        }
      }
    } catch (error) {
      console.error('Socket JWT verification failed:', error)
      return {
        valid: false,
        error: 'JWT verification failed'
      }
    }
  }

  // Check guest session untuk gallery access
  if (guestSessionId && event_id) {
    try {
      const sessionValidation = await validateGallerySession(guestSessionId, event_id)
      
      if (sessionValidation.valid) {
        return {
          valid: true,
          payload: {
            guestToken: sessionValidation.guestToken,
            event_id,
            sessionType: 'guest',
          },
        }
      } else {
        return {
          valid: false,
          error: 'Guest session validation failed'
        }
      }
    } catch (error) {
      console.error('Socket guest session verification failed:', error)
      return {
        valid: false,
        error: 'Guest session verification error'
      }
    }
  }

  return { 
    valid: false,
    error: 'No valid authentication credentials provided'
  }
}

/**
 * Check authorization untuk event room access
 */
export function canAccessEventRoom(
  auth: SocketAuthPayload,
  event_id: string
): boolean {
  // Admin dapat access semua events
  if (auth.sessionType === 'admin') {
    return true
  }

  // Authenticated users (photographers) dapat access events mereka
  if (auth.sessionType === 'authenticated' && auth.user_id) {
    // TODO: Verify user owns the event (check di database)
    return true
  }

  // Guest hanya dapat access event yang sesuai session mereka
  if (auth.sessionType === 'guest') {
    return auth.event_id === event_id
  }

  return false
}

/**
 * Check authorization untuk photo interactions (like, comment)
 */
export function canInteractWithPhoto(
  auth: SocketAuthPayload,
  event_id: string
): boolean {
  // All authenticated users dapat interact
  if (auth.sessionType === 'authenticated' || auth.sessionType === 'admin') {
    return true
  }

  // Guest dapat interact jika di event yang benar
  if (auth.sessionType === 'guest' && auth.event_id === event_id) {
    return true
  }

  return false
}

/**
 * Check authorization untuk admin operations
 */
export function canPerformAdminAction(auth: SocketAuthPayload): boolean {
  return auth.sessionType === 'admin'
}

/**
 * Get socket rate limit key
 */
export function getSocketRateLimitKey(
  socketId: string,
  auth: SocketAuthPayload
): string {
  if (auth.user_id) {
    return `socket:user:${auth.user_id}`
  }
  if (auth.guestToken) {
    return `socket:guest:${auth.guestToken}`
  }
  return `socket:${socketId}`
}

/**
 * Socket event permissions
 */
export const SOCKET_PERMISSIONS = {
  // Public events (require basic authentication)
  'event:join': ['admin', 'authenticated', 'guest'],
  'event:leave': ['admin', 'authenticated', 'guest'],
  
  // Photo interactions (require event access)
  'photo:like': ['admin', 'authenticated', 'guest'],
  'photo:comment': ['admin', 'authenticated', 'guest'],
  
  // Upload events (admin/photographer only)
  'photo:upload:progress': ['admin', 'authenticated'],
  'photo:upload:complete': ['admin', 'authenticated'],
  
  // Admin events
  'admin:join': ['admin'],
  'admin:notification': ['admin'],
  'event:update': ['admin', 'authenticated'],
} as const

export type SocketEvent = keyof typeof SOCKET_PERMISSIONS

/**
 * Check if auth payload has permission untuk socket event
 */
export function hasSocketPermission(
  auth: SocketAuthPayload,
  event: SocketEvent
): boolean {
  const allowedTypes = SOCKET_PERMISSIONS[event]
  return allowedTypes.includes(auth.sessionType as any)
}

/**
 * Sanitize socket data to prevent XSS
 */
export function sanitizeSocketData(data: any): any {
  if (typeof data === 'string') {
    return data.replace(/[<>]/g, '')
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeSocketData)
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeSocketData(value)
    }
    return sanitized
  }
  
  return data
}

/**
 * Rate limit configuration untuk socket events
 */
export const SOCKET_RATE_LIMITS = {
  'photo:like': { windowMs: 1000, maxEvents: 10 }, // 10 likes per second
  'photo:comment': { windowMs: 5000, maxEvents: 3 }, // 3 comments per 5 seconds
  'event:join': { windowMs: 10000, maxEvents: 5 }, // 5 joins per 10 seconds
} as const

/**
 * Create socket authentication middleware configuration
 * SECURITY FIX: Enhanced error handling and validation
 */
export function createSocketAuthMiddleware() {
  return async (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.replace('Bearer ', '')
      const guestSessionId = socket.handshake.auth.guestSessionId
      const event_id = socket.handshake.auth.event_id

      const { valid, payload, error } = await verifySocketAuth(token, guestSessionId, event_id)

      if (!valid) {
        return next(new Error(error || 'Authentication failed'))
      }

      // Attach auth payload to socket
      socket.auth = payload
      socket.user_id = payload?.user_id
      socket.guestToken = payload?.guestToken
      socket.sessionType = payload?.sessionType

      next()
    } catch (error) {
      console.error('Socket authentication middleware error:', error)
      next(new Error('Authentication error'))
    }
  }
}
