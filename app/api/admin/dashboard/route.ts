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
        prisma.event.count(),
        prisma.photo.count(),
        prisma.portfolioPhoto.count(),
        prisma.contactMessage.count(),
      ])

    // Get active events count
    const activeEvents = await prisma.event.count({
      where: { status: 'ACTIVE' },
    })

    // Get new messages count
    const newMessages = await prisma.contactMessage.count({
      where: { status: 'new' },
    })

    // Get recent events
    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        eventDate: true,
        createdAt: true,
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
    const formattedRecentEvents: RecentEventData[] = recentEvents.map(event => ({
      id: event.id,
      name: event.name,
      date: event.eventDate || event.createdAt.toISOString(),
      photosCount: event._count.photos,
      viewsCount: 0, // TODO: Implement analytics
      isActive: event.status === 'ACTIVE'
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
