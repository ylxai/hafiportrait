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
    const since = searchParams.get('since');
    const sinceId = searchParams.get('since_id');

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
    // For stable ordering, always include `id` as a tie-breaker for created_at sorting.
    let orderBy: Array<Record<string, 'asc' | 'desc'>> | Record<string, 'asc' | 'desc'> = {
      display_order: 'asc',
    };
    if (sort === 'newest') {
      orderBy = [{ created_at: 'desc' }, { id: 'desc' }];
    } else if (sort === 'oldest') {
      orderBy = [{ created_at: 'asc' }, { id: 'asc' }];
    } else if (sort === 'most_liked') {
      orderBy = [{ likes_count: 'desc' }, { id: 'desc' }];
    }

    // Phase 3 (hardening): delta fetch cursor uses (created_at, id) to avoid misses when timestamps tie.
    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        return NextResponse.json({ error: 'Invalid since parameter' }, { status: 400 });
      }

      // Cursor semantics:
      // - For newest-first: return items newer than cursor; when created_at ties, use id as tie-breaker.
      // - For oldest-first: the cursor is still based on the newest item the client has seen; in practice we use newest-first for realtime.
      const cursorFilter = sinceId
        ? {
            OR: [
              { created_at: { gt: sinceDate } },
              { created_at: sinceDate, id: { gt: sinceId } },
            ],
          }
        : { created_at: { gt: sinceDate } };

      const photos = await prisma.photos.findMany({
        where: {
          event_id: event.id,
          deleted_at: null,
          ...cursorFilter,
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
          download_count: true,
          views_count: true,
          caption: true,
          display_order: true,
          is_featured: true,
          created_at: true,
        },
        orderBy,
        take: limit,
      });

      return NextResponse.json({
        photos,
        hasMore: false,
        total: photos.length,
        page: 1,
        limit,
      });
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
          download_count: true, // Analytics
          views_count: true, // Analytics
          caption: true,
          display_order: true,
          is_featured: true, // For featured photos
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
