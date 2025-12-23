import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for public event data
const PublicEventSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  coupleName: z.string(),
  event_date: z.date(),
  status: z.enum(['LIVE', 'COMPLETED']),
  coverPhotoUrl: z.string(),
  photoCount: z.number(),
})

type PublicEventItem = z.infer<typeof PublicEventSchema>

export async function GET() {
  try {
    // Fetch active events with cover photos
    const events = await prisma.events.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        slug: true,
        name: true,
        event_date: true,
        created_at: true,
        photos: {
          where: {
            deleted_at: null
          },
          select: {
            id: true,
            thumbnail_large_url: true,
            original_url: true
          },
          orderBy: {
            display_order: 'asc'
          },
          take: 1
        },
        _count: {
          select: {
            photos: {
              where: {
                deleted_at: null
              }
            }
          }
        }
      },
      orderBy: {
        event_date: 'desc'
      },
      take: 10
    })

    // Transform data for the frontend
    const transformedEvents: PublicEventItem[] = events.map((event: typeof events[number]) => {
      // Get cover photo - use first photo if no cover_photo_id
      const coverPhoto = event.photos[0]

      // Determine if event is live (within 7 days of event date)
      const isLive = event.event_date 
        ? new Date().getTime() - new Date(event.event_date).getTime() <= 7 * 24 * 60 * 60 * 1000
        : false

      return {
        id: event.id,
        slug: event.slug,
        name: event.name,
        coupleName: event.name,
        event_date: event.event_date || event.created_at,
        status: isLive ? 'LIVE' : 'COMPLETED',
        coverPhotoUrl: coverPhoto 
          ? (coverPhoto.thumbnail_large_url || coverPhoto.original_url)
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
