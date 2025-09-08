import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// PUT - Reorder slideshow photos
export async function PUT(request: NextRequest) {
  try {
    const { photoIds } = await request.json();
    
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'Photo IDs array is required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Update order for each photo
    const updatePromises = photoIds.map((photoId, index) => 
      supabase
        .from('photos')
        .update({ slideshow_order: index + 1 })
        .eq('id', photoId)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error reordering slideshow photos:', errors);
      return NextResponse.json({ error: 'Failed to reorder some photos' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Slideshow photos reordered successfully' 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}