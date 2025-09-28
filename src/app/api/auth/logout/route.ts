/**
 * Admin Logout API Endpoint
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { destroySession, logActivity, validateSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Get user info before destroying session
    const user = await validateSession(sessionId);
    
    // Destroy session
    await destroySession(sessionId);

    // Log logout activity
    if (user) {
      const ipAddress = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0] || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity(
        user.id,
        'logout',
        'auth',
        user.username,
        { ip_address: ipAddress },
        ipAddress,
        userAgent
      );
    }

    // Clear session cookie
    const cookieStoreForClear = await cookies();
    const host = request.headers.get('host')?.toLowerCase() || '';
    const isHafiPortrait = host.endsWith('hafiportrait.photography') || host.endsWith('.hafiportrait.photography');
    cookieStoreForClear.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      ...(isHafiPortrait ? { domain: '.hafiportrait.photography' } : {}),
    });

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}