import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define runtime config to avoid Edge Runtime warnings
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - EXCLUDED from middleware  
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs', // Use Node.js runtime instead of Edge
}

export function middleware(request: NextRequest) {
  // CRITICAL: Do not intercept API routes that set cookies
  const response = NextResponse.next()
  
  // Add security headers for non-API routes only
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }
  
  return response
}