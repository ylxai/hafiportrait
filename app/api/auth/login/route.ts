import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signJWT } from '@/lib/auth'
import { loginSchema } from '@/lib/validation/schemas'
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from '@/lib/security/rate-limiter'
import { asyncHandler, successResponse } from '@/lib/errors/handler'
import { AuthenticationError, ValidationError } from '@/lib/errors/types'
import { applySecurityHeaders, logSecurityEvent, logRequest } from '@/lib/security/headers'

/**
 * POST /api/auth/login
 * Login endpoint dengan username authentication, rate limiting dan security features
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // Log request
  logRequest(request)

  // Apply rate limiting (5 attempts per 15 minutes) - temporarily disabled for Redis issues
  let rateLimitResult
  try {
    rateLimitResult = await rateLimit(request, RateLimitPresets.AUTH)
  } catch (redisError) {
    console.warn('Rate limiting disabled due to Redis error:', redisError)
    rateLimitResult = { 
      success: true, 
      limit: 5, 
      remaining: 5,
      reset: Math.floor((Date.now() + 900000) / 1000)
    }
  }

  // Parse request body
  const body = await request.json()

  // Validate input dengan Zod
  const validation = loginSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => {
      const path = err.path.join('.')
      return path ? `${path}: ${err.message}` : err.message
    })

    logSecurityEvent({
      type: 'AUTH_FAILED',
      identifier: body.username || 'unknown',
      details: { reason: 'validation_failed', errors },
    })

    throw new ValidationError('Invalid input', errors)
  }

  const { username, password } = validation.data

  // Find user by username
  const user = await prisma.users.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      password_hash: true,
    },
  })

  if (!user) {
    logSecurityEvent({
      type: 'AUTH_FAILED',
      identifier: username,
      details: { reason: 'user_not_found' },
    })

    // Generic error message untuk security (don't reveal if user exists)
    throw new AuthenticationError('Invalid username or password')
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
    logSecurityEvent({
      type: 'AUTH_FAILED',
      identifier: username,
      details: { reason: 'invalid_password', user_id: user.id },
    })

    throw new AuthenticationError('Invalid username or password')
  }

  // Generate JWT token with username
  const token = await signJWT({
    user_id: user.id,
    username: user.username || '',
    role: user.role,
  })

  // Create response data (exclude password hash)
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
  }

  // Create success response
  let response = successResponse(
    {
      user: userData,
      token,
    },
    'Login successful'
  )
  
  // Set httpOnly cookie for web clients
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  // Add rate limit headers
  response = addRateLimitHeaders(response, rateLimitResult) as typeof response

  // Apply security headers
  response = applySecurityHeaders(response)

  return response
})
