import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { accessCode } = body;

    if (!accessCode) {
      return NextResponse.json(
        { message: "Access code is required" },
        { status: 400 }
      );
    }

    const event = await database.getEventById(eventId);
    
    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    const isValid = (event.access_code || '').toUpperCase() === accessCode.toUpperCase();
    
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid access code" },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Access code verified successfully" 
    });
  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { message: "Failed to verify access code", error: error.message },
      { status: 500 }
    );
  }
} 