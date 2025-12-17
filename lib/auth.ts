import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcrypt'
import { getJWTSecret, securityConfig } from './config/security'

export interface JWTPayload {
  user_id: string
  email: string
  role: string
  iat?: number
  exp?: number
  [key: string]: any // Index signature untuk Jose compatibility
}

/**
 * Hash password menggunakan bcrypt dengan configured rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, securityConfig.bcryptRounds)
}

/**
 * Verify password terhadap hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Sign JWT token dengan payload dan expiration time dari config
 */
export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const jwtSecret = getJWTSecret()
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(securityConfig.jwtExpirationTime)
    .sign(jwtSecret)
}

/**
 * Verify dan decode JWT token
 * Returns payload jika valid, null jika invalid
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const jwtSecret = getJWTSecret()
    const { payload } = await jwtVerify(token, jwtSecret)
    
    // Validate required fields
    if (!payload.user_id || !payload.email || !payload.role) {
      return null
    }
    
    return payload as JWTPayload
  } catch (error) {
    // Log error di development untuk debugging
    if (securityConfig.nodeEnv === 'development') {
      console.error('JWT verification failed:', error)
    }
    return null
  }
}

/**
 * Extract dan verify JWT dari request headers atau cookies
 * Returns user payload jika authenticated, null jika tidak
 */
export async function getUserFromRequest(
  request: Request
): Promise<JWTPayload | null> {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyJWT(token)
  }

  // Check cookie token
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    const token = cookies['auth-token']
    if (token) {
      // Validate JWT format (3 parts separated by dots)
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null // Invalid JWT format
      }
      
      return verifyJWT(token)
    }
  }

  return null
}

/**
 * Check if user has required role
 */
export function hasRole(user: JWTPayload | null, role: string): boolean {
  return user?.role === role
}

/**
 * Check if user is admin
 */
export function isAdmin(user: JWTPayload | null): boolean {
  return hasRole(user, 'ADMIN')
}
