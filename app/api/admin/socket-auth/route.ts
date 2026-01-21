import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin socket auth helper.
 * Returns JWT token from httpOnly cookie so admin UI can authenticate to standalone Socket.IO server.
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('auth-token')
  const token = cookie?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ token })
}
