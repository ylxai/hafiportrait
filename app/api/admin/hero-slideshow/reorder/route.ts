import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slides } = body

    await prisma.$transaction(
      slides.map((slide: { id: string; displayOrder: number }) =>
        prisma.heroSlideshow.update({
          where: { id: slide.id },
          data: { displayOrder: slide.displayOrder }
        })
      )
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder slides' }, { status: 500 })
  }
}
