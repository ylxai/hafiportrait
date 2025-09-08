import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

const GoogleDriveStorage = require('@/lib/google-drive-storage');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id;
    
    // Get photo details from database
    const photo = await database.getPhotoById(photoId);
    
    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Check if we have Google Drive file ID for original
    if (!photo.storage_file_id && !photo.storage_path) {
      // For photos without Google Drive backup, serve the main URL
      // This URL might be original quality depending on when it was uploaded
      console.log('⚠️ No Google Drive backup found, serving main URL (may be original)');
      return NextResponse.redirect(photo.url);
    }

    try {
      // Initialize Google Drive storage
      const googleDrive = new GoogleDriveStorage();
      await googleDrive.initialize();
      
      let originalBuffer;
      
      // Try to download from Google Drive
      if (photo.storage_file_id) {
        console.log(`📥 Downloading original from Google Drive: ${photo.storage_file_id}`);
        originalBuffer = await googleDrive.downloadPhoto(photo.storage_file_id);
      } else {
        // Fallback to compressed version
        console.log('⚠️ No Google Drive file ID, serving compressed version');
        return NextResponse.redirect(photo.url);
      }

      // Return original file with proper headers
      return new Response(originalBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${photo.original_name}"`,
          'Content-Length': originalBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
          'X-Quality-Level': 'original-100%',
          'X-File-Source': 'google-drive-backup'
        }
      });

    } catch (driveError) {
      console.error('❌ Google Drive download failed:', driveError);
      
      // Fallback to compressed version
      console.log('🔄 Falling back to compressed version');
      return NextResponse.redirect(photo.url);
    }

  } catch (error) {
    console.error('❌ Original download endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to download original photo' },
      { status: 500 }
    );
  }
}