import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { handleError } from '@/lib/errors/handler'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current date for "recent" calculations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Parallel queries for performance
    const [
      totalEvents,
      activeEvents,
      totalPhotos,
      totalMessages,
      recentViews,
      recentDownloads,
      recentLikes,
    ] = await Promise.all([
      // Total events
      prisma.events.count(),
      
      // Active events (status = ACTIVE)
      prisma.events.count({
        where: { status: 'ACTIVE' },
      }),
      
      // Total photos (non-deleted)
      prisma.photos.count({
        where: { deleted_at: null },
      }),
      
      // Total contact messages
      prisma.contact_messages.count(),
      
      // Recent views (last 7 days)
      prisma.photo_views.count({
        where: {
          viewed_at: { gte: sevenDaysAgo },
        },
      }),
      
      // Recent downloads (last 7 days)
      prisma.photo_downloads.count({
        where: {
          downloaded_at: { gte: sevenDaysAgo },
        },
      }),
      
      // Recent likes (last 7 days)
      prisma.photo_likes.count({
        where: {
          created_at: { gte: sevenDaysAgo },
        },
      }),
    ])

    return NextResponse.json({
      totalEvents,
      activeEvents,
      totalPhotos,
      totalMessages,
      recentViews,
      recentDownloads,
      recentLikes,
    })
  } catch (error) {
    return handleError(error)
  }
}
