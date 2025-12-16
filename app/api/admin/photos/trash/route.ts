import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

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

    // Build where clause
    const where: any = {
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

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trash photos' },
      { status: 500 }
    );
  }
}
