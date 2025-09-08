import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;

    if (!photoId) {
      return NextResponse.json({ message: 'Photo ID is required' }, { status: 400 });
    }

    // Dapatkan detail foto dari database
    const photo = await database.getPhotoById(photoId);
    if (!photo) {
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });
    }

    // Hapus foto menggunakan database service
    // Database service akan menangani penghapusan file dari storage dan database
    await database.deletePhoto(photoId);
    
    return NextResponse.json({ message: "Photo deleted successfully" });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Delete photo error:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { message: "Failed to delete photo", error: errorMessage },
      { status: 500 }
    );
  }
} 