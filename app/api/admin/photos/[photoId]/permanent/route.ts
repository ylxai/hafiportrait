import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { del } from '@vercel/blob';

interface RouteParams {
  params: Promise<{ photoId: string }>;
}

// DELETE - Permanently delete photo (hard delete)
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

    // Only ADMIN can permanently delete
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Storage cleanup - delete all files
    const filesToDelete = [
      photo.originalUrl,
      photo.thumbnailSmallUrl,
      photo.thumbnailMediumUrl,
      photo.thumbnailLargeUrl,
      photo.thumbnailUrl, // Legacy field
    ].filter(Boolean) as string[];

    let deletedFiles = 0;
    let failedFiles = 0;

    // Delete files from Vercel Blob storage
    for (const fileUrl of filesToDelete) {
      try {
        await del(fileUrl);
        deletedFiles++;
      } catch (error) {
        failedFiles++;
        console.error(`Failed to delete file ${fileUrl}:`, error);
        // Continue deleting other files even if one fails
      }
    }

    // Delete database record permanently
    await prisma.photo.delete({
      where: { id: photoId },
    });

    // Log audit trail - FIXED: user.id -> user.userId
    return NextResponse.json({
      success: true,
      message: 'Photo permanently deleted',
      stats: {
        filesDeleted: deletedFiles,
        filesFailed: failedFiles,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to permanently delete photo' },
      { status: 500 }
    );
  }
}
