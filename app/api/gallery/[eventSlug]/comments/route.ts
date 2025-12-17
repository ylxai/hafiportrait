/**
 * Comments API Endpoint
 * Handles comment submission and retrieval for guest galleries
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getGallerySession } from '@/lib/gallery/auth';
import { checkRateLimit, RateLimitPresets, getClientIdentifier } from '@/lib/security/rate-limiter';
import {
  validateComment,
  sanitizeComment,
  containsProfanity,
  isSpam,
} from '@/lib/validation/comment-validation';

interface RouteParams {
  params: Promise<{
    eventSlug: string;
  }>;
}

/**
 * GET - Fetch comments for an event
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventSlug } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    const status = searchParams.get('status') || 'approved';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Find event
    const event = await prisma.event.findUnique({
      where: { slug: eventSlug },
      select: { id: true },
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

    // Fetch comments
    const comments = await prisma.comments.findMany({
      where: {
        eventId: event.id,
        ...(photoId && { photoId }),
        status,
      },
      select: {
        id: true,
        guestName: true,
        message: true,
        relationship: true,
        createdAt: true,
        photoId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.comments.count({
      where: {
        eventId: event.id,
        ...(photoId && { photoId }),
        status,
      },
    });

    return NextResponse.json({
      comments,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST - Submit a new comment
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventSlug } = await params;
    const body = await request.json();
    const { name, email, message, relationship, guestId, photoId, honeypot } = body;

    // Honeypot check (simple bot detection)
    if (honeypot) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

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

    // Check if comments are enabled
    const settings = await prisma.eventSettings.findUnique({
      where: { eventId: event.id },
      select: { 
        allowGuestComments: true,
        requireCommentModeration: true,
      },
    });
    const allowComments = settings?.allowGuestComments ?? true;
    if (!allowComments) {
      return NextResponse.json(
        { error: 'Comments are disabled for this event' },
        { status: 403 }
      );
    }

    // Rate limiting: 5 comments per minute per guest - FIXED: Use centralized rate limiter
    const identifier = `${getClientIdentifier(request)}:${guestId}`;
    const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.GALLERY_COMMENT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // Validate input
    const validation = validateComment({ name, email, message, relationship });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitized = sanitizeComment({ name, email, message, relationship });

    // Check for spam and profanity
    if (isSpam(sanitized.message)) {
      return NextResponse.json(
        { error: 'Message appears to be spam' },
        { status: 400 }
      );
    }

    if (containsProfanity(sanitized.message)) {
      return NextResponse.json(
        { error: 'Message contains inappropriate content' },
        { status: 400 }
      );
    }

    // Check for duplicate recent comment
    const recentDuplicate = await prisma.comment.findFirst({
      where: {
        eventId: event.id,
        guestId,
        message: sanitized.message,
        createdAt: {
          gte: new Date(Date.now() - 60000), // Last 1 minute
        },
      },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        { error: 'Duplicate comment detected' },
        { status: 400 }
      );
    }

    // Verify photo exists if photoId provided
    if (photoId) {
      const photo = await prisma.photo.findFirst({
        where: {
          id: photoId,
          eventId: event.id,
        },
      });

      if (!photo) {
        return NextResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        );
      }
    }

    // Determine comment status
    const requireModeration = settings?.requireCommentModeration ?? false;
    const status = requireModeration ? 'pending' : 'approved';

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        eventId: event.id,
        photoId: photoId || null,
        guestId,
        guestName: sanitized.name,
        email: sanitized.email || null,
        message: sanitized.message,
        relationship: sanitized.relationship || null,
        status,
        ipAddress,
      },
      select: {
        id: true,
        guestName: true,
        message: true,
        relationship: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      comment,
      requiresModeration: status === 'pending',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
