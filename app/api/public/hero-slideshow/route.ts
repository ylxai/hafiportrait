import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Note: request parameter not needed for this endpoint
  try {
    const slides = await prisma.hero_slideshow.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      select: {
        id: true,
        imageUrl: true,
        thumbnail_url: true,
        title: true,
        subtitle: true,
        display_order: true
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
