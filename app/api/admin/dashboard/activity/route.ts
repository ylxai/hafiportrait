import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { handleError } from '@/lib/errors/handler'

interface Activity {
  id: string
  type: 'event' | 'photo' | 'message' | 'user'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activities: Activity[] = []

    // Fetch recent events (last 5)
    const recentEvents = await prisma.events.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
      },
    })

    recentEvents.forEach((event: any) => {
      activities.push({
        id: `event-${event.id}`,
        type: 'event',
        title: 'Event Created',
        description: `${event.name} (${event.status})`,
        timestamp: event.created_at.toISOString(),
        metadata: { eventId: event.id, eventName: event.name },
      })
    })

    // Fetch recent photo uploads (grouped by event, last 5 events with new photos)
    const recentPhotos = await prisma.photos.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      where: { deleted_at: null },
      select: {
        id: true,
        event_id: true,
        created_at: true,
        events: {
          select: {
            name: true,
          },
        },
      },
    })

    // Group photos by event and date (same day = 1 activity)
    const photoGroups = new Map<string, { count: number; event: string; timestamp: Date; eventId: string }>()
    recentPhotos.forEach((photo: any) => {
      const dateKey = photo.created_at.toISOString().split('T')[0] // YYYY-MM-DD
      const groupKey = `${photo.event_id}-${dateKey}`
      
      if (!photoGroups.has(groupKey)) {
        photoGroups.set(groupKey, {
          count: 1,
          event: photo.events?.name || 'Unknown Event',
          timestamp: photo.created_at,
          eventId: photo.event_id,
        })
      } else {
        const group = photoGroups.get(groupKey)!
        group.count += 1
      }
    })

    // Convert photo groups to activities
    Array.from(photoGroups.entries()).slice(0, 5).forEach(([key, group]) => {
      activities.push({
        id: `photo-${key}`,
        type: 'photo',
        title: 'Photos Uploaded',
        description: `${group.count} photo${group.count > 1 ? 's' : ''} added to ${group.event}`,
        timestamp: group.timestamp.toISOString(),
        metadata: { eventId: group.eventId, photoCount: group.count },
      })
    })

    // Fetch recent messages (last 5)
    const recentMessages = await prisma.contact_messages.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    })

    recentMessages.forEach((message: any) => {
      activities.push({
        id: `message-${message.id}`,
        type: 'message',
        title: 'New Message',
        description: `From ${message.name} (${message.email})`,
        timestamp: message.created_at.toISOString(),
        metadata: { messageId: message.id },
      })
    })

    // Fetch recent guestbook messages (last 5)
    const recentGuestbookMessages = await prisma.comments.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      where: {
        photo_id: null, // Guestbook messages (not photo comments)
      },
      select: {
        id: true,
        guest_name: true,
        message: true,
        created_at: true,
        events: {
          select: {
            name: true,
          },
        },
      },
    })

    recentGuestbookMessages.forEach((msg: any) => {
      const preview = msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message
      activities.push({
        id: `guestbook-${msg.id}`,
        type: 'message',
        title: 'New Guestbook Message',
        description: `${msg.guest_name} on ${msg.events?.name || 'event'}: "${preview}"`,
        timestamp: msg.created_at.toISOString(),
        metadata: { messageId: msg.id, eventName: msg.events?.name },
      })
    })

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Return top 10
    return NextResponse.json(activities.slice(0, 10))
  } catch (error) {
    return handleError(error)
  }
}
