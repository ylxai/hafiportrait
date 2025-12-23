import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SlideshowSettingSchema = z.object({
  timingSeconds: z.number(),
  transitionEffect: z.string(),
  autoplay: z.boolean(),
})

const HeroSlideSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  thumbnail_url: z.string().nullable(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  display_order: z.number(),
})

// Combined response schema
const SlideshowResponseSchema = z.object({
  slides: z.array(HeroSlideSchema),
  settings: SlideshowSettingSchema
})

export async function GET() {
  // Note: request parameter not needed for this endpoint
  try {
    const dbSlides = await prisma.hero_slideshow.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      select: {
        id: true,
        image_url: true,
        thumbnail_url: true,
        title: true,
        subtitle: true,
        display_order: true
      }
    })

    const dbSettings = await prisma.slideshow_settings.findFirst()

    // Transform to match schema (camelCase for frontend)
    const slides = dbSlides.map(slide => ({
      id: slide.id,
      imageUrl: slide.image_url, // Transform snake_case to camelCase property
      thumbnail_url: slide.thumbnail_url,
      title: slide.title,
      subtitle: slide.subtitle,
      display_order: slide.display_order
    }))

    const settings = dbSettings ? {
      timingSeconds: dbSettings.timing_seconds, // Transform snake_case to camelCase
      transitionEffect: dbSettings.transition_effect,
      autoplay: dbSettings.autoplay
    } : {
      timingSeconds: 5,
      transitionEffect: 'fade',
      autoplay: true
    }

    // Validate with Zod (optional runtime check, but guarantees structure)
    // const response = SlideshowResponseSchema.parse({ slides, settings })

    return NextResponse.json({ slides, settings })
  } catch (error) {
    console.error('Slideshow API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch slideshow' }, { status: 500 })
  }
}
