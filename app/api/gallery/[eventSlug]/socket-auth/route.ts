import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getGallerySession } from '@/lib/gallery/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await params

    const event = await prisma.events.findUnique({
      where: { slug: eventSlug },
      select: { id: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const session = await getGallerySession(event.id)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Socket server expects guestSessionId + eventId (currently treated as eventSlug)
    return NextResponse.json({
      guestSessionId: session.sessionId,
      // backward compatible
      eventId: eventSlug,
      // preferred
      eventSlug,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to get socket auth' },
      { status: 500 }
    )
  }
}
