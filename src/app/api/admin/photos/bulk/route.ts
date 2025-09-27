import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

/**
 * Bulk operations for photos
 * POST /api/admin/photos/bulk - Bulk operations (move, archive)
 * DELETE /api/admin/photos/bulk - Bulk delete photos
 */

export async function POST(request: NextRequest) {
  try {
    const { photoIds, action, targetAlbum, targetEvent } = await request.json();

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Photo IDs are required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'move':
        result = await movePhotos(photoIds, targetAlbum, targetEvent);
        break;
      case 'archive':
        result = await archivePhotos(photoIds);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error in bulk photo operation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


/**
 * Move photos to different album or event
 */
async function movePhotos(photoIds: string[], targetAlbum?: string, targetEvent?: string) {
  let movedCount = 0;
  let failedMoves: string[] = [];

  console.log(`📁 Moving ${photoIds.length} photos to album: ${targetAlbum}`);

  for (const photoId of photoIds) {
    try {
      // Get current photo details
      const photo = await database.getPhotoById(photoId);
      if (!photo) {
        failedMoves.push(photoId);
        continue;
      }

      // Update photo with new album/event
      const updateData: any = {};
      if (targetAlbum) {
        updateData.album_name = targetAlbum;
      }
      if (targetEvent) {
        updateData.event_id = targetEvent;
      }

      // Use database update method (we'll need to implement this)
      await updatePhotoMetadata(photoId, updateData);
      movedCount++;
      console.log(`✅ Moved photo ${photoId} to ${targetAlbum}`);
      
    } catch (error) {
      console.error(`❌ Failed to move photo ${photoId}:`, error);
      failedMoves.push(photoId);
    }
  }

  return {
    movedCount,
    failedCount: failedMoves.length,
    failedIds: failedMoves,
    totalRequested: photoIds.length,
    targetAlbum,
    targetEvent
  };
}

/**
 * Archive photos (mark as archived instead of deleting)
 */
async function archivePhotos(photoIds: string[]) {
  let archivedCount = 0;
  let failedArchives: string[] = [];

  console.log(`📦 Archiving ${photoIds.length} photos`);

  for (const photoId of photoIds) {
    try {
      await updatePhotoMetadata(photoId, { 
        is_archived: true,
        archived_at: new Date().toISOString()
      });
      archivedCount++;
      console.log(`✅ Archived photo: ${photoId}`);
      
    } catch (error) {
      console.error(`❌ Failed to archive photo ${photoId}:`, error);
      failedArchives.push(photoId);
    }
  }

  return {
    archivedCount,
    failedCount: failedArchives.length,
    failedIds: failedArchives,
    totalRequested: photoIds.length
  };
}

/**
 * Update photo metadata in database
 */
async function updatePhotoMetadata(photoId: string, updateData: any) {
  try {
    // Import supabase client
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    const { data, error } = await supabaseAdmin
      .from('photos')
      .update(updateData)
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`❌ Error updating photo ${photoId}:`, error);
    throw error;
  }
}