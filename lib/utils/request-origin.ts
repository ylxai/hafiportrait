import type { NextRequest } from 'next/server'

/**
 * Build a stable origin for redirects when running behind a reverse proxy.
 * Uses x-forwarded-* headers when present.
 */
export function getRequestOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host

  return `${proto}://${host}`
}
