import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { cleanupDeletedPhotos } from '@/lib/utils/photo-cleanup'

// POST - Manual cleanup of old deleted photos
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can trigger manual cleanup
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { daysOld = 30 } = body

    const stats = await cleanupDeletedPhotos(daysOld)

    return NextResponse.json({
      success: true,
      message: `Cleanup completed`,
      stats,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cleanup photos' },
      { status: 500 }
    )
  }
}
