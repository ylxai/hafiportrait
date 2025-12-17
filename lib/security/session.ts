/**
 * Enhanced Session & Cookie Security
 * Priority: HIGH (CVSS 6.5)
 * 
 * Implements secure session management dengan:
 * - Extended JWT expiry (24h -> 7 days) untuk photography workflow
 * - Refresh token mechanism
 * - Secure cookie flags
 * - Photography-specific session optimization
 */

import { SignJWT, jwtVerify } from 'jose'
import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { getJWTSecret } from '@/lib/config/security'
import { NextRequest, NextResponse } from 'next/server'

// Session configuration
export const SESSION_CONFIG = {
  accessTokenExpiry: '7d', // Extended untuk photography workflow
  refreshTokenExpiry: '30d', // Refresh token berlaku 30 hari
  cookieMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  refreshCookieMaxAge: 30 * 24 * 60 * 60, // 30 days
} as const

export interface SessionPayload {
  user_id: string
  username: string
  email?: string
  role: string
  sessionId?: string
  type: 'access' | 'refresh'
}

/**
 * Generate secure session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create access token dengan extended expiry
 */
export async function createAccessToken(
  payload: Omit<SessionPayload, 'type'>
): Promise<string> {
  const jwtSecret = getJWTSecret()
  
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_CONFIG.accessTokenExpiry)
    .sign(jwtSecret)
}

/**
 * Create refresh token dan store di database
 */
export async function createRefreshToken(user_id: string): Promise<string> {
  const jwtSecret = getJWTSecret()
  const tokenId = generateSessionId()
  
  // Create JWT refresh token
  const token = await new SignJWT({ 
    user_id, 
    tokenId,
    type: 'refresh' 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_CONFIG.refreshTokenExpiry)
    .sign(jwtSecret)

  // Store refresh token di database
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token,
      user_id,
      expiresAt,
    }
  })

  return token
}

/**
 * Verify refresh token dan return payload
 */
export async function verifyRefreshToken(
  token: string
): Promise<{ valid: boolean; user_id?: string; tokenId?: string }> {
  try {
    const jwtSecret = getJWTSecret()
    const { payload } = await jwtVerify(token, jwtSecret)

    if (payload.type !== 'refresh') {
      return { valid: false }
    }

    // Check token exists di database dan belum expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId as string },
      select: {
        id: true,
        user_id: true,
        expiresAt: true,
      }
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return { valid: false }
    }

    return {
      valid: true,
      user_id: storedToken.user_id,
      tokenId: storedToken.id,
    }
  } catch (error) {
    return { valid: false }
  }
}

/**
 * Revoke refresh token (logout)
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await prisma.refreshToken.delete({
    where: { id: tokenId }
  }).catch(() => {
    // Token mungkin sudah tidak ada, ignore error
  })
}

/**
 * Revoke all refresh tokens untuk user (logout dari all devices)
 */
export async function revokeAllUserTokens(user_id: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { user_id }
  })
}

/**
 * Set secure authentication cookies
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string
): void {
  const isProduction = process.env.NODE_ENV === 'production'

  // Set access token cookie
  response.cookies.set({
    name: 'auth-token',
    value: accessToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_CONFIG.cookieMaxAge,
  })

  // Set refresh token cookie jika provided
  if (refreshToken) {
    response.cookies.set({
      name: 'refresh-token',
      value: refreshToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict', // Stricter untuk refresh token
      path: '/api/auth/refresh',
      maxAge: SESSION_CONFIG.refreshCookieMaxAge,
    })
  }
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set({
    name: 'refresh-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 0,
  })
}

/**
 * Extract refresh token dari request cookies
 */
export function extractRefreshToken(request: NextRequest): string | null {
  return request.cookies.get('refresh-token')?.value || null
}

/**
 * Cleanup expired refresh tokens (should run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })

  return result.count
}
