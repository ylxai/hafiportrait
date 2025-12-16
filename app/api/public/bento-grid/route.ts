import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Note: request parameter not needed for this endpoint
  try {
    const photos = await prisma.portfolioPhoto.findMany({
      where: { isFeaturedBento: true },
      orderBy: { bentoPriority: 'desc' },
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        thumbnailUrl: true,
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
