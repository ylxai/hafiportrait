import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photos = await prisma.portfolio_photos.findMany({
      orderBy: { display_order: 'desc' }
    })

    return NextResponse.json({ photos })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category } = body

    const photo = await prisma.portfolio_photos.create({
      data: {
        title: title || 'Untitled',
        description: description || '',
        category: category || 'wedding',
        display_order: 0,
        created_at: new Date(),
        updated_at: new Date(),
      }
    })

    return NextResponse.json({ success: true, photo })
  } catch (error) {
    console.error('Portfolio POST error:', error)
    return NextResponse.json({ error: 'Failed to create portfolio item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const photoId = url.searchParams.get('id')
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 })
    }

    await prisma.portfolio_photos.delete({
      where: { id: photoId }
    })

    return NextResponse.json({ success: true, message: 'Portfolio item deleted' })
  } catch (error) {
    console.error('Portfolio DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete portfolio item' }, { status: 500 })
  }
}
