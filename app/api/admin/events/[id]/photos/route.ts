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

    const photos = await prisma.photo.findMany({
      where: {
        eventId: id,
        deletedAt: null
      },
      orderBy: {
        displayOrder: 'asc'
      },
      select: {
        id: true,
        filename: true,
        thumbnailLargeUrl: true,
        thumbnailMediumUrl: true,
        thumbnailSmallUrl: true,
        originalUrl: true,
        displayOrder: true,
        isFeatured: true,
        createdAt: true
      }
    })

    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}
