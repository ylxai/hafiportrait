import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Note: request parameter not needed for this endpoint
  try {
    const slides = await prisma.heroSlideshow.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        title: true,
        subtitle: true,
        displayOrder: true
      }
    })

    const settings = await prisma.slideshowSettings.findFirst()

    return NextResponse.json({
      slides,
      settings: settings || {
        timingSeconds: 5,
        transitionEffect: 'fade',
        autoplay: true
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch slideshow' }, { status: 500 })
  }
}
