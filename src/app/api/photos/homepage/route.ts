import { NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { smartDatabase } from '@/lib/database-with-smart-storage';

export async function GET() {
  try {
    const photos = await database.getHomepagePhotos();
    return NextResponse.json(photos);
  } catch (error: any) {
    console.error('Error fetching homepage photos from API:', error);
    return NextResponse.json({ message: `Error fetching homepage photos: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const photo = await smartDatabase.uploadHomepagePhoto(file);
    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading homepage photo:', error);
    return NextResponse.json({ message: `Failed to upload photo: ${error.message}` }, { status: 500 });
  }
} 