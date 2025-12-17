import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ photo_id: string }>;
}

// GET - Get photo details
export async function GET(
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
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            client_id: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check authorization - FIXED: user.id -> user.user_id
    if (user.role !== 'ADMIN' && photo.event.client_id !== user.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ photo });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}

// PATCH - Update photo details (caption, is_featured, etc.)
export async function PATCH(
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
        event: {
          select: {
            client_id: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check authorization - FIXED: user.id -> user.user_id
    if (user.role !== 'ADMIN' && photo.event.client_id !== user.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { caption, is_featured } = body;

    const updatedPhoto = await prisma.photos.update({
      where: { id: photo_id },
      data: {
        ...(caption !== undefined && { caption }),
        ...(is_featured !== undefined && { is_featured }),
      },
    });

    return NextResponse.json({ photo: updatedPhoto });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete photo
export async function DELETE(
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
        event: {
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
    if (user.role !== 'ADMIN' && photo.event.client_id !== user.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already deleted
    if (photo.deleted_at) {
      return NextResponse.json(
        { error: 'Photo is already deleted' },
        { status: 400 }
      );
    }

    // Soft delete - set deleted_at timestamp and deletedBy - FIXED: user.id -> user.user_id
    const deletedPhoto = await prisma.photos.update({
      where: { id: photo_id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user.user_id,
      },
    });

    // Log audit trail - FIXED: user.id -> user.user_id

    return NextResponse.json({
      success: true,
      message: 'Photo moved to trash',
      photo: deletedPhoto,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
