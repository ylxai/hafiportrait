/**
 * Set Photo as Event Cover API
 * POST /api/admin/photos/[photoId]/set-cover - Set photo as event cover
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST - Set photo as event cover
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { photoId } = await params;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch photo with event info
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            clientId: true,
            coverPhotoId: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = user.role === 'ADMIN';
    const isOwner = photo.event.clientId === user.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to set event cover' },
        { status: 403 }
      );
    }

    // Update event cover photo
    await prisma.event.update({
      where: { id: photo.eventId },
      data: {
        coverPhotoId: photoId,
      },
    });

    // Mark photo as featured
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        isFeatured: true,
      },
    });
    return NextResponse.json({
      success: true,
      message: 'Photo set as event cover',
      eventId: photo.eventId,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
