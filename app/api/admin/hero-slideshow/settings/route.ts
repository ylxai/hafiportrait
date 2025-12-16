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
    const { timingSeconds, transitionEffect, autoplay } = body

    let settings = await prisma.slideshowSettings.findFirst()

    if (!settings) {
      settings = await prisma.slideshowSettings.create({
        data: {
          timingSeconds: timingSeconds ?? 5,
          transitionEffect: transitionEffect ?? 'fade',
          autoplay: autoplay ?? true
        }
      })
    } else {
      settings = await prisma.slideshowSettings.update({
        where: { id: settings.id },
        data: {
          ...(timingSeconds !== undefined && { timingSeconds }),
          ...(transitionEffect !== undefined && { transitionEffect }),
          ...(autoplay !== undefined && { autoplay })
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
