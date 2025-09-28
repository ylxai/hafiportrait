import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET - Get all slideshow photos
export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('is_slideshow', true)
      .eq('slideshow_active', true)
      .order('slideshow_order', { ascending: true });

    if (error) {
      console.error('Error fetching slideshow photos:', error);
      return NextResponse.json({ error: 'Failed to fetch slideshow photos' }, { status: 500 });
    }

    return NextResponse.json(photos || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add photo to slideshow
export async function POST(request: NextRequest) {
  try {
    const { photoId } = await request.json();
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Get current max order
    const { data: maxOrderData } = await supabase
      .from('photos')
      .select('slideshow_order')
      .eq('is_slideshow', true)
      .order('slideshow_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxOrderData?.[0]?.slideshow_order || 0) + 1;

    // Update photo to be in slideshow
    const { data, error } = await supabase
      .from('photos')
      .update({
        is_slideshow: true,
        slideshow_order: nextOrder,
        slideshow_active: true
      })
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      console.error('Error adding photo to slideshow:', error);
      return NextResponse.json({ error: 'Failed to add photo to slideshow' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Photo added to slideshow successfully',
      photo: data 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove photo from slideshow
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Remove photo from slideshow
    const { error } = await supabase
      .from('photos')
      .update({
        is_slideshow: false,
        slideshow_order: null,
        slideshow_active: false
      })
      .eq('id', photoId);

    if (error) {
      console.error('Error removing photo from slideshow:', error);
      return NextResponse.json({ error: 'Failed to remove photo from slideshow' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Photo removed from slideshow successfully' 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}