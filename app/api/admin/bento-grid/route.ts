import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bentoPhotos = await prisma.portfolioPhoto.findMany({
      where: { isFeaturedBento: true },
      orderBy: { bentoPriority: 'desc' }
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
    const { photoId, bentoSize, bentoPriority } = body

    const photo = await prisma.portfolioPhoto.update({
      where: { id: photoId },
      data: {
        isFeaturedBento: true,
        bentoSize: bentoSize || 'medium',
        bentoPriority: bentoPriority || 0
      }
    })

    return NextResponse.json(photo)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bento grid' }, { status: 500 })
  }
}
