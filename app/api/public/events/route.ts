import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch active events with cover photos
    const events = await prisma.event.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        slug: true,
        name: true,
        eventDate: true,
        createdAt: true,
        photos: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            thumbnailLargeUrl: true,
            originalUrl: true
          },
          orderBy: {
            displayOrder: 'asc'
          },
          take: 1
        },
        _count: {
          select: {
            photos: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        eventDate: 'desc'
      },
      take: 10
    })

    // Transform data for the frontend
    const transformedEvents = events.map(event => {
      // Get cover photo - use first photo if no coverPhotoId
      const coverPhoto = event.photos[0]

      // Determine if event is live (within 7 days of event date)
      const isLive = event.eventDate 
        ? new Date().getTime() - new Date(event.eventDate).getTime() <= 7 * 24 * 60 * 60 * 1000
        : false

      return {
        id: event.id,
        slug: event.slug,
        name: event.name,
        coupleName: event.name,
        eventDate: event.eventDate || event.createdAt,
        status: isLive ? 'LIVE' : 'COMPLETED',
        coverPhotoUrl: coverPhoto 
          ? (coverPhoto.thumbnailLargeUrl || coverPhoto.originalUrl)
          : 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
        photoCount: event._count.photos
      }
    })

    return NextResponse.json({ events: transformedEvents })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
