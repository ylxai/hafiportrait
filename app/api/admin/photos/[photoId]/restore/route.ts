import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ photoId: string }>;
}

// POST - Restore soft-deleted photo
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { photoId } = await params;
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            clientId: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check authorization - FIXED: user.id -> user.userId
    if (user.role !== 'ADMIN' && photo.event.clientId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if photo is soft-deleted
    if (!photo.deletedAt) {
      return NextResponse.json(
        { error: 'Photo is not deleted' },
        { status: 400 }
      );
    }

    // Restore photo - clear deletedAt and deletedById
    const restoredPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        deletedAt: null,
        deletedById: null,
      },
    });

    // Log audit trail - FIXED: user.id -> user.userId

    return NextResponse.json({
      success: true,
      message: 'Photo restored successfully',
      photo: restoredPhoto,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to restore photo' },
      { status: 500 }
    );
  }
}
