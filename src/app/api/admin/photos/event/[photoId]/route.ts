import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    
    // Delete photo from database and storage
    await database.deletePhoto(photoId);
    
    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete event photo error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: `Failed to delete photo: ${error.message}` 
      },
      { status: 500 }
    );
  }
}