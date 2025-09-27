import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

/**
 * Delete single file
 * DELETE /api/admin/files/[fileId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File ID is required' 
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting single file: ${fileId}`);

    // Handle local backup files (they have special IDs)
    if (fileId.startsWith('local-file-') || fileId.startsWith('local-folder-')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete local backup files from this interface' 
        },
        { status: 400 }
      );
    }

    // Delete photo from database
    const deleted = await database.deletePhoto(fileId);
    
    if (!deleted) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File not found' 
        },
        { status: 404 }
      );
    }

    console.log(`✅ Successfully deleted file: ${fileId}`);

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        deleted: true
      }
    });

  } catch (error) {
    console.error(`❌ Error deleting file ${params.fileId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Download single file
 * GET /api/admin/files/[fileId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File ID is required' 
        },
        { status: 400 }
      );
    }

    console.log(`📥 Downloading file: ${fileId}`);

    // Handle local backup files
    if (fileId.startsWith('local-file-')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Local backup file downloads not implemented yet' 
        },
        { status: 501 }
      );
    }

    // Get photo info from database
    const photo = await database.getPhotoById(fileId);
    
    if (!photo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File not found' 
        },
        { status: 404 }
      );
    }

    // Prefer Google Drive backup (original) over R2 (compressed)
    if (photo.google_drive_backup_url) {
      return NextResponse.json({
        success: true,
        data: {
          downloadUrl: photo.google_drive_backup_url,
          filename: photo.original_name || `photo-${photo.id}.jpg`,
          fileSize: photo.original_file_size || photo.file_size,
          isOriginal: true,
          source: 'google-drive-backup'
        }
      });
    }

    // Fallback to R2 files, generate a signed URL
    if (photo.storage_provider === 'cloudflare' && photo.storage_path) {
      // Import the R2 client
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        },
      });

      const command = new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: photo.storage_path,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

      return NextResponse.json({
        success: true,
        data: {
          downloadUrl: signedUrl,
          filename: photo.original_name || `photo-${photo.id}.jpg`,
          fileSize: photo.file_size,
          isOriginal: false,
          source: 'cloudflare-r2',
          expiresIn: 3600
        }
      });
    }

    // For other storage providers, return the direct URL if available
    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: photo.url,
        filename: photo.original_name || `photo-${photo.id}.jpg`,
        fileSize: photo.file_size
      }
    });

  } catch (error) {
    console.error(`❌ Error downloading file ${params.fileId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate download URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}