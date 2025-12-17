import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getGallerySession, getOrCreateGuestId } from '@/lib/gallery/auth';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string; photo_id: string }> }
) {
  try {
    const { eventSlug, photo_id } = await params;

    // Find event
    const event = await prisma.events.findUnique({
      where: { slug: eventSlug },
      select: { id: true, status: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check gallery access
    const session = await getGallerySession(event.id);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create guest ID for tracking
    const guestId = await getOrCreateGuestId();

    // Check rate limit (downloads: 20 per hour)
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = await checkRateLimit(clientIP, {
      keyPrefix: 'download',
      maxRequests: 20,
      windowMs: 3600000 // 1 hour
    });
    if (!rateLimit.success) {
      const resetInMinutes = Math.ceil((rateLimit.reset * 1000 - Date.now()) / 60000);
      return NextResponse.json(
        { 
          error: `Download limit reached. Please try again in ${resetInMinutes} minutes.`,
          remaining: rateLimit.remaining,
        },
        { status: 429 }
      );
    }

    // Find photo
    const photo = await prisma.photos.findUnique({
      where: { 
        id: photo_id,
        event_id: event.id,
      },
      select: {
        id: true,
        original_url: true,
        filename: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Track download for analytics
    try {
      await prisma.photo_downloads.create({
        data: {
          id: crypto.randomUUID(),
          photo_id: photo.id,
          guest_id: guestId,
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || undefined,
        },
      });
      
      // Update download count
      await prisma.photos.update({
        where: { id: photo.id },
        data: { download_count: { increment: 1 } },
      });
    } catch (trackingError) {
      // Log error but don't fail the download
      console.warn('Failed to track download:', trackingError);
    }

    // Return photo URL for client-side download
    return NextResponse.json({
      success: true,
      downloadUrl: photo.original_url,
      filename: photo.filename,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
