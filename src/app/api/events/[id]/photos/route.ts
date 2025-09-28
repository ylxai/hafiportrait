import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { directR2Uploader } from '@/lib/direct-r2-uploader';

// Configure API route for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    const photos = await database.getEventPhotos(eventId);
    return NextResponse.json(photos);
  } catch (error: any) {
    console.error("Get photos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event photos", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File || formData.get('photo') as File;
    const uploaderName = formData.get('uploaderName') as string || 'Anonymous';
    const albumName = formData.get('albumName') as string || 'Tamu';

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type (focus on Sharp-supported formats)
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
      'image/heic', 'image/heif', 'image/gif', 'image/bmp'
    ];

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp'];
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';

    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

    // Check for RAW formats and reject them with clear message
    const rawExtensions = ['nef', 'cr2', 'arw', 'dng', 'raf'];
    const rawMimeTypes = ['image/x-nikon-nef', 'image/x-canon-cr2', 'image/x-sony-arw', 'image/x-adobe-dng', 'image/x-fuji-raf'];
    
    if (rawExtensions.includes(fileExtension) || rawMimeTypes.includes(file.type)) {
      return NextResponse.json({ 
        message: 'RAW format not supported. Please convert to JPEG, PNG, or WebP first.',
        details: `RAW file detected: ${file.name}. Use photo editing software to export as JPEG/PNG.`
      }, { status: 400 });
    }

    if (!isValidType) {
      return NextResponse.json({ 
        message: 'Invalid file type. Supported: JPEG, PNG, WebP, HEIC, GIF, BMP',
        details: `File type: ${file.type}, Extension: ${fileExtension}`
      }, { status: 400 });
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be less than 50MB' }, { status: 400 });
    }

    // Validate album name
    if (!['Official', 'Tamu', 'Bridesmaid'].includes(albumName)) {
      return NextResponse.json({ message: 'Invalid album name' }, { status: 400 });
    }

    // Upload photo directly to Cloudflare R2
    const photo = await directR2Uploader.uploadPhoto({
      eventId,
      file,
      uploaderName,
      albumName,
      compression: {
        quality: albumName === 'Official' ? 95 : 90, // Higher quality for Official photos
        maxWidth: albumName === 'Official' ? 3000 : 2400
      }
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    // Always log errors for debugging (can be filtered later)
    console.error('Error uploading event photo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      message: `Failed to upload photo: ${errorMessage}`,
      details: errorMessage
    }, { status: 500 });
  }
} 