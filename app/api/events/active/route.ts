import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Define schema for the response item
const ActiveEventItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  date: z.date(),
  event_date: z.date().nullable(),
  location: z.string().nullable(),
  clientName: z.string().optional(),
  totalPhotos: z.number(),
  coverPhotoUrl: z.string().nullable(),
})

type ActiveEventItem = z.infer<typeof ActiveEventItemSchema>

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
    // We can't strictly type the input 'event' without complex Prisma generic types,
    // but we can enforce the return type using our Zod schema structure.
    const formattedEvents: ActiveEventItem[] = activeEvents.map((event) => ({
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

    // Runtime validation (optional but recommended for critical data)
    // z.array(ActiveEventItemSchema).parse(formattedEvents) 

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
