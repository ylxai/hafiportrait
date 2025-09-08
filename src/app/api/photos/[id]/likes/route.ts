import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id;
    
    // Like the photo
    await database.likePhoto(photoId);
    
    // Get updated photo data
    const photo = await database.getPhotoById(photoId);
    
    return NextResponse.json({ 
      success: true, 
      likes: photo?.likes || 0 
    });
  } catch (error) {
    console.error('Error liking photo:', error);
    return NextResponse.json(
      { error: 'Failed to like photo' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id;
    
    // Like the photo
    await database.likePhoto(photoId);
    
    // Get updated photo data
    const photo = await database.getPhotoById(photoId);
    
    return NextResponse.json({ 
      success: true, 
      likes: photo?.likes || 0 
    });
  } catch (error) {
    console.error('Error liking photo:', error);
    return NextResponse.json(
      { error: 'Failed to like photo' },
      { status: 500 }
    );
  }
}