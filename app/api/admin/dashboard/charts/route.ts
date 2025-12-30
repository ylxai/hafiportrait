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

    // Get last 30 days data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch photos grouped by date (uploads trend)
    const photosByDate = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM photos
      WHERE created_at >= ${thirtyDaysAgo}
        AND deleted_at IS NULL
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Fetch views grouped by date
    const viewsByDate = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as count
      FROM photo_views
      WHERE viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(viewed_at)
      ORDER BY date ASC
    `

    // Fetch downloads grouped by date
    const downloadsByDate = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(downloaded_at) as date,
        COUNT(*) as count
      FROM photo_downloads
      WHERE downloaded_at >= ${thirtyDaysAgo}
      GROUP BY DATE(downloaded_at)
      ORDER BY date ASC
    `

    // Fetch likes grouped by date
    const likesByDate = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM photo_likes
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Create a complete date range (last 30 days)
    const dateRange: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      if (dateStr) {
        dateRange.push(dateStr)
      }
    }

    // Map data to date range (fill missing dates with 0)
    const uploadsMap = new Map(photosByDate.map((item: any) => [item.date.toString().split('T')[0], Number(item.count)]))
    const viewsMap = new Map(viewsByDate.map((item: any) => [item.date.toString().split('T')[0], Number(item.count)]))
    const downloadsMap = new Map(downloadsByDate.map((item: any) => [item.date.toString().split('T')[0], Number(item.count)]))
    const likesMap = new Map(likesByDate.map((item: any) => [item.date.toString().split('T')[0], Number(item.count)]))

    // Format data for charts
    const uploadsTrend = dateRange.map(date => ({
      name: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      uploads: uploadsMap.get(date) || 0,
    }))

    const engagementTrend = dateRange.map(date => ({
      name: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      views: viewsMap.get(date) || 0,
      downloads: downloadsMap.get(date) || 0,
      likes: likesMap.get(date) || 0,
    }))

    // Top 5 events by engagement (views + likes + downloads)
    const topEvents = await prisma.$queryRaw<Array<{ 
      event_id: string; 
      event_name: string; 
      views: bigint; 
      downloads: bigint; 
      likes: bigint 
    }>>`
      SELECT 
        e.id as event_id,
        e.name as event_name,
        COALESCE(v.views, 0) as views,
        COALESCE(d.downloads, 0) as downloads,
        COALESCE(l.likes, 0) as likes
      FROM events e
      LEFT JOIN (
        SELECT p.event_id, COUNT(*) as views
        FROM photo_views pv
        JOIN photos p ON pv.photo_id = p.id
        GROUP BY p.event_id
      ) v ON e.id = v.event_id
      LEFT JOIN (
        SELECT p.event_id, COUNT(*) as downloads
        FROM photo_downloads pd
        JOIN photos p ON pd.photo_id = p.id
        GROUP BY p.event_id
      ) d ON e.id = d.event_id
      LEFT JOIN (
        SELECT p.event_id, COUNT(*) as likes
        FROM photo_likes pl
        JOIN photos p ON pl.photo_id = p.id
        GROUP BY p.event_id
      ) l ON e.id = l.event_id
      WHERE e.status = 'ACTIVE'
      ORDER BY (COALESCE(v.views, 0) + COALESCE(d.downloads, 0) + COALESCE(l.likes, 0)) DESC
      LIMIT 5
    `

    return NextResponse.json({
      uploadsTrend,
      engagementTrend,
      topEvents: topEvents.map((event: any) => ({
        name: event.event_name,
        views: Number(event.views),
        downloads: Number(event.downloads),
        likes: Number(event.likes),
      })),
    })
  } catch (error) {
    console.error('Dashboard charts error:', error)
    return handleError(error)
  }
}
