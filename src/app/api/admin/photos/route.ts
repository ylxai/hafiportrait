import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { directR2Uploader } from '@/lib/direct-r2-uploader';

// This API route uses request URL parameters, so it must be dynamic
export const dynamic = 'force-dynamic';

/**
 * Get all photos for admin management
 * GET /api/admin/photos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const eventId = searchParams.get('eventId');
    const albumName = searchParams.get('albumName');
    const uploaderName = searchParams.get('uploaderName');

    console.log('📸 Fetching all photos for admin management...');

    // Get all photos from database
    const allPhotos = await database.getAllPhotos();

    // Apply filters if provided
    let filteredPhotos = allPhotos;

    if (eventId) {
      filteredPhotos = filteredPhotos.filter(photo => photo.event_id === eventId);
    }

    if (albumName) {
      filteredPhotos = filteredPhotos.filter(photo => photo.album_name === albumName);
    }

    if (uploaderName) {
      filteredPhotos = filteredPhotos.filter(photo => 
        photo.uploader_name?.toLowerCase().includes(uploaderName.toLowerCase())
      );
    }

    // Sort by upload date (newest first)
    filteredPhotos.sort((a, b) => 
      new Date(b.uploaded_at || 0).getTime() - new Date(a.uploaded_at || 0).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex);

    // Add additional metadata for admin
    const photosWithMetadata = paginatedPhotos.map(photo => ({
      ...photo,
      // Ensure we have all necessary fields for PhotoSelector
      id: photo.id,
      url: photo.url,
      thumbnail_url: photo.thumbnail_url || photo.url,
      original_name: photo.original_name || `photo-${photo.id}`,
      album_name: photo.album_name || 'Unknown',
      event_id: photo.event_id,
      event_name: photo.event_name || 'Unknown Event',
      file_size: photo.file_size || 0,
      uploaded_at: photo.uploaded_at || new Date().toISOString(),
      uploader_name: photo.uploader_name || 'Unknown',
      storage_tier: photo.storage_tier,
      storage_provider: photo.storage_provider,
      is_homepage: photo.is_homepage || false
    }));

    console.log(`✅ Retrieved ${photosWithMetadata.length} photos (page ${page}/${Math.ceil(filteredPhotos.length / limit)})`);

    return NextResponse.json({
      success: true,
      data: {
        photos: photosWithMetadata,
        pagination: {
          page,
          limit,
          total: filteredPhotos.length,
          totalPages: Math.ceil(filteredPhotos.length / limit),
          hasNext: endIndex < filteredPhotos.length,
          hasPrev: page > 1
        },
        filters: {
          eventId,
          albumName,
          uploaderName
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin photos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch photos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}