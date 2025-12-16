import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getGallerySession } from '@/lib/gallery/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sort = searchParams.get('sort') || 'newest';

    // Find event
    const event = await prisma.event.findUnique({
      where: { slug: eventSlug },
      select: { id: true, status: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check gallery access
    const session = await getGallerySession(event.id);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build order by clause
    let orderBy: any = { displayOrder: 'asc' };
    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'most_liked') {
      orderBy = { likesCount: 'desc' };
    }

    // Fetch photos with pagination
    const skip = (page - 1) * limit;
    const [photos, totalCount] = await Promise.all([
      prisma.photo.findMany({
        where: {
          eventId: event.id,
          deletedAt: null,
        },
        select: {
          id: true,
          filename: true,
          originalUrl: true,
          thumbnailUrl: true,
          thumbnailSmallUrl: true,
          thumbnailMediumUrl: true,
          thumbnailLargeUrl: true,
          width: true,
          height: true,
          likesCount: true,
          caption: true,
          displayOrder: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.photo.count({
        where: {
          eventId: event.id,
          deletedAt: null,
        },
      }),
    ]);

    const hasMore = skip + photos.length < totalCount;

    return NextResponse.json({
      photos,
      hasMore,
      total: totalCount,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
