import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Note: request parameter not needed for this endpoint
  try {
    const photos = await prisma.portfolio_photos.findMany({
      where: { is_featuredBento: true },
      orderBy: { bentoPriority: 'desc' },
      select: {
        id: true,
        filename: true,
        original_url: true,
        thumbnail_url: true,
        category: true,
        bentoSize: true,
        bentoPriority: true
      },
      take: 12
    })

    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bento grid' }, { status: 500 })
  }
}
