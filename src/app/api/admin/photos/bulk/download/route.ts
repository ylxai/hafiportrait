import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { ZipGenerator, createPhotoZip } from '@/lib/zip-generator';

/**
 * Generate and download ZIP file from selected photos
 * POST /api/admin/photos/bulk/download
 */
export async function POST(request: NextRequest) {
  try {
    const { photoIds, includeOriginals = true, compressionLevel = 6 } = await request.json();

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Photo IDs are required' },
        { status: 400 }
      );
    }

    console.log(`📦 Creating ZIP download for ${photoIds.length} photos`);

    // Get photo details from database
    const photos = await getPhotosForZip(photoIds);
    
    if (photos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid photos found' },
        { status: 404 }
      );
    }

    // Validate ZIP request
    const validation = ZipGenerator.validateZipRequest(photos);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

    // Estimate ZIP size
    const estimatedSize = ZipGenerator.estimateZipSize(photos);
    console.log(`📊 Estimated ZIP size: ${(estimatedSize / 1024 / 1024).toFixed(2)} MB`);

    // Generate ZIP file
    const zipBlob = await createPhotoZip(photos, {
      includeOriginals,
      compressionLevel,
      onProgress: (progress, current, total) => {
        console.log(`📦 ZIP Progress: ${progress}% (${current}/${total})`);
      }
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const albumInfo = getAlbumInfo(photos);
    const filename = `photos-${albumInfo}-${timestamp}.zip`;

    console.log(`✅ ZIP created successfully: ${filename} (${zipBlob.size} bytes)`);

    // Return ZIP file as response
    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBlob.size.toString(),
        'X-Photo-Count': photos.length.toString(),
        'X-Estimated-Size': estimatedSize.toString(),
        'X-Actual-Size': zipBlob.size.toString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating ZIP download:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create ZIP download',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get photo details for ZIP generation
 */
async function getPhotosForZip(photoIds: string[]) {
  const photos = [];
  
  for (const photoId of photoIds) {
    try {
      const photo = await database.getPhotoById(photoId);
      if (photo) {
        photos.push({
          id: photo.id,
          url: photo.url,
          original_name: photo.original_name || `photo-${photo.id}.jpg`,
          file_size: photo.file_size || 0,
          album_name: photo.album_name || 'Unknown',
          event_name: photo.event_name || 'Unknown Event',
          uploader_name: photo.uploader_name || 'Unknown'
        });
      }
    } catch (error) {
      console.error(`❌ Error getting photo ${photoId}:`, error);
      // Continue with other photos
    }
  }
  
  return photos;
}

/**
 * Generate album info for filename
 */
function getAlbumInfo(photos: any[]): string {
  const albums = Array.from(new Set(photos.map(p => p.album_name)));
  const events = Array.from(new Set(photos.map(p => p.event_name)));
  
  if (albums.length === 1 && events.length === 1) {
    return `${events[0]}-${albums[0]}`.replace(/[^a-zA-Z0-9-]/g, '');
  } else if (albums.length === 1) {
    return albums[0].replace(/[^a-zA-Z0-9-]/g, '');
  } else if (events.length === 1) {
    return events[0].replace(/[^a-zA-Z0-9-]/g, '');
  } else {
    return 'mixed';
  }
}