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

    const photos = await prisma.photos.findMany({
      where: {
        event_id: id,
        deleted_at: null
      },
      orderBy: {
        display_order: 'asc'
      },
      select: {
        id: true,
        filename: true,
        thumbnail_large_url: true,
        thumbnail_medium_url: true,
        thumbnail_small_url: true,
        original_url: true,
        display_order: true,
        is_featured: true,
        created_at: true
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
