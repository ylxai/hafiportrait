import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { handleError } from '@/lib/errors/handler'
import { DashboardApiResponse, DashboardData, RecentEventData } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    // Debug: Log request details
    // Verify authentication - FIXED: Separate 401 and 403
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Get statistics
    const [totalEvents, totalPhotos, totalPortfolioPhotos, totalMessages] =
      await Promise.all([
        prisma.events.count(),
        prisma.photos.count(),
        prisma.portfolio_photos.count(),
        prisma.contact_messages.count(),
      ])

    // Get active events count
    const activeEvents = await prisma.events.count({
      where: { status: 'ACTIVE' },
    })

    // Get new messages count
    const newMessages = await prisma.contact_messages.count({
      where: { status: 'new' },
    })

    // Get recent events
    const recentEvents = await prisma.events.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        event_date: true,
        created_at: true,
        _count: {
          select: {
            photos: true,
          },
        },
      },
    })

    // Get photo views (mock data for now - will implement analytics later)
    const totalViews = 0
    const totalDownloads = 0

    // Transform recent events to match interface
    // Note: recentEvents is strictly typed by Prisma based on the 'select' query above.
    // We use typeof recentEvents[number] to let TS know the exact shape.
    const formattedRecentEvents: RecentEventData[] = recentEvents.map((event: typeof recentEvents[number]) => ({
      id: event.id,
      name: event.name,
      date: event.event_date ? event.event_date.toISOString() : event.created_at.toISOString(),
      photosCount: event._count.photos,
      views_count: 0, // TODO: Implement analytics
      is_active: event.status === 'ACTIVE'
    }))

    const dashboardData: DashboardData = {
      statistics: {
        totalEvents,
        activeEvents,
        totalPhotos: totalPhotos + totalPortfolioPhotos,
        totalViews,
        totalDownloads,
        totalMessages,
        newMessages,
      },
      recentEvents: formattedRecentEvents,
    }

    const response: DashboardApiResponse = {
      success: true,
      data: dashboardData
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error)
  }
}
