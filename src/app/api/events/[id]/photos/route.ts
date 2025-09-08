import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { smartDatabase } from '@/lib/database-with-smart-storage';
import { uploadFile, generateFilePath } from '@/lib/supabase';
import { storageAdapter } from '@/lib/storage-adapter';

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Validate album name
    if (!['Official', 'Tamu', 'Bridesmaid'].includes(albumName)) {
      return NextResponse.json({ message: 'Invalid album name' }, { status: 400 });
    }

    // Upload photo using Smart Storage Manager
    const photo = await smartDatabase.uploadEventPhoto(eventId, file, uploaderName, albumName);
    
    if (!photo) {
      throw new Error('Failed to create photo record');
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error uploading event photo:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      message: `Failed to upload photo: ${errorMessage}`,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 });
  }
} 