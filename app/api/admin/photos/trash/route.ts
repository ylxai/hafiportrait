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
    const eventId = searchParams.get('eventId');
    const skip = (page - 1) * limit;

    // Build where clause with proper Prisma types
    const where: Prisma.PhotoWhereInput = {
      deletedAt: { not: null },
    };

    // Filter by event if specified
    if (eventId) {
      where.eventId = eventId;
    }

    // Non-admin users can only see their own event photos
    if (user.role !== 'ADMIN') {
      where.event = {
        clientId: user.userId, // FIXED: user.id -> user.userId
      };
    }

    // Get total count for pagination
    const total = await prisma.photo.count({ where });

    // Fetch deleted photos with pagination
    const photos = await prisma.photo.findMany({
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
        deletedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform photos data to match interface
    const transformedPhotos = photos.map(photo => ({
      id: photo.id,
      filename: photo.filename,
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      mediumUrl: photo.mediumUrl,
      fileSize: photo.fileSize,
      width: photo.width,
      height: photo.height,
      mimeType: photo.mimeType,
      displayOrder: photo.displayOrder,
      eventId: photo.eventId,
      uploadedAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
      likesCount: photo.likesCount || 0,
      downloadCount: photo.downloadCount || 0,
      isDeleted: photo.deletedAt !== null,
      deletedAt: photo.deletedAt?.toISOString() || null,
      exifData: photo.exifData as Record<string, unknown> | null,
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
