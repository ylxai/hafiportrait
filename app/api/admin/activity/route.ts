import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent activity
    const recentActivity = await prisma.events.findMany({
      take: 10,
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        name: true,
        updated_at: true,
        status: true,
        _count: {
          select: { 
            photos: true,
            comments: true 
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        recentActivity: recentActivity.map((event) => ({
          id: event.id,
          type: 'event_update',
          title: `Event "${event.name}" updated`,
          description: `${event._count.photos} photos, ${event._count.comments} comments`,
          timestamp: event.updated_at,
          status: event.status
        }))
      }
    })
  } catch (error) {
    console.error('Activity error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}