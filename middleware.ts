import { NextRequest, NextResponse } from 'next/server'

/**
 * Lightweight middleware untuk route protection
 * Hanya check token existence, verification dilakukan di API handlers
 */

// Routes yang memerlukan authentication
const protectedRoutes = ['/admin/dashboard', '/admin/portfolio', '/admin/messages']

// Public routes
const publicRoutes = ['/', '/admin/login', '/api/auth', '/api/health', '/api/contact', '/api/portfolio', '/api/events']

/**
 * Check apakah path merupakan protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Check apakah path merupakan public route atau static
 */
function isPublicOrStatic(pathname: string): boolean {
  // Static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/favicon.ico') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return true
  }

  // Public routes
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(route))
}

/**
 * Extract token dari request
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookie
  const token = request.cookies.get('auth-token')?.value
  return token || null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware untuk public routes dan static files
  if (isPublicOrStatic(pathname)) {
    return NextResponse.next()
  }

  // Check jika route memerlukan authentication
  if (isProtectedRoute(pathname)) {
    const token = getTokenFromRequest(request)

    if (!token) {
      // Redirect ke login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Token exists, let it through
    // Verification akan dilakukan di API route handlers
    return NextResponse.next()
  }

  return NextResponse.next()
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
