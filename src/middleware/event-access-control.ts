// Event Access Control Middleware
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function eventAccessControl(
  request: NextRequest,
  eventId: string
): Promise<{ allowed: boolean; message?: string; redirect?: string }> {
  try {
    const event = await database.getEventById(eventId);
    
    if (!event) {
      return { 
        allowed: false, 
        message: "Event tidak ditemukan",
        redirect: '/404'
      };
    }

    const status = event.status || 'active';
    const eventDate = new Date(event.date);
    const now = new Date();

    switch (status) {
      case 'draft':
        return {
          allowed: false,
          message: "Event masih dalam tahap persiapan. Silakan coba lagi nanti.",
          redirect: '/event-not-ready'
        };
        
      case 'paused':
        return {
          allowed: false,
          message: "Event sedang dijeda sementara. Silakan coba lagi nanti.",
          redirect: '/event-paused'
        };
        
      case 'cancelled':
        return {
          allowed: false,
          message: "Event telah dibatalkan.",
          redirect: '/event-cancelled'
        };
        
      case 'archived':
        return {
          allowed: false,
          message: "Event telah diarsipkan dan tidak dapat diakses lagi.",
          redirect: '/event-archived'
        };
        
      case 'completed':
        // Allow read-only access for completed events
        return {
          allowed: true,
          message: "Event telah selesai. Anda hanya dapat melihat foto dan pesan."
        };
        
      case 'active':
        return { allowed: true };
        
      default:
        return { allowed: true };
    }
  } catch (error) {
    console.error('Event access control error:', error);
    return {
      allowed: false,
      message: "Terjadi kesalahan sistem. Silakan coba lagi.",
      redirect: '/error'
    };
  }
}