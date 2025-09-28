import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET - Public endpoint for hero slideshow (same as admin endpoint)
export async function GET() {
  try {
    const supabase = createClient();
    
    // Use proper slideshow columns
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('is_slideshow', true)
      .eq('slideshow_active', true)
      .order('slideshow_order', { ascending: true })

    if (error) {
      console.error('Error fetching slideshow photos:', error);
      // Return empty array instead of error to prevent homepage crash
      return NextResponse.json([]);
    }

    return NextResponse.json(photos || []);
  } catch (error) {
    console.error('Unexpected error in slideshow API:', error);
    // Return empty array instead of error to prevent homepage crash
    return NextResponse.json([]);
  }
}