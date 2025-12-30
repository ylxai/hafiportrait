import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { handleError } from '@/lib/errors/handler'
import { Prisma } from '@prisma/client'

// GET - List guestbook messages (event-level comments: photo_id IS NULL)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const eventId = searchParams.get('event_id')
    const q = searchParams.get('q')

    const where: Prisma.commentsWhereInput = {
      photo_id: null,
    }

    if (eventId && eventId !== 'all') where.event_id = eventId
    if (q) {
      where.OR = [
        { guest_name: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.comments.count({ where })
    const items = await prisma.comments.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        guest_name: true,
        email: true,
        message: true,
        relationship: true,
        attendance_status: true,
        created_at: true,
        event_id: true,
        events: { select: { name: true, slug: true } },
      },
    })

    return NextResponse.json({
      messages: items.map((c) => ({
        ...c,
        event_name: c.events?.name,
        event_slug: c.events?.slug,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
