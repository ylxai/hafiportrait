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

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        accessCode: true,
        qrCodeUrl: true,
        storageDurationDays: true,
        status: true,
        eventDate: true,
        clientEmail: true,
        clientPhone: true,
        description: true,
        location: true,
        coverPhotoId: true,
        coverPhotoUrl: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        displayStatus: true,
        clientId: true,
        client: {
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
                deletedAt: null
              }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
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
    const { coverPhotoId, coupleName, displayStatus, ...otherFields } = body

    const updateData: any = { ...otherFields }
    
    if (coverPhotoId !== undefined) {
      updateData.coverPhotoId = coverPhotoId
    }
    
    if (displayStatus !== undefined) {
      updateData.displayStatus = displayStatus
    }

    const updatedEvent = await prisma.event.update({
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

    await prisma.event.delete({
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
