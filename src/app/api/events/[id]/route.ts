import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database'; // Mengimpor database langsung

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    const event = await database.getEventById(eventId); // Menggunakan database langsung

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    
    const updatedEvent = await database.updateEvent(eventId, { // Menggunakan database langsung
      name: body.name,
      date: body.date,
      access_code: body.accessCode || body.access_code,
      is_premium: body.isPremium || body.is_premium,
    });
    
    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { message: "Failed to update event", error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    await database.deleteEvent(eventId); // Menggunakan database langsung
    
    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { message: "Failed to delete event", error: error.message },
      { status: 400 }
    );
  }
} 