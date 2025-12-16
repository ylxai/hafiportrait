/**
 * Refresh Token Endpoint
 * Allows clients to refresh their access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, createAccessToken, createRefreshToken, revokeRefreshToken, setAuthCookies } from '@/lib/security/session'
import { withSecurity } from '@/lib/middleware/security'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting untuk prevent brute force
    const security = await withSecurity(request, {
      rateLimit: 'AUTH_LOGIN',
    })

    if (!security.allowed) {
      return security.response
    }

    // Extract refresh token dari cookie
    const refreshToken = request.cookies.get('refresh-token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const verification = await verifyRefreshToken(refreshToken)

    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Revoke old refresh token
    if (verification.tokenId) {
      await revokeRefreshToken(verification.tokenId)
    }

    // Create new tokens
    const newAccessToken = await createAccessToken({
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      role: user.role,
    })

    const newRefreshToken = await createRefreshToken(user.id)

    // Create response dengan new tokens
    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })

    // Set new cookies
    setAuthCookies(response, newAccessToken, newRefreshToken)

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
