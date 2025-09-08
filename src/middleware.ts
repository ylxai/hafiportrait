/**
 * Next.js Middleware for Authentication and CORS
 * Protects admin routes and handles authentication with enhanced CORS support
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/admin'];

// Routes that should redirect to admin if already authenticated
const authRoutes = ['/admin/login'];

// Allowed origins for CORS
const getAllowedOrigins = (): string[] => {
  const origins = [
    // Production domains
    'https://hafiportrait.photography',
    'https://www.hafiportrait.photography',
    'https://hafiportrait.vercel.app',
    'https://hafiportrait-git-main.vercel.app',
    'https://hafiportrait-git-develop.vercel.app',
    
    // Development domains
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://147.251.255.227:3000',
    'http://147.251.255.227:3001',
    
    // Vercel preview domains (wildcard)
    'https://*.vercel.app',
    
    // Additional production domains
    'https://hafiportrait.com',
    'https://www.hafiportrait.com',
  ];

  // Add environment-specific origins
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:*');
    origins.push('http://127.0.0.1:*');
  }

  // Add custom domains from environment variables
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...customOrigins);
  }

  return origins;
};

// Check if origin is allowed
const isOriginAllowed = (origin: string): boolean => {
  const allowedOrigins = getAllowedOrigins();
  
  // Allow all origins in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check wildcard patterns
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return false;
  });
};

// Helper function to get base URL for API calls
function getBaseUrl(request: NextRequest): string {
  // Prefer proxy headers to reconstruct external origin correctly
  const xfProtoRaw = request.headers.get('x-forwarded-proto') || '';
  const xfHostRaw = request.headers.get('x-forwarded-host') || '';
  const hostHeader = request.headers.get('host') || '';

  const xfProto = xfProtoRaw.split(',')[0].trim();
  const xfHost = xfHostRaw.split(',')[0].trim();

  const proto = xfProto || (request.url.startsWith('https://') ? 'https' : 'http');
  const host = xfHost || hostHeader;

  if (proto && host) {
    return `${proto}://${host}`;
  }

  // Fallback to URL origin
  const url = new URL(request.url);
  return url.origin;
}

// Helper function to validate session with timeout and retry
async function validateSessionWithRetry(baseUrl: string, sessionId: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const validateResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Cookie': `admin_session=${sessionId}`,
          'User-Agent': 'NextJS-Middleware/1.0',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!validateResponse.ok) {
        throw new Error(`HTTP ${validateResponse.status}`);
      }
      
      const responseData = await validateResponse.json();
      
      if (!responseData.success || !responseData.user) {
        throw new Error('Invalid response structure');
      }
      
      return responseData;
    } catch (error) {
      console.warn(`Session validation attempt ${i + 1} failed:`, error);
      
      if (i === retries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
    }
  }
}

// Add CORS headers to response
function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, X-User-ID, X-User-Username, X-User-Role',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Set Access-Control-Allow-Origin with security considerations
  if (!origin || isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  } else {
    // Fallback to first allowed origin
    const allowedOrigins = getAllowedOrigins();
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0] || '*';
  }

  // Add security headers for production
  if (process.env.NODE_ENV === 'production') {
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
  }

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get('admin_session')?.value;
  const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response, origin);
  }

  // Block common bot attack patterns FIRST (before any processing)
  const blockedPaths = [
    '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
    '/xmlrpc.php', '/phpmyadmin', '/phpMyAdmin', '/admin/config.php',
    '/administrator', '/.env', '/.git', '/config.php', '/setup.php', '/install.php'
  ];
  
  const isBlocked = blockedPaths.some(blocked => 
    pathname.startsWith(blocked) || pathname.includes(blocked)
  );
  
  if (isBlocked) {
    // Return 404 immediately without logging
    const response = new NextResponse(null, { 
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
    return addCorsHeaders(response, origin);
  }

  // Skip middleware for health checks and static assets
  if (pathname.includes('/health') || 
      pathname.includes('/_next/') || 
      pathname.includes('/favicon') ||
      pathname.includes('/api/health')) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) && pathname !== '/admin/login'
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route
  if (isProtectedRoute) {
    if (!sessionId) {
      // No session, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      return addCorsHeaders(response, origin);
    }

    // Validate session with robust error handling
    try {
      const baseUrl = getBaseUrl(request);
      const responseData = await validateSessionWithRetry(baseUrl, sessionId);
      const user = responseData.user;
      
      // Add user info to headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id.toString());
      requestHeaders.set('x-user-username', user.username);
      requestHeaders.set('x-user-role', user.role);

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      return addCorsHeaders(response, origin);
    } catch (error) {
      console.error('Middleware session validation error:', error);
      
      // Clear invalid session and redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      const host = request.headers.get('host')?.toLowerCase() || '';
      const isHafiPortrait = host.endsWith('hafiportrait.photography') || host.endsWith('.hafiportrait.photography');
      response.cookies.set('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        ...(isHafiPortrait ? { domain: '.hafiportrait.photography' } : {}),
      });
      return addCorsHeaders(response, origin);
    }
  }

  // If accessing auth route while already authenticated
  if (isAuthRoute && sessionId) {
    try {
      const baseUrl = getBaseUrl(request);
      await validateSessionWithRetry(baseUrl, sessionId, 1); // Single retry for auth routes
      
      // Already authenticated, redirect to admin dashboard
      const response = NextResponse.redirect(new URL('/admin', request.url));
      return addCorsHeaders(response, origin);
    } catch (error) {
      // Continue to login page if validation fails
      console.warn('Auth route validation error:', error);
      
      // Clear invalid session
      const response = NextResponse.next();
      const host = request.headers.get('host')?.toLowerCase() || '';
      const isHafiPortrait = host.endsWith('hafiportrait.photography') || host.endsWith('.hafiportrait.photography');
      response.cookies.set('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        ...(isHafiPortrait ? { domain: '.hafiportrait.photography' } : {}),
      });
      return addCorsHeaders(response, origin);
    }
  }

  // For all other routes, add CORS headers and set anti-cache for /admin
  const response = NextResponse.next();
  
  // Anti-cache headers for admin pages to avoid proxy caching issues
  if (pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Vary', 'Cookie');
  }

  return addCorsHeaders(response, origin);
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes to avoid infinite loops)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};