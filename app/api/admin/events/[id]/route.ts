import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    const event = await prisma.events.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        access_code: true,
        qr_code_url: true,
        storage_duration_days: true,
        status: true,
        event_date: true,
        client_email: true,
        client_phone: true,
        description: true,
        location: true,
        cover_photo_id: true,
        created_at: true,
        updated_at: true,
        expires_at: true,
        client_id: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
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
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Map users relation to client for API compatibility
    const { users, ...eventData } = event
    const responseData = {
      ...eventData,
      client: users
    }

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { cover_photo_id, coupleName, ...otherFields } = body

    const updateData: Record<string, unknown> = { ...otherFields }

    if (cover_photo_id !== undefined) {
      updateData.cover_photo_id = cover_photo_id
    }



    const updatedEvent = await prisma.events.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    // Delete event with cascade (soft delete photos first)
    // 1. Soft delete all photos in this event
    await prisma.photos.updateMany({
      where: { 
        event_id: id,
        deleted_at: null // Only soft-delete non-deleted photos
      },
      data: {
        deleted_at: new Date(),
        deleted_by: user.user_id,
      },
    })

    // 2. Delete event
    await prisma.events.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
