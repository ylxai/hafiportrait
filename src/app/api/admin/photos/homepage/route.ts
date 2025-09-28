import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { directR2Uploader } from '@/lib/direct-r2-uploader';
import { uploadFile, generateFilePath } from '@/lib/supabase';

// Configure API route for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const photos = await database.getHomepagePhotos();

    const publicPhotos = photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      original_name: photo.original_name,
    }));

    return NextResponse.json(publicPhotos, { status: 200 });
  } catch (error) {
    // Always log errors for debugging
    console.error('Error fetching homepage photos from API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: 'Gagal mengambil foto homepage', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
      'image/heic', 'image/heif', 'image/gif', 'image/bmp',
      // RAW formats
      'image/x-nikon-nef', 'image/x-canon-cr2', 'image/x-sony-arw',
      'image/x-adobe-dng', 'image/x-fuji-raf'
    ];

    const isValidType = allowedTypes.includes(file.type) || 
                       file.name.toLowerCase().match(/\.(nef|cr2|arw|dng|raf)$/);

    if (!isValidType) {
      return NextResponse.json({ 
        message: 'Invalid file type. Allowed: JPG, PNG, WEBP, HEIC, RAW formats (NEF, CR2, ARW, DNG, RAF)' 
      }, { status: 400 });
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be less than 50MB' }, { status: 400 });
    }

    // Upload homepage photo directly to Cloudflare R2
    const photo = await directR2Uploader.uploadHomepagePhoto({
      file,
      compression: {
        quality: 95, // High quality for homepage
        maxWidth: 3000
      }
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    // Always log errors for debugging
    console.error('Homepage photo upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: `Failed to upload photo: ${errorMessage}` }, { status: 500 });
  }
} 