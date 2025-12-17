import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { timing_seconds, transition_effect, autoplay } = body

    let settings = await prisma.slideshow_settings.findFirst()

    if (!settings) {
      settings = await prisma.slideshow_settings.create({
        data: {
          id: crypto.randomUUID(),
          timing_seconds: timing_seconds || 5,
          transition_effect: transition_effect || 'fade',
          autoplay: autoplay !== undefined ? autoplay : true,
          updated_at: new Date()
        }
      })
    } else {
      settings = await prisma.slideshow_settings.update({
        where: { id: settings.id },
        data: {
          timing_seconds,
          transition_effect,
          autoplay,
          updated_at: new Date()
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
