import { redis } from '@/lib/redis'
import { RateLimitError } from '@/lib/errors/types'
import prisma from '@/lib/prisma'

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Redis key prefix
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp
}

/**
 * Default rate limit configurations
 */
export const RateLimitPresets = {
  // Auth endpoints: 5 attempts per 15 minutes
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'rate-limit:auth',
  },
  // API general: 100 requests per minute
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'rate-limit:api',
  },
  // File upload: 10 uploads per 5 minutes
  UPLOAD: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    keyPrefix: 'rate-limit:upload',
  },
  // Comments: 5 comments per minute
  COMMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyPrefix: 'rate-limit:comment',
  },
  // Gallery access code attempts: 10 per hour
  GALLERY_ACCESS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: 'rate-limit:gallery-access',
  },
  // Gallery photo likes: 100 per hour
  GALLERY_LIKE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    keyPrefix: 'rate-limit:gallery-like',
  },
  // Gallery downloads: 50 per hour per guest
  GALLERY_DOWNLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyPrefix: 'rate-limit:gallery-download',
  },
  // Gallery comments: 5 per minute
  GALLERY_COMMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyPrefix: 'rate-limit:gallery-comment',
  },
}

/**
 * Get client identifier dari request
 * Uses IP address dengan fallback ke user agent
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown'

  // Add user agent untuk better uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const hash = simpleHash(`${ip}-${userAgent}`)

  return hash
}

/**
 * Simple hash function untuk generate short identifier
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Check rate limit untuk client
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `${config.keyPrefix}:${identifier}`

  try {
    // Get current request count in window - use zRangeByScore (correct Redis v4 method)
    const requests = await redis.zRangeByScore(key, windowStart, now)
    const currentCount = requests.length

    // Calculate reset time
    const resetTime = now + config.windowMs

    // Check if limit exceeded
    if (currentCount >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: Math.ceil(resetTime / 1000),
      }
    }

    // Add current request to sorted set - use zAdd (correct Redis v4 method)
    await redis.zAdd(key, { score: now, value: `${now}` })

    // Clean up old entries - use zRemRangeByScore (correct Redis v4 method)
    await redis.zRemRangeByScore(key, 0, windowStart)

    // Set expiry on key
    await redis.expire(key, Math.ceil(config.windowMs / 1000))

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - currentCount - 1,
      reset: Math.ceil(resetTime / 1000),
    }
  } catch (error) {
    // If Redis fails, allow the request but log error
    console.error('Rate limiter error:', error)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: Math.ceil((now + config.windowMs) / 1000),
    }
  }
}

/**
 * Rate limit middleware wrapper
 * Throws RateLimitError jika limit exceeded
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request)
  const result = await checkRateLimit(identifier, config)

  if (!result.success) {
    const retryAfter = result.reset - Math.floor(Date.now() / 1000)
    throw new RateLimitError(
      'Too many requests, please try again later',
      retryAfter,
      {
        limit: result.limit,
        reset: result.reset,
      }
    )
  }

  return result
}

/**
 * Check download rate limit with database tracking (for accurate guest tracking)
 * Used by gallery download endpoints
 */
export async function checkDownloadRateLimit(guestId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const downloadCount = await prisma.photoDownload.count({
    where: {
      guestId,
      downloadedAt: {
        gte: oneHourAgo,
      },
    },
  });

  const maxDownloads = RateLimitPresets.GALLERY_DOWNLOAD.maxRequests;
  const allowed = downloadCount < maxDownloads;

  return {
    allowed,
    remaining: Math.max(0, maxDownloads - downloadCount),
    resetTime: Date.now() + 60 * 60 * 1000,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers)
  
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.reset.toString())

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Reset rate limit untuk identifier (admin use)
 */
export async function resetRateLimit(
  identifier: string,
  keyPrefix: string
): Promise<void> {
  const key = `${keyPrefix}:${identifier}`
  await redis.del(key)
}

/**
 * Get current rate limit status tanpa increment
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `${config.keyPrefix}:${identifier}`

  try {
    const requests = await redis.zRangeByScore(key, windowStart, now)
    const currentCount = requests.length
    const resetTime = now + config.windowMs

    return {
      success: currentCount < config.maxRequests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      reset: Math.ceil(resetTime / 1000),
    }
  } catch (error) {
    console.error('Rate limiter status check error:', error)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.ceil((now + config.windowMs) / 1000),
    }
  }
}
