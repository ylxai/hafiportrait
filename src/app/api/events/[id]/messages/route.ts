import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;

  const eventId = resolvedParams.id;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    const messages = await database.getEventMessages(eventId);
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;

  const eventId = resolvedParams.id;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { guestName, message } = body;

    if (!guestName || !message) {
      return NextResponse.json(
        { message: "Guest name and message are required" },
        { status: 400 }
      );
    }

    const newMessage = await database.createMessage({
      event_id: eventId,
      sender_name: guestName,
      content: message,
      guest_name: guestName, // Add back for database compatibility
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error(`Create message for event ${eventId} error:`, error);
    return NextResponse.json(
      { message: "Failed to create message", error: error.message },
      { status: 500 }
    );
  }
}
