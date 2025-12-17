import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { PhotoListApiResponse } from '@/lib/types/api';
import { Prisma } from '@prisma/client';

// GET - Get all soft-deleted photos (trash)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const event_id = searchParams.get('event_id');
    const skip = (page - 1) * limit;

    // Build where clause with proper Prisma types
    const where: Prisma.PhotoWhereInput = {
      deleted_at: { not: null },
    };

    // Filter by event if specified
    if (event_id) {
      where.event_id = event_id;
    }

    // Non-admin users can only see their own event photos
    if (user.role !== 'ADMIN') {
      where.event = {
        client_id: user.user_id, // FIXED: user.id -> user.user_id
      };
    }

    // Get total count for pagination
    const total = await prisma.photos.count({ where });

    // Fetch deleted photos with pagination
    const photos = await prisma.photos.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        deletedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        deleted_at: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform photos data to match interface
    const transformedPhotos = photos.map(photo => ({
      id: photo.id,
      filename: photo.filename,
      original_url: photo.original_url,
      thumbnail_url: photo.thumbnail_url,
      mediumUrl: photo.mediumUrl,
      file_size: photo.file_size,
      width: photo.width,
      height: photo.height,
      mime_type: photo.mime_type,
      display_order: photo.display_order,
      event_id: photo.event_id,
      uploadedAt: photo.created_at.toISOString(),
      updated_at: photo.updated_at.toISOString(),
      likes_count: photo.likes_count || 0,
      download_count: photo.download_count || 0,
      isDeleted: photo.deleted_at !== null,
      deleted_at: photo.deleted_at?.toISOString() || null,
      exif_data: photo.exif_data as Record<string, unknown> | null,
      metadata: photo.metadata as Record<string, unknown> | null,
    }));

    const response: PhotoListApiResponse = {
      success: true,
      data: {
        photos: transformedPhotos,
        total,
        hasMore: (page * limit) < total
      },
      meta: {
        page,
        limit,
        total,
        hasMore: (page * limit) < total
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trash photos' },
      { status: 500 }
    );
  }
}
