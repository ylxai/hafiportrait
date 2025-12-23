/**
 * Advanced Rate Limiting Implementation
 * Priority: MEDIUM (CVSS 5.5)
 *
 * Tiered rate limiting dengan burst protection untuk photography platform:
 * - Different limits untuk different endpoints
 * - IP-based rate limiting dengan Redis
 * - Burst protection untuk file uploads
 * - Admin exemptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'
import { verifyJWT } from '@/lib/auth'

// Rate limit tiers
export const RATE_LIMITS = {
  // Public endpoints
  PUBLIC_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Authentication endpoints
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 15 * 60 * 1000, // Block 15 minutes after exceeded
  },

  // Photo upload (burst protection)
  PHOTO_UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Max 10 uploads per minute
    burstMax: 3, // Max 3 concurrent uploads
  },

  // Gallery access
  GALLERY_ACCESS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Photo like/comment
  PHOTO_INTERACTION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },

  // Admin endpoints (more permissive)
  ADMIN_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,
  },
} as const

export type RateLimitTier = keyof typeof RATE_LIMITS

// Redis client for rate limiting
let redisClient: ReturnType<typeof createClient> | null = null

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redisClient = createClient({ url: redisUrl })

    redisClient.on('error', (err) => {
      console.error('Redis rate limit client error:', err)
    })

    await redisClient.connect().catch((err) => {
      console.error('Failed to connect rate limit Redis:', err)
      redisClient = null
    })
  }

  return redisClient
}

/**
 * Get client identifier dari request (IP address + optional user ID)
 */
export function getClientIdentifier(
  request: NextRequest,
  user_id?: string
): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  return user_id ? `${ip}:${user_id}` : ip
}

/**
 * Check if user is admin (exempt from strict rate limits)
 * SECURITY FIX: Proper async JWT validation
 */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  // Check for admin role di JWT token
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return false
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token)
    
    return payload?.role === 'ADMIN'
  } catch (error) {
    console.warn('Error checking admin request:', error)
    return false
  }
}

/**
 * Rate limit implementation dengan Redis
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}> {
  const redis = await getRedisClient()
  const config = RATE_LIMITS[tier]
  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `ratelimit:${tier}:${identifier}`

  // Fallback jika Redis tidak available (allow request tapi log warning)
  if (!redis) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    }
  }

  try {
    // Sliding window rate limiting
    const pipeline = redis.multi()

    // Remove old entries
    pipeline.zRemRangeByScore(key, 0, windowStart)

    // Count current requests
    pipeline.zCard(key)

    // Add current request
    pipeline.zAdd(key, { score: now, value: `${now}` })

    // Set expiry
    pipeline.expire(key, Math.ceil(config.windowMs / 1000))

    const results = await pipeline.exec()
    const currentCount = (results[1] as number) || 0

    const allowed = currentCount < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - currentCount - 1)
    const resetAt = now + config.windowMs

    // Check for blocking (untuk auth endpoints)
    if (!allowed && 'blockDurationMs' in config) {
      const blockKey = `ratelimit:block:${tier}:${identifier}`
      const blockUntil = now + config.blockDurationMs
      await redis.set(blockKey, blockUntil.toString(), {
        PX: config.blockDurationMs,
      })

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil(config.blockDurationMs / 1000),
      }
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil((resetAt - now) / 1000),
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    }
  }
}

/**
 * Check if identifier is blocked
 */
export async function isBlocked(
  identifier: string,
  tier: RateLimitTier
): Promise<boolean> {
  const redis = await getRedisClient()
  if (!redis) return false

  const blockKey = `ratelimit:block:${tier}:${identifier}`
  const blockUntil = await redis.get(blockKey)

  if (!blockUntil) return false

  return parseInt(blockUntil) > Date.now()
}

/**
 * Rate limit middleware untuk API routes
 */
export async function withRateLimit(
  request: NextRequest,
  tier: RateLimitTier,
  user_id?: string
): Promise<{ allowed: boolean; response?: NextResponse }> {
  // Admin exemption
  if (await isAdminRequest(request) && tier !== 'AUTH_LOGIN') {
    return { allowed: true }
  }

  const identifier = getClientIdentifier(request, user_id)

  // Check if blocked
  if (await isBlocked(identifier, tier)) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '900', // 15 minutes
          },
        }
      ),
    }
  }

  // Check rate limit
  const result = await checkRateLimit(identifier, tier)

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded. Please slow down.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS[tier].maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
            'Retry-After': (result.retryAfter || 60).toString(),
          },
        }
      ),
    }
  }

  return { allowed: true }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  tier: RateLimitTier,
  remaining: number,
  resetAt: number
): void {
  response.headers.set(
    'X-RateLimit-Limit',
    RATE_LIMITS[tier].maxRequests.toString()
  )
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set(
    'X-RateLimit-Reset',
    Math.ceil(resetAt / 1000).toString()
  )
}

/**
 * Burst protection untuk file uploads
 */
export async function checkUploadBurst(
  identifier: string
): Promise<{ allowed: boolean; current: number }> {
  const redis = await getRedisClient()
  if (!redis) return { allowed: true, current: 0 }

  const key = `upload:burst:${identifier}`
  const config = RATE_LIMITS.PHOTO_UPLOAD

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      // First upload, set expiry
      await redis.expire(key, Math.ceil(config.windowMs / 1000))
    }

    const allowed = current <= config.burstMax

    return { allowed, current }
  } catch (error) {
    console.error('Upload burst check error:', error)
    return { allowed: true, current: 0 }
  }
}

/**
 * Release upload burst slot
 */
export async function releaseUploadBurst(identifier: string): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return

  const key = `upload:burst:${identifier}`
  await redis.decr(key).catch(() => {})
}

/**
 * Clear rate limit untuk identifier (admin function)
 */
export async function clearRateLimit(
  identifier: string,
  tier?: RateLimitTier
): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return

  if (tier) {
    const key = `ratelimit:${tier}:${identifier}`
    await redis.del(key)
  } else {
    // Clear all rate limits for identifier
    const keys = await redis.keys(`ratelimit:*:${identifier}`)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  }
}
