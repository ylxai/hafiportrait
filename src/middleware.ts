import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define runtime config to avoid Edge Runtime warnings
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
  runtime: 'nodejs', // Use Node.js runtime instead of Edge
}

export function middleware(request: NextRequest) {
  // Simple middleware without edge-incompatible APIs
  return NextResponse.next()
}