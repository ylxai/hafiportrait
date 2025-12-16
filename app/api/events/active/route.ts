import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Public endpoint to fetch active events
export async function GET() {
  try {
    const activeEvents = await prisma.event.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        photos: {
          take: 1,
          orderBy: {
            displayOrder: 'asc',
          },
          select: {
            thumbnailUrl: true,
            originalUrl: true,
          },
        },
      },
    })

    // Format events with cover photo
    const formattedEvents = activeEvents.map((event) => ({
      id: event.id,
      name: event.name,
      slug: event.slug,
      date: event.createdAt,
      coverPhoto: event.photos[0]?.thumbnailUrl || event.photos[0]?.originalUrl || null,
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
