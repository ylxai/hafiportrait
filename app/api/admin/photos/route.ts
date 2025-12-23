import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const eventId = searchParams.get('event_id')
    const deleted = searchParams.get('deleted') === 'true'

    // Build where clause
    const where: any = {}
    
    if (eventId) {
      where.event_id = eventId
    }
    
    if (deleted) {
      where.deleted_at = { not: null }
    } else {
      where.deleted_at = null
    }

    // Get photos with pagination
    const photos = await prisma.photos.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { created_at: 'desc' },
      include: {
        events: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    // Transform photos data
    const transformedPhotos = photos.map((photo) => ({
      id: photo.id,
      filename: photo.filename,
      original_url: photo.original_url,
      thumbnail_url: photo.thumbnail_url,
      file_size: photo.file_size,
      width: photo.width,
      height: photo.height,
      mime_type: photo.mime_type,
      event_id: photo.event_id,
      event_name: photo.events?.name || null,
      likes_count: photo.likes_count || 0,
      view_count: photo.views_count || 0,
      created_at: photo.created_at,
      updated_at: photo.updated_at,
      deleted_at: photo.deleted_at
    }))

    return NextResponse.json(transformedPhotos)
  } catch (error) {
    console.error('Photos API error:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const photoIds = searchParams.get('ids')?.split(',')
    
    if (!photoIds || photoIds.length === 0) {
      return NextResponse.json({ error: 'Photo IDs required' }, { status: 400 })
    }

    // Soft delete photos
    await prisma.photos.updateMany({
      where: {
        id: { in: photoIds }
      },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user.user_id
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `${photoIds.length} photos deleted successfully` 
    })
  } catch (error) {
    console.error('Photos DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete photos' }, { status: 500 })
  }
}