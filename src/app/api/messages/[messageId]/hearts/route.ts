import { NextRequest, NextResponse } from 'next/server';
import { database, MessageReactions } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    
    // Get current message to increment hearts
    const message = await database.getMessageById(messageId);
    if (!message) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    const newHearts = (message.hearts || 0) + 1;
    await database.updateMessageHearts(messageId, newHearts);

    return NextResponse.json({ 
      success: true, 
      hearts: newHearts,
      message: "Heart added successfully" 
    });
  } catch (error: any) {
    console.error('Add heart error:', error);
    return NextResponse.json(
      { message: "Failed to add heart", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const { hearts } = body;

    if (typeof hearts !== 'number') {
      return NextResponse.json(
        { message: "Hearts must be a number" },
        { status: 400 }
      );
    }

    await database.updateMessageHearts(messageId, hearts);

    return NextResponse.json({ 
      success: true, 
      message: "Hearts updated successfully" 
    });
  } catch (error: any) {
    console.error('Update message hearts error:', error);
    return NextResponse.json(
      { message: "Failed to update hearts", error: error.message },
      { status: 500 }
    );
  }
} 