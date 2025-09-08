import { NextRequest, NextResponse } from 'next/server';
import { eventAccessControl } from '@/middleware/event-access-control';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const accessResult = await eventAccessControl(request, eventId);
    
    // Convert to frontend-friendly format
    const result = {
      allowed: accessResult.allowed,
      message: accessResult.message,
      isReadOnly: accessResult.message?.includes('selesai') || false
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Access check error:', error);
    return NextResponse.json(
      { 
        allowed: false, 
        message: "Terjadi kesalahan saat memeriksa akses event." 
      },
      { status: 500 }
    );
  }
}