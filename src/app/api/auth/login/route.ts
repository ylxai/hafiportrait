/**
 * Admin Login API Endpoint
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, logActivity } from '@/lib/auth';
import { cookies } from 'next/headers';
import { corsResponse, corsErrorResponse, handleOptions, handleCors } from '@/lib/cors';

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;
  console.log('OPTIONS request from origin:', origin);
  return handleOptions(origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;
  console.log('POST request from origin:', origin);
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  try {
    // Validate request method
    if (request.method !== 'POST') {
      console.log('Invalid method:', request.method);
      return corsErrorResponse('Method not allowed', 405, origin);
    }

    // Check if required environment variables are set
    const requiredEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: process.env.JWT_SECRET
    };

    const missingEnvVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value || value === 'hafiportrait-secret-key-change-in-production')
      .map(([key]) => key);

    if (missingEnvVars.length > 0) {
      console.error('Missing required environment variables:', missingEnvVars);
      return corsErrorResponse('Server configuration error', 500, origin);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', { ...body, password: '[HIDDEN]' });
    } catch (error) {
      console.error('JSON parse error:', error);
      return corsErrorResponse('Invalid JSON in request body', 400, origin);
    }

    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      console.log('Missing credentials');
      return corsErrorResponse('Username dan password harus diisi', 400, origin);
    }

    // Validate input length
    if (username.length < 3 || username.length > 50) {
      console.log('Invalid username length:', username.length);
      return corsErrorResponse('Username harus antara 3-50 karakter', 400, origin);
    }

    if (password.length < 6 || password.length > 100) {
      console.log('Invalid password length:', password.length);
      return corsErrorResponse('Password harus antara 6-100 karakter', 400, origin);
    }

    // Validate input format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      console.log('Invalid username format');
      return corsErrorResponse('Username hanya boleh berisi huruf, angka, dan underscore', 400, origin);
    }

    // Get client info
    const xfwd = request.headers.get('x-forwarded-for') || '';
    const ipAddress = (xfwd.split(',')[0] || request.headers.get('x-real-ip') || '').trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('Client info:', { ipAddress, userAgent: userAgent.substring(0, 100) });

    // Rate limiting check (basic implementation)
    const rateLimitKey = `login_attempts:${ipAddress}`;
    // Note: In production, implement proper rate limiting with Redis or similar

    // Authenticate user with timeout
    console.log('Attempting authentication for username:', username);
    
    let user;
    try {
      // Add timeout to authentication
      const authPromise = authenticateUser({ username, password });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout')), 30000)
      );
      
      user = await Promise.race([authPromise, timeoutPromise]) as any;
    } catch (authError) {
      console.error('Authentication error:', authError);
      return corsErrorResponse('Terjadi kesalahan saat autentikasi. Silakan coba lagi.', 500, origin);
    }
    
    if (!user) {
      console.log('Authentication failed for username:', username);
      // Log failed login attempt
      try {
        await logActivity(
          0, // No user ID for failed attempts
          'login_failed',
          'auth',
          username,
          { 
            reason: 'invalid_credentials',
            ip_address: ipAddress,
            user_agent: userAgent
          },
          ipAddress,
          userAgent
        );
      } catch (logError) {
        console.error('Failed to log activity:', logError);
        // Don't fail the request if logging fails
      }

      return corsErrorResponse('Username atau password salah', 401, origin);
    }

    console.log('Authentication successful for user:', user.username);

    // Check if user is active
    if (user.status !== 'active' && user.is_active !== true) {
      console.log('User account inactive:', user.username);
      try {
        await logActivity(
          user.id,
          'login_failed',
          'auth',
          user.username,
          { 
            reason: 'account_inactive',
            ip_address: ipAddress,
            user_agent: userAgent
          },
          ipAddress,
          userAgent
        );
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }

      return corsErrorResponse('Akun tidak aktif. Silakan hubungi administrator.', 403, origin);
    }

    // Create session with timeout
    console.log('Creating session for user:', user.username);
    let sessionId;
    try {
      const sessionPromise = createSession(user.id, ipAddress, userAgent);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session creation timeout')), 30000)
      );
      
      sessionId = await Promise.race([sessionPromise, timeoutPromise]) as string;
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      return corsErrorResponse('Gagal membuat sesi. Silakan coba lagi.', 500, origin);
    }

    if (!sessionId) {
      console.error('Failed to create session for user:', user.username);
      return corsErrorResponse('Gagal membuat sesi. Silakan coba lagi.', 500, origin);
    }

    console.log('Session created successfully:', sessionId);

    // Log successful login
    try {
      await logActivity(
        user.id,
        'login_success',
        'auth',
        user.username,
        { 
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId
        },
        ipAddress,
        userAgent
      );
    } catch (logError) {
      console.error('Failed to log activity:', logError);
      // Don't fail the request if logging fails
    }

    // Set session cookie with enhanced security for production
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    // Get request info for domain detection
    const hostHeader = request.headers.get('host') || '';
    const xfp = (request.headers.get('x-forwarded-proto') || '').toLowerCase();
    const referer = request.headers.get('referer') || '';
    
    // More robust HTTPS detection for Cloudflare/proxy environments
    const isHttps = xfp === 'https' || 
                   origin?.startsWith('https://') || 
                   request.url.startsWith('https://') ||
                   referer.startsWith('https://');

    // Clear localhost detection - only for actual localhost/127.0.0.1
    const isLocalhost = hostHeader.includes('localhost') || 
                       hostHeader.startsWith('127.0.0.1') ||
                       hostHeader.startsWith('0.0.0.0');

    // Domain detection - priority for hafiportrait.photography
    const isHafiPortraitDomain = hostHeader.includes('hafiportrait.photography') || 
                                origin?.includes('hafiportrait.photography') ||
                                referer.includes('hafiportrait.photography');

    // VPS IP detection
    const isVPSAccess = hostHeader.includes('147.251.255.227') || 
                       origin?.includes('147.251.255.227');

    console.log('🔍 Request Analysis:', {
      hostHeader,
      origin,
      referer,
      xfp,
      isHttps,
      isLocalhost,
      isHafiPortraitDomain,
      isVPSAccess,
      isProduction,
      userAgent: userAgent.substring(0, 100)
    });

    // Base cookie options
    const cookieOptions: any = {
      httpOnly: true,
      secure: false, // Will be set based on context
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    };

    // Domain-specific cookie configuration with enhanced logic
    if (isHafiPortraitDomain) {
      // Domain access - ALWAYS use both domain and host-only cookies
      cookieOptions.domain = 'hafiportrait.photography';
      // Set secure=true for HTTPS domain cookies
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'lax';
      console.log('🌐 Domain access detected - Setting secure domain cookie');
    } else if (isVPSAccess && !isLocalhost) {
      // VPS IP access - host-only cookie with conditional secure
      cookieOptions.secure = isHttps;
      console.log('🖥️ VPS access detected - Setting host-only cookie, secure:', isHttps);
    } else if (isLocalhost) {
      // Local development - no secure flag
      cookieOptions.secure = false;
      console.log('🏠 Localhost access detected - Setting non-secure cookie');
    } else {
      // Fallback - determine based on production and HTTPS
      cookieOptions.secure = isProduction && isHttps;
      console.log('🔧 Fallback config - secure:', cookieOptions.secure);
    }

    console.log('🍪 Final Cookie Configuration:', {
      domain: cookieOptions.domain,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      httpOnly: cookieOptions.httpOnly,
      maxAge: cookieOptions.maxAge,
      sessionId: sessionId.substring(0, 20) + '...'
    });
    
    // Set cookie via cookies() API
    try {
      cookieStore.set('admin_session', sessionId, cookieOptions);
      console.log('✅ Cookie set via cookies() API');
    } catch (error) {
      console.error('❌ Failed to set cookie via cookies() API:', error);
    }

    // Return user data (without sensitive info)
    const responseData = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status || (user.is_active ? 'active' : 'inactive')
      },
      message: 'Login berhasil',
      session: {
        expires_in: 24 * 60 * 60, // 24 hours in seconds
        created_at: new Date().toISOString()
      },
      debug: {
        cookieDomain: cookieOptions.domain,
        cookieSecure: cookieOptions.secure,
        cookieSameSite: cookieOptions.sameSite,
        accessType: isHafiPortraitDomain ? 'domain' : isVPSAccess ? 'vps' : 'other',
        detectedDomain: isHafiPortraitDomain,
        requestOrigin: origin,
        requestHost: hostHeader
      },
      // Add sessionId for client-side cookie fallback
      sessionId: sessionId
    };

    console.log('📤 Sending login response');
    
    // Create response with multiple cookie setting attempts
    const res = NextResponse.json(responseData, { status: 200 });
    
    // Set multiple cookie variants for maximum compatibility
    try {
      // Primary cookie with domain (for production)
      res.cookies.set('admin_session', sessionId, cookieOptions);
      console.log('✅ Primary response cookie set');
      
      // ALWAYS set host-only cookie (without domain) for compatibility
      const hostOnlyOptions = { ...cookieOptions };
      delete hostOnlyOptions.domain;
      res.cookies.set('admin_session_backup', sessionId, hostOnlyOptions);
      console.log('✅ Backup response cookie set');
      
      // Additional fallback cookie with minimal options (most compatible)
      res.cookies.set('admin_session_fallback', sessionId, {
        httpOnly: true,
        path: '/',
        maxAge: 86400,
        secure: cookieOptions.secure,
        sameSite: 'lax'
      });
      console.log('✅ Fallback response cookie set');
      
      // For domain access, also set a simple cookie without domain restrictions
      if (isHafiPortraitDomain) {
        res.cookies.set('admin_session_simple', sessionId, {
          httpOnly: true,
          path: '/',
          maxAge: 86400,
          secure: true,
          sameSite: 'lax'
          // NO domain property = host-only cookie
        });
        console.log('✅ Simple host-only cookie set for domain access');
      }
      
    } catch (error) {
      console.error('❌ Failed to set response cookies:', error);
    }

    // Add CORS headers
    return handleCors(res, origin);

  } catch (error) {
    console.error('Login API error:', error);
    
    // Log the error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't expose internal errors to client
    return corsErrorResponse('Terjadi kesalahan server. Silakan coba lagi nanti.', 500, origin);
  }
}