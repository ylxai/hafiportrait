import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { smartDatabase } from '@/lib/database-with-smart-storage';
import { uploadFile, generateFilePath } from '@/lib/supabase';

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
    // Log error for debugging (consider using proper logging service in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching homepage photos from API:', error);
    }
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

    // Upload homepage photo using Smart Storage Manager
    const photo = await smartDatabase.uploadHomepagePhoto(file);
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    // Log error for debugging (consider using proper logging service in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('Homepage photo upload error:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: `Failed to upload photo: ${errorMessage}` }, { status: 500 });
  }
} 