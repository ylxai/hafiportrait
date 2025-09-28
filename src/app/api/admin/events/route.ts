import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const events = await database.getAllEvents();
    return NextResponse.json(events);
  } catch (error) {
    // Log error for debugging (consider using proper logging service in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('Get admin events error:', error);
    }
    return NextResponse.json({ message: 'Failed to load admin events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const eventData = await request.json();
    const newEvent = await database.createEvent(eventData);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    // Log error for debugging (consider using proper logging service in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('Create event error:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: `Failed to create event: ${errorMessage}` }, { status: 500 });
  }
}