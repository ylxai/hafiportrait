import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bentoPhotos = await prisma.portfolio_photos.findMany({
      where: { is_featured_bento: true },
      orderBy: { bento_priority: 'desc' }
    })

    return NextResponse.json(bentoPhotos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bento grid' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photo_id, bentoSize, bentoPriority } = body

    const photo = await prisma.portfolio_photos.update({
      where: { id: photo_id },
      data: {
        is_featured_bento: true,
        bento_size: bentoSize || 'medium',
        bento_priority: bentoPriority || 0
      }
    })

    return NextResponse.json(photo)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bento grid' }, { status: 500 })
  }
}
