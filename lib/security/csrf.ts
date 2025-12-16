/**
 * CSRF Protection Implementation
 * Priority: CRITICAL (CVSS 7.5)
 * 
 * Implements Double Submit Cookie pattern untuk protect against CSRF attacks
 * pada photography platform dengan focus on state-changing operations
 */

import { randomBytes, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_SECRET_LENGTH = 64
const CSRF_COOKIE_NAME = 'csrf-secret'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate cryptographically secure CSRF secret
 */
export function generateCSRFSecret(): string {
  return randomBytes(CSRF_SECRET_LENGTH).toString('hex')
}

/**
 * Generate CSRF token dari secret menggunakan HMAC
 */
export function generateCSRFToken(secret: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  const hash = createHash('sha256')
    .update(`${secret}:${token}`)
    .digest('hex')
  
  return `${token}.${hash}`
}

/**
 * Validate CSRF token terhadap secret
 */
export function validateCSRFToken(token: string, secret: string): boolean {
  if (!token || !secret) {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [tokenPart, hashPart] = parts
  const expectedHash = createHash('sha256')
    .update(`${secret}:${tokenPart}`)
    .digest('hex')

  return hashPart === expectedHash
}

/**
 * Extract CSRF token dari request (header atau body)
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) {
    return headerToken
  }

  // Check body for form submissions
  const contentType = request.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    // Will be checked in route handler after JSON parse
    return null
  }

  return null
}

/**
 * Extract CSRF secret dari cookies
 */
export function extractCSRFSecret(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null
}

/**
 * Set CSRF secret cookie
 */
export function setCSRFCookie(response: NextResponse, secret: string): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: secret,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

/**
 * CSRF Protection Middleware untuk API routes
 * 
 * Usage di API route:
 * export async function POST(request: NextRequest) {
 *   const csrfCheck = await withCSRFProtection(request)
 *   if (!csrfCheck.valid) {
 *     return csrfCheck.response
 *   }
 *   // Your route logic
 * }
 */
export async function withCSRFProtection(
  request: NextRequest
): Promise<{ valid: boolean; response?: NextResponse; secret?: string }> {
  // Skip CSRF untuk GET, HEAD, OPTIONS (safe methods)
  const method = request.method
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }

  const secret = extractCSRFSecret(request)
  
  // Jika tidak ada secret, generate new one
  if (!secret) {
    const newSecret = generateCSRFSecret()
    const response = NextResponse.json(
      { error: 'CSRF token missing. Please refresh and try again.' },
      { status: 403 }
    )
    setCSRFCookie(response, newSecret)
    
    return { valid: false, response }
  }

  // Extract token from request
  let token = extractCSRFToken(request)
  
  // Check body for JSON requests
  if (!token && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.json()
      token = body._csrf || body.csrfToken
      
      // Re-create request with parsed body for route handler
      // Note: Body sudah di-consume, route handler harus handle ini
    } catch (error) {
      // Body parsing error
    }
  }

  // Validate token
  if (!token || !validateCSRFToken(token, secret)) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid CSRF token. Security check failed.' },
        { status: 403 }
      )
    }
  }

  return { valid: true, secret }
}
/**
 * Generate CSRF token untuk client-side forms
 */
export function generateCSRFTokenForClient(request: NextRequest): {
  token: string
  response: NextResponse
} {
  let secret = extractCSRFSecret(request)
  
  if (!secret) {
    secret = generateCSRFSecret()
  }

  const token = generateCSRFToken(secret)
  const response = NextResponse.json({ csrfToken: token })
  
  setCSRFCookie(response, secret)
  
  return { token, response }
}

/**
 * Helper untuk create CSRF-protected response
 */
export function createCSRFProtectedResponse(
  data: any,
  request: NextRequest,
  status: number = 200
): NextResponse {
  let secret = extractCSRFSecret(request)
  
  if (!secret) {
    secret = generateCSRFSecret()
  }

  const token = generateCSRFToken(secret)
  const response = NextResponse.json(
    { ...data, csrfToken: token },
    { status }
  )
  setCSRFCookie(response, secret)
  
  return response
}
