import { NextResponse } from 'next/server'

/**
 * Security headers configuration untuk aplikasi
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean
  strictTransportSecurity?: boolean
  xContentTypeOptions?: boolean
  xFrameOptions?: boolean
  xXssProtection?: boolean
  referrerPolicy?: boolean
  permissionsPolicy?: boolean
}

/**
 * Default security headers
 */
const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: true,
  strictTransportSecurity: true,
  xContentTypeOptions: true,
  xFrameOptions: true,
  xXssProtection: true,
  referrerPolicy: true,
  permissionsPolicy: true,
}

/**
 * Generate Content Security Policy header value
 */
function getCSPHeader(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Development CSP (lebih permissive untuk hot reload, etc)
  if (isDevelopment) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval untuk hot reload
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss: http://localhost:* https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  }

  // Production CSP (strict)
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // unsafe-inline untuk Tailwind
    "img-src 'self' data: https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev",
    "font-src 'self' data:",
    "connect-src 'self' wss: https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = DEFAULT_CONFIG
): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production'

  // Content Security Policy
  if (config.contentSecurityPolicy) {
    response.headers.set('Content-Security-Policy', getCSPHeader())
  }

  // Strict-Transport-Security (HSTS) - only in production
  if (config.strictTransportSecurity && isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    response.headers.set('X-Frame-Options', 'DENY')
  }

  // X-XSS-Protection (legacy, but still useful)
  if (config.xXssProtection) {
    response.headers.set('X-XSS-Protection', '1; mode=block')
  }

  // Referrer-Policy
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  // Permissions-Policy
  if (config.permissionsPolicy) {
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )
  }

  return response
}

/**
 * Create response dengan security headers
 */
export function createSecureResponse(
  data: any,
  status: number = 200,
  config?: SecurityHeadersConfig
): NextResponse {
  const response = NextResponse.json(data, { status })
  return applySecurityHeaders(response, config)
}

/**
 * Log security event untuk monitoring
 */
export interface SecurityEvent {
  type: 'AUTH_FAILED' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY'
  identifier: string
  details?: Record<string, any>
  timestamp?: Date
}

/**
 * Log security event
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const timestamp = event.timestamp || new Date()
  const logEntry = {
    ...event,
    timestamp: timestamp.toISOString(),
    environment: process.env.NODE_ENV,
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
  } else {
    // In production, log dengan proper format untuk monitoring tools
  }

  // TODO: Integrate dengan monitoring service (Sentry, DataDog, etc)
  // Example: Sentry.captureMessage('Security Event', { level: 'warning', extra: logEntry })
}

/**
 * CORS configuration helper
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    allowedOrigins.includes('*')
  )
  if (!isAllowed && process.env.NODE_ENV === 'production') {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Request logger middleware
 */
export interface RequestLog {
  method: string
  url: string
  ip: string
  userAgent: string
  timestamp: string
  user_id?: string
}

/**
 * Log request untuk monitoring
 */
export function logRequest(request: Request, user_id?: string): void {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = realIp || forwardedFor?.split(',')[0] || 'unknown'

  const log: RequestLog = {
    method: request.method,
    url: new URL(request.url).pathname,
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    ...(user_id && { user_id }),
  }

  // Log in development for debugging
  if (process.env.NODE_ENV === 'development') {
  }

  // TODO: Send to logging service in production
}
