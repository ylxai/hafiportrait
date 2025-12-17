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
    const { bentoSize, bentoPriority, is_featured_bento } = body

    // Convert property names for Prisma
    const updateData: any = {}
    if (bentoSize !== undefined) updateData.bento_size = bentoSize
    if (bentoPriority !== undefined) updateData.bento_priority = bentoPriority
    if (is_featured_bento !== undefined) updateData.is_featured_bento = is_featured_bento

    const photo = await prisma.portfolio_photos.update({
      where: { id },
      data: updateData
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

    await prisma.portfolio_photos.update({
      where: { id },
      data: { is_featured_bento: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove from bento grid' }, { status: 500 })
  }
}
