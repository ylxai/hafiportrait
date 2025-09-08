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
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be less than 10MB' }, { status: 400 });
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