import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Block common bot attack patterns
  const blockedPaths = [
    '/wp-admin',
    '/wp-login',
    '/wp-content',
    '/wp-includes',
    '/xmlrpc.php',
    '/phpmyadmin',
    '/phpMyAdmin',
    '/admin/config.php',
    '/administrator',
    '/.env',
    '/.git',
    '/config.php',
    '/setup.php',
    '/install.php'
  ];
  
  // Check if path starts with any blocked pattern
  const isBlocked = blockedPaths.some(blocked => 
    pathname.startsWith(blocked) || pathname.includes(blocked)
  );
  
  if (isBlocked) {
    // Return 404 immediately without logging
    return new NextResponse(null, { 
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache 404 for 1 hour
      }
    });
  }
  
  // Continue with normal request processing
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};