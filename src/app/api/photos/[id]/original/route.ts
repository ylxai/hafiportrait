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

    // Check if we have original backup file ID
    if (!photo.original_backup_file_id && !photo.storage_file_id && !photo.storage_path) {
      // For photos without any backup, serve the main URL
      // This URL might be original quality depending on when it was uploaded
      console.log('⚠️ No original backup found, serving main URL (may be compressed)');
      return NextResponse.redirect(photo.url);
    }

    try {
      // Initialize Google Drive storage
      const googleDrive = new GoogleDriveStorage();
      await googleDrive.initialize();
      
      let originalBuffer;
      let fileSource = 'unknown';
      
      // Priority 1: Try original backup file first
      if (photo.original_backup_file_id) {
        console.log(`📥 Downloading ORIGINAL from Google Drive backup: ${photo.original_backup_file_id}`);
        try {
          originalBuffer = await googleDrive.downloadPhoto(photo.original_backup_file_id);
          fileSource = 'original-backup';
        } catch (originalError) {
          console.warn('⚠️ Original backup download failed, trying compressed backup');
        }
      }
      
      // Priority 2: Try regular backup file if original backup failed
      if (!originalBuffer && photo.storage_file_id) {
        console.log(`📥 Downloading from Google Drive (may be compressed): ${photo.storage_file_id}`);
        try {
          originalBuffer = await googleDrive.downloadPhoto(photo.storage_file_id);
          fileSource = 'compressed-backup';
        } catch (backupError) {
          console.warn('⚠️ Backup download failed, serving main URL');
        }
      }
      
      // Priority 3: Fallback to main URL if all downloads failed
      if (!originalBuffer) {
        console.log('⚠️ All download attempts failed, serving main URL');
        return NextResponse.redirect(photo.url);
      }

      // Return file with proper headers indicating quality
      const qualityLevel = fileSource === 'original-backup' ? 'original-100%' : 'compressed-display-quality';
      const contentType = photo.original_name?.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      
      return new Response(originalBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${photo.original_name}"`,
          'Content-Length': originalBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
          'X-Quality-Level': qualityLevel,
          'X-File-Source': fileSource,
          'X-Original-Size': photo.original_file_size?.toString() || 'unknown'
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