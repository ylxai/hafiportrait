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
    const photo_id = searchParams.get('photo_id');
    const status = searchParams.get('status') || 'approved';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Find event
    const event = await prisma.events.findUnique({
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
        event_id: event.id,
        ...(photo_id && { photo_id }),
        status,
      },
      select: {
        id: true,
        guest_name: true,
        message: true,
        relationship: true,
        attendance_status: true,
        created_at: true,
        photo_id: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.comments.count({
      where: {
        event_id: event.id,
        ...(photo_id && { photo_id }),
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
    const { name, email, message, relationship, attendance, guestId, photo_id, honeypot } = body;

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
    const event = await prisma.events.findUnique({
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
    const settings = await prisma.event_settings.findUnique({
      where: { event_id: event.id },
      select: {
        allow_guest_comments: true,
        require_comment_moderation: true,
      },
    });
    const allowComments = settings?.allow_guest_comments ?? true;
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
    const validation = validateComment({ name, email, message, relationship, attendance });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitized = sanitizeComment({ name, email, message, relationship, attendance });

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
    const recentDuplicate = await prisma.comments.findFirst({
      where: {
        event_id: event.id,
        guest_id: guestId,
        message: sanitized.message,
        created_at: {
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

    // Guestbook requirements (event-level comments)
    const isGuestbook = !photo_id
    const normalizedAttendance =
      attendance === 'ATTENDING' || attendance === 'NOT_ATTENDING'
        ? attendance
        : null

    if (isGuestbook && !normalizedAttendance) {
      return NextResponse.json(
        { error: 'Attendance is required' },
        { status: 400 }
      )
    }

    // Verify photo exists if photo_id provided
    if (photo_id) {
      const photo = await prisma.photos.findFirst({
        where: {
          id: photo_id,
          event_id: event.id,
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
    const requireModeration = settings?.require_comment_moderation ?? false;
    const status = requireModeration ? 'pending' : 'approved';

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Create comment
    const comment = await prisma.comments.create({
      data: {
        id: crypto.randomUUID(),
        event_id: event.id,
        photo_id: photo_id || null,
        guest_id: guestId,
        guest_name: sanitized.name,
        email: sanitized.email || null,
        message: sanitized.message,
        relationship: sanitized.relationship || null,
        attendance_status: normalizedAttendance || 'UNKNOWN',
        status,
        ip_address: ipAddress,
        updated_at: new Date(),
      },
      select: {
        id: true,
        guest_name: true,
        message: true,
        relationship: true,
        attendance_status: true,
        status: true,
        created_at: true,
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
