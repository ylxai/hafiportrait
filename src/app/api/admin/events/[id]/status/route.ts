import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { status } = await request.json();
    
    // Validate status
    const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be one of: " + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Update event status
    const updatedEvent = await database.updateEventStatus(eventId, status);
    
    return NextResponse.json({
      message: "Event status updated successfully",
      event: updatedEvent
    });
  } catch (error: any) {
    console.error('Update event status error:', error);
    return NextResponse.json(
      { message: "Failed to update event status", error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // Get event with status and statistics
    const eventWithStats = await database.getEventWithStats(eventId);
    
    if (!eventWithStats) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(eventWithStats);
  } catch (error: any) {
    console.error('Get event status error:', error);
    return NextResponse.json(
      { message: "Failed to get event status", error: error.message },
      { status: 400 }
    );
  }
}