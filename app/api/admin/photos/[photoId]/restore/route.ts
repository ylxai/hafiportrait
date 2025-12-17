import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ photo_id: string }>;
}

// POST - Restore soft-deleted photo
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { photo_id } = await params;

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photo = await prisma.photos.findUnique({
      where: { id: photo_id },
      include: {
        events: {
          select: {
            id: true,
            name: true,
            client_id: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check authorization - FIXED: user.id -> user.user_id
    if (user.role !== 'ADMIN' && photo.events?.client_id !== user.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if photo is soft-deleted
    if (!photo.deleted_at) {
      return NextResponse.json(
        { error: 'Photo is not deleted' },
        { status: 400 }
      );
    }

    // Restore photo - clear deleted_at and deleted_by_id
    const restoredPhoto = await prisma.photos.update({
      where: { id: photo_id },
      data: {
        deleted_at: null,
        deleted_by_id: null,
      },
    });

    // Log audit trail - FIXED: user.id -> user.user_id

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
