import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Note: request parameter not needed for this endpoint
  try {
    const photos = await prisma.portfolio_photos.findMany({
      where: { is_featured_bento: true },
      orderBy: { bento_priority: 'desc' },
      select: {
        id: true,
        filename: true,
        original_url: true,
        thumbnail_url: true,
        category: true,
        bento_size: true,
        bento_priority: true
      },
      take: 12
    })

    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bento grid' }, { status: 500 })
  }
}
