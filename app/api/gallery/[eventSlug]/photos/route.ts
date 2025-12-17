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
    const event = await prisma.events.findUnique({
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
    let orderBy: any = { display_order: 'asc' };
    if (sort === 'newest') {
      orderBy = { created_at: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { created_at: 'asc' };
    } else if (sort === 'most_liked') {
      orderBy = { likes_count: 'desc' };
    }

    // Fetch photos with pagination
    const skip = (page - 1) * limit;
    const [photos, totalCount] = await Promise.all([
      prisma.photos.findMany({
        where: {
          event_id: event.id,
          deleted_at: null,
        },
        select: {
          id: true,
          filename: true,
          original_url: true,
          thumbnail_url: true,
          thumbnail_small_url: true,
          thumbnail_medium_url: true,
          thumbnail_large_url: true,
          width: true,
          height: true,
          likes_count: true,
          caption: true,
          display_order: true,
          created_at: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.photos.count({
        where: {
          event_id: event.id,
          deleted_at: null,
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
