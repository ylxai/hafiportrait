import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

/**
 * Move photos between albums or events
 * POST /api/admin/photos/move
 */
export async function POST(request: NextRequest) {
  try {
    const { photoIds, targetAlbum, targetEvent } = await request.json();

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Photo IDs are required' },
        { status: 400 }
      );
    }

    if (!targetAlbum && !targetEvent) {
      return NextResponse.json(
        { success: false, error: 'Target album or event is required' },
        { status: 400 }
      );
    }

    console.log(`📁 Moving ${photoIds.length} photos to album: ${targetAlbum}, event: ${targetEvent}`);

    let movedCount = 0;
    let failedMoves: { id: string; error: string }[] = [];

    // Import supabase client
    const { supabaseAdmin } = await import('@/lib/supabase');

    // Validate target event exists if provided
    if (targetEvent) {
      const event = await database.getEventById(targetEvent);
      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Target event not found' },
          { status: 404 }
        );
      }
    }

    // Validate target album
    const validAlbums = ['Official', 'Tamu', 'Bridesmaid', 'Homepage'];
    if (targetAlbum && !validAlbums.includes(targetAlbum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target album' },
        { status: 400 }
      );
    }

    // Move photos one by one for better error handling
    for (const photoId of photoIds) {
      try {
        // Get current photo details
        const photo = await database.getPhotoById(photoId);
        if (!photo) {
          failedMoves.push({ id: photoId, error: 'Photo not found' });
          continue;
        }

        // Prepare update data
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (targetAlbum) {
          updateData.album_name = targetAlbum;
        }

        if (targetEvent) {
          updateData.event_id = targetEvent;
          // Also update event name if we have it
          const event = await database.getEventById(targetEvent);
          if (event) {
            updateData.event_name = event.name;
          }
        }

        // Update photo in database
        const { data, error } = await supabaseAdmin
          .from('photos')
          .update(updateData)
          .eq('id', photoId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        movedCount++;
        console.log(`✅ Moved photo ${photoId} to ${targetAlbum || 'same album'} in event ${targetEvent || 'same event'}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to move photo ${photoId}:`, errorMessage);
        failedMoves.push({ id: photoId, error: errorMessage });
      }
    }

    const result = {
      movedCount,
      failedCount: failedMoves.length,
      failedMoves,
      totalRequested: photoIds.length,
      targetAlbum,
      targetEvent
    };

    // Log summary
    console.log(`📊 Move operation completed:`, {
      moved: movedCount,
      failed: failedMoves.length,
      total: photoIds.length
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully moved ${movedCount} of ${photoIds.length} photos`
    });

  } catch (error) {
    console.error('❌ Error in photo move operation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to move photos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get available albums and events for move operation
 * GET /api/admin/photos/move
 */
export async function GET() {
  try {
    // Get all events
    const events = await database.getAllEvents();
    
    // Get available albums from existing photos
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { data: albumData } = await supabaseAdmin
      .from('photos')
      .select('album_name')
      .not('album_name', 'is', null);

    const existingAlbums = Array.from(new Set(
      albumData?.map(p => p.album_name).filter(Boolean) || []
    ));

    // Combine with standard albums
    const standardAlbums = ['Official', 'Tamu', 'Bridesmaid', 'Homepage'];
    const allAlbums = Array.from(new Set([...standardAlbums, ...existingAlbums]));

    return NextResponse.json({
      success: true,
      data: {
        albums: allAlbums,
        events: events.map(event => ({
          id: event.id,
          name: event.name,
          date: event.date
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error getting move options:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get move options',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}