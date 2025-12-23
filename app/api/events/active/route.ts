import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Public endpoint to fetch active events
export async function GET() {
  try {
    const activeEvents = await prisma.events.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        created_at: true,
        event_date: true,
        location: true,
        users: {
          select: {
            name: true,
          }
        },
        _count: {
          select: {
            photos: true,
          }
        },
        photos: {
          take: 1,
          orderBy: {
            display_order: 'asc',
          },
          select: {
            thumbnail_url: true,
            original_url: true,
          },
        },
      },
    })

    // Format events with cover photo
    const formattedEvents = activeEvents.map((event) => ({
      id: event.id,
      name: event.name,
      slug: event.slug,
      date: event.created_at,
      event_date: event.event_date,
      location: event.location,
      clientName: event.users?.name,
      totalPhotos: event._count.photos,
      coverPhotoUrl: event.photos[0]?.thumbnail_url || event.photos[0]?.original_url || null,
    }))

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      count: formattedEvents.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch active events',
      },
      { status: 500 }
    )
  }
}
