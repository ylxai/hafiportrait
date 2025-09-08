import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database'; // Mengimpor database langsung

export async function GET(request: NextRequest) {
  try {
    const events = await database.getEvents();
    return NextResponse.json(events);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Get events error:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { message: "Failed to get events", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.date) {
      return NextResponse.json(
        { message: "Name and date are required" },
        { status: 400 }
      );
    }

    const event = await database.createEvent({ // Menggunakan database langsung
      name: body.name,
      date: body.date,
      access_code: body.accessCode || body.access_code,
      is_premium: body.isPremium || body.is_premium || false,
    });
    
    return NextResponse.json(event);
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { message: "Failed to create event", error: error.message },
      { status: 400 }
    );
  }
} 