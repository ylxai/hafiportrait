import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET - Public endpoint for hero slideshow (same as admin endpoint)
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