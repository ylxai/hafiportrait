/**
 * Security Middleware Aggregator
 * Combines all security features untuk easy integration di API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { withCSRFProtection } from '@/lib/security/csrf'
import { withRateLimit, RateLimitTier, addRateLimitHeaders } from '@/lib/security/rate-limit'
import { getUserFromRequest, isAdmin } from '@/lib/auth'

export interface SecurityOptions {
  csrf?: boolean
  rateLimit?: RateLimitTier
  requireAuth?: boolean
  requireAdmin?: boolean
}

export interface SecurityResult {
  allowed: boolean
  response?: NextResponse
  user?: any
  csrfSecret?: string
}

/**
 * Unified security middleware untuk API routes
 * 
 * Usage:
 * export async function POST(request: NextRequest) {
 *   const security = await withSecurity(request, {
 *     csrf: true,
 *     rateLimit: 'PHOTO_UPLOAD',
 *     requireAuth: true
 *   })
 *   
 *   if (!security.allowed) {
 *     return security.response
 *   }
 *   
 *   // Your route logic with security.user
 * }
 */
export async function withSecurity(
  request: NextRequest,
  options: SecurityOptions = {}
): Promise<SecurityResult> {
  const {
    csrf = false,
    rateLimit,
    requireAuth = false,
    requireAdmin = false,
  } = options

  let user = null

  // 1. Authentication check (jika required)
  if (requireAuth || requireAdmin) {
    user = await getUserFromRequest(request)
    
    if (!user) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    // Admin check
    if (requireAdmin && !isAdmin(user)) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        ),
      }
    }
  }

  // 2. Rate limiting (jika specified)
  if (rateLimit) {
    const rateLimitResult = await withRateLimit(
      request,
      rateLimit,
      user?.user_id
    )
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        response: rateLimitResult.response,
      }
    }
  }

  // 3. CSRF protection (jika enabled)
  if (csrf) {
    const csrfResult = await withCSRFProtection(request)
    
    if (!csrfResult.valid) {
      return {
        allowed: false,
        response: csrfResult.response,
      }
    }

    return {
      allowed: true,
      user,
      csrfSecret: csrfResult.secret,
    }
  }

  return {
    allowed: true,
    user,
  }
}

/**
 * Create secure response dengan appropriate headers
 */
export function createSecureResponse(
  data: any,
  status: number = 200,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status })

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Additional headers
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}
