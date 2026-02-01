import { NextRequest, NextResponse } from 'next/server'
import Ably from 'ably'
import prisma from '@/lib/prisma'
import { getGallerySession } from '@/lib/gallery/auth'

/**
 * Ably token auth for client subscriptions.
 *
 * Scope: allow subscribing to a single event channel `event:{eventSlug}`.
 *
 * Request:
 * - GET /api/realtime/auth?eventSlug=...
 */
export async function GET(request: NextRequest) {
  const eventSlug = request.nextUrl.searchParams.get('eventSlug')
  if (!eventSlug) {
    return NextResponse.json(
      { error: 'eventSlug is required' },
      { status: 400 }
    )
  }

  const ablyKey = process.env.ABLY_API_KEY
  if (!ablyKey) {
    return NextResponse.json({ error: 'Ably not configured' }, { status: 500 })
  }

  // Get event first to get the event_id (needed for session cookie lookup)
  const event = await prisma.events.findUnique({
    where: { slug: eventSlug },
    select: { id: true, slug: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Validate guest has access to the event (cookie-based session with event_id).
  const session = await getGallerySession(event.id)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = `guest:${session.sessionId}`
  const channel = `event:${eventSlug}`

  const realtime = new Ably.Rest({ key: ablyKey })

  // Subscribe-only capability for this event channel
  const tokenRequest = await realtime.auth.createTokenRequest({
    clientId,
    capability: {
      [channel]: ['subscribe'],
    },
  })

  return NextResponse.json(tokenRequest)
}
