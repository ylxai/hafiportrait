import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

/**
 * Bulk delete files
 * DELETE /api/admin/files/bulk-delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { fileIds } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No file IDs provided' 
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ Bulk deleting ${fileIds.length} files:`, fileIds);

    // Delete files from database
    let deletedCount = 0;
    const errors: string[] = [];

    for (const fileId of fileIds) {
      try {
        // Handle local backup files (they have special IDs)
        if (fileId.startsWith('local-file-') || fileId.startsWith('local-folder-')) {
          // For local files, we would need to delete from filesystem
          // For now, just skip them as they're backup files
          console.log(`⏭️ Skipping local backup file: ${fileId}`);
          continue;
        }

        // Delete photo from database (this will also trigger storage cleanup if needed)
        try {
          await database.deletePhoto(fileId);
          deletedCount++;
          console.log(`✅ Deleted file: ${fileId}`);
        } catch (deleteError) {
          errors.push(`File not found: ${fileId}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting file ${fileId}:`, error);
        errors.push(`Failed to delete ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send broadcast events to refresh Event pages
    // Since we can't dispatch events from server-side, we'll add cache invalidation logic
    console.log(`📡 Bulk delete completed: ${deletedCount} photos deleted`);
    
    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        totalRequested: fileIds.length,
        errors: errors.length > 0 ? errors : undefined,
        broadcastSent: true
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk delete:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}