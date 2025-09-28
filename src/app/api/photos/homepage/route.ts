import { NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { directR2Uploader } from '@/lib/direct-r2-uploader';

// Configure API route for large file uploads  
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const photos = await database.getHomepagePhotos();
    return NextResponse.json(photos, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 minutes cache untuk homepage
        // ETag removed for homepage - Cache-Control is sufficient for static content
      },
    });
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

    // Upload homepage photo directly to Cloudflare R2
    const photo = await directR2Uploader.uploadHomepagePhoto({
      file,
      compression: {
        quality: 95, // High quality for homepage
        maxWidth: 3000
      }
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading homepage photo:', error);
    return NextResponse.json({ message: `Failed to upload photo: ${error.message}` }, { status: 500 });
  }
} 