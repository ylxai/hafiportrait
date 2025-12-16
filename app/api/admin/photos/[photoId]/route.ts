import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ photoId: string }>;
}

// GET - Get photo details
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

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            clientId: true,
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

    // Check authorization - FIXED: user.id -> user.userId
    if (user.role !== 'ADMIN' && photo.event.clientId !== user.userId) {
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

// PATCH - Update photo details (caption, isFeatured, etc.)
export async function PATCH(
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

    const body = await request.json();
    const { caption, isFeatured } = body;

    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        ...(caption !== undefined && { caption }),
        ...(isFeatured !== undefined && { isFeatured }),
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

    // Check if already deleted
    if (photo.deletedAt) {
      return NextResponse.json(
        { error: 'Photo is already deleted' },
        { status: 400 }
      );
    }

    // Soft delete - set deletedAt timestamp and deletedBy - FIXED: user.id -> user.userId
    const deletedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        deletedAt: new Date(),
        deletedById: user.userId,
      },
    });

    // Log audit trail - FIXED: user.id -> user.userId

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
