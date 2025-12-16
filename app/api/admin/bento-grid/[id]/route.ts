import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { bentoSize, bentoPriority, isFeaturedBento } = body

    const photo = await prisma.portfolioPhoto.update({
      where: { id },
      data: {
        ...(bentoSize !== undefined && { bentoSize }),
        ...(bentoPriority !== undefined && { bentoPriority }),
        ...(isFeaturedBento !== undefined && { isFeaturedBento })
      }
    })

    return NextResponse.json(photo)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.portfolioPhoto.update({
      where: { id },
      data: { isFeaturedBento: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove from bento grid' }, { status: 500 })
  }
}
