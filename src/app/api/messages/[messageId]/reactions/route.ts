import { NextRequest, NextResponse } from 'next/server';
import { database, MessageReactions } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const { reactionType } = body;

    // Validate reaction type
    const validReactions: (keyof MessageReactions)[] = ['love', 'laugh', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json(
        { message: "Invalid reaction type. Valid types: love, laugh, wow, sad, angry" },
        { status: 400 }
      );
    }

    // Add reaction
    await database.addMessageReaction(messageId, reactionType);

    // Get updated message to return new reactions
    const updatedMessage = await database.getMessageById(messageId);

    return NextResponse.json({ 
      success: true, 
      reactions: updatedMessage?.reactions,
      message: `${reactionType} reaction added successfully` 
    });
  } catch (error: any) {
    console.error('Add reaction error:', error);
    return NextResponse.json(
      { message: "Failed to add reaction", error: error.message },
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
    const { reactions } = body;

    // Validate reactions object
    if (!reactions || typeof reactions !== 'object') {
      return NextResponse.json(
        { message: "Reactions must be an object" },
        { status: 400 }
      );
    }

    // Validate reaction values
    const validReactions: (keyof MessageReactions)[] = ['love', 'laugh', 'wow', 'sad', 'angry'];
    for (const key of Object.keys(reactions)) {
      if (!validReactions.includes(key as keyof MessageReactions)) {
        return NextResponse.json(
          { message: `Invalid reaction type: ${key}` },
          { status: 400 }
        );
      }
      if (typeof reactions[key] !== 'number' || reactions[key] < 0) {
        return NextResponse.json(
          { message: `Reaction ${key} must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    await database.updateMessageReactions(messageId, reactions);

    return NextResponse.json({ 
      success: true, 
      message: "Reactions updated successfully" 
    });
  } catch (error: any) {
    console.error('Update reactions error:', error);
    return NextResponse.json(
      { message: "Failed to update reactions", error: error.message },
      { status: 500 }
    );
  }
}