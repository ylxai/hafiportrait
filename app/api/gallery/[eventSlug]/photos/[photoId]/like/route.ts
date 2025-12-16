/**
 * Photo Like API Endpoint
 * Handles POST (like) and DELETE (unlike) requests
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getGallerySession } from '@/lib/gallery/auth';
import { checkRateLimit, RateLimitPresets, getClientIdentifier } from '@/lib/security/rate-limiter';

interface RouteParams {
  params: Promise<{
    eventSlug: string;
    photoId: string;
  }>;
}

/**
 * POST - Like a photo
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventSlug, photoId } = await params;
    const body = await request.json();
    const { guestId } = body;

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Find event
    const event = await prisma.event.findUnique({
      where: { slug: eventSlug },
      select: { 
        id: true, 
        status: true,
      },
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

    // Check if likes are enabled
    const settings = await prisma.eventSettings.findUnique({
      where: { eventId: event.id },
      select: { allowGuestLikes: true },
    });

    const allowLikes = settings?.allowGuestLikes ?? true;
    if (!allowLikes) {
      return NextResponse.json(
        { error: 'Likes are disabled for this event' },
        { status: 403 }
      );
    }

    // Rate limiting: 100 likes per hour per guest - FIXED: Use centralized rate limiter
    const identifier = `${getClientIdentifier(request)}:${guestId}`;
    const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.GALLERY_LIKE);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // Verify photo exists and belongs to event
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        eventId: event.id,
      },
      select: {
        id: true,
        likesCount: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Create like (upsert to handle duplicates gracefully)
    try {
      await prisma.photoLike.create({
        data: {
          photoId: photoId,
          guestId: guestId,
        },
      });

      // Increment like count
      const updatedPhoto = await prisma.photo.update({
        where: { id: photoId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likesCount: updatedPhoto.likesCount,
      });
    } catch (error: any) {
      // Handle duplicate like (unique constraint violation)
      if (error.code === 'P2002') {
        // Already liked, return current count
        return NextResponse.json({
          success: true,
          liked: true,
          likesCount: photo.likesCount,
          message: 'Photo already liked',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error liking photo:', error);
    return NextResponse.json(
      { error: 'Failed to like photo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Unlike a photo
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventSlug, photoId } = await params;
    const body = await request.json();
    const { guestId } = body;

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Find event
    const event = await prisma.event.findUnique({
      where: { slug: eventSlug },
      select: { 
        id: true, 
        status: true,
      },
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

    // Verify photo exists and belongs to event
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        eventId: event.id,
      },
      select: {
        id: true,
        likesCount: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete like
    const deletedLike = await prisma.photoLike.deleteMany({
      where: {
        photoId: photoId,
        guestId: guestId,
      },
    });

    // Decrement like count if like was actually deleted
    if (deletedLike.count > 0) {
      const updatedPhoto = await prisma.photo.update({
        where: { id: photoId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        likesCount: Math.max(0, updatedPhoto.likesCount), // Ensure non-negative
      });
    }

    // Like didn't exist, return current count
    return NextResponse.json({
      success: true,
      liked: false,
      likesCount: photo.likesCount,
      message: 'Photo was not liked',
    });
  } catch (error) {
    console.error('Error unliking photo:', error);
    return NextResponse.json(
      { error: 'Failed to unlike photo' },
      { status: 500 }
    );
  }
}
