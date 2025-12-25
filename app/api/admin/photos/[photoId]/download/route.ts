/**
 * Download Photo API
 * GET /api/admin/photos/[photoId]/download - Download original photo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ photoId: string }>;
}

/**
 * GET - Download original photo
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { photoId } = await params;

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch photo with event info
    const photo = await prisma.photos.findUnique({
      where: { id: photoId },
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

    // Check permissions - Admin or event owner
    const isAdmin = user.role === 'ADMIN';
    const isOwner = photo.events?.client_id === user.user_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to download this photo' },
        { status: 403 }
      );
    }

    // Increment download count
    await prisma.photos.update({
      where: { id: photoId },
      data: {
        download_count: {
          increment: 1,
        },
      },
    });

    // Return photo info for client-side download
    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        filename: photo.filename,
        original_url: photo.original_url,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download photo' },
      { status: 500 }
    );
  }
}
