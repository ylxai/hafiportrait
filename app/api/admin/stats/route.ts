import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get basic stats
    const [
      totalEvents,
      totalPhotos,
      totalViews,
      recentEvents
    ] = await Promise.all([
      prisma.events.count(),
      prisma.photos.count(),
      prisma.photos.aggregate({ _sum: { view_count: true } }),
      prisma.events.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { photos: true }
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalEvents,
        totalPhotos,
        totalViews: totalViews._sum.view_count || 0,
        recentEvents
      }
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}