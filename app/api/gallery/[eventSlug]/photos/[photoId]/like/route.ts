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
    photo_id: string;
  }>;
}

/**
 * POST - Like a photo
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventSlug, photo_id } = await params;
    const body = await request.json();
    const { guestId } = body;

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Find event
    const event = await prisma.events.findUnique({
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
    const settings = await prisma.event_settings.findUnique({
      where: { event_id: event.id },
      select: { allow_guest_likes: true },
    });

    const allowLikes = settings?.allow_guest_likes ?? true;
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
    const photo = await prisma.photos.findFirst({
      where: {
        id: photo_id,
        event_id: event.id,
      },
      select: {
        id: true,
        likes_count: true,
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
      await prisma.photo_likes.create({
        data: {
          id: crypto.randomUUID(),
          photo_id: photo_id,
          guest_id: guestId,
        },
      });

      // Increment like count
      const updatedPhoto = await prisma.photos.update({
        where: { id: photo_id },
        data: {
          likes_count: {
            increment: 1,
          },
        },
        select: {
          likes_count: true,
        },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likes_count: updatedPhoto.likes_count,
      });
    } catch (error: unknown) {
      // Handle duplicate like (unique constraint violation)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        // Already liked, return current count
        return NextResponse.json({
          success: true,
          liked: true,
          likes_count: photo.likes_count,
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
    const { eventSlug, photo_id } = await params;
    const body = await request.json();
    const { guestId } = body;

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Find event
    const event = await prisma.events.findUnique({
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
    const photo = await prisma.photos.findFirst({
      where: {
        id: photo_id,
        event_id: event.id,
      },
      select: {
        id: true,
        likes_count: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete like
    const deletedLike = await prisma.photo_likes.deleteMany({
      where: {
        photo_id: photo_id,
        guest_id: guestId,
      },
    });

    // Decrement like count if like was actually deleted
    if (deletedLike.count > 0) {
      const updatedPhoto = await prisma.photos.update({
        where: { id: photo_id },
        data: {
          likes_count: {
            decrement: 1,
          },
        },
        select: {
          likes_count: true,
        },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        likes_count: Math.max(0, updatedPhoto.likes_count), // Ensure non-negative
      });
    }

    // Like didn't exist, return current count
    return NextResponse.json({
      success: true,
      liked: false,
      likes_count: photo.likes_count,
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
