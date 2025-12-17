import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photoId = params.id

    // Check if portfolio item exists
    const portfolioItem = await prisma.portfolio_photos.findUnique({
      where: { id: photoId }
    })

    if (!portfolioItem) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    }

    // Delete the portfolio item
    await prisma.portfolio_photos.delete({
      where: { id: photoId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Portfolio item deleted successfully' 
    })
  } catch (error) {
    console.error('Portfolio DELETE error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete portfolio item' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photoId = params.id
    const body = await request.json()
    const { title, description, category, is_featured, display_order } = body

    // Update the portfolio item
    const updatedItem = await prisma.portfolio_photos.update({
      where: { id: photoId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(is_featured !== undefined && { is_featured }),
        ...(display_order !== undefined && { display_order }),
        updated_at: new Date(),
      }
    })

    return NextResponse.json({ 
      success: true, 
      photo: updatedItem 
    })
  } catch (error) {
    console.error('Portfolio PUT error:', error)
    return NextResponse.json({ 
      error: 'Failed to update portfolio item' 
    }, { status: 500 })
  }
}