/**
 * Set Photo as Event Cover API
 * POST /api/admin/photos/[photo_id]/set-cover - Set photo as event cover
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST - Set photo as event cover
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photo_id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { photo_id } = await params;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch photo with event info
    const photo = await prisma.photos.findUnique({
      where: { id: photo_id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            client_id: true,
            cover_photo_id: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = user.role === 'ADMIN';
    const isOwner = photo.event.client_id === user.user_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to set event cover' },
        { status: 403 }
      );
    }

    // Update event cover photo
    await prisma.events.update({
      where: { id: photo.event_id },
      data: {
        cover_photo_id: photo_id,
      },
    });

    // Mark photo as featured
    await prisma.photos.update({
      where: { id: photo_id },
      data: {
        is_featured: true,
      },
    });
    return NextResponse.json({
      success: true,
      message: 'Photo set as event cover',
      event_id: photo.event_id,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
