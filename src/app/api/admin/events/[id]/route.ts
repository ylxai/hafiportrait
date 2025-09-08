import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    
    const updatedEvent = await database.updateEvent(eventId, {
      name: body.name,
      date: body.date,
      access_code: body.accessCode || body.access_code,
      is_premium: body.isPremium || body.is_premium,
      status: body.status,
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
    
    await database.deleteEvent(eventId);
    
    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { message: "Failed to delete event", error: error.message },
      { status: 400 }
    );
  }
}