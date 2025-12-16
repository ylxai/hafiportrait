import { NextRequest, NextResponse } from 'next/server';
import { validateAccessCode, setGalleryAccessCookie } from '@/lib/gallery/auth';
import { checkRateLimit, RateLimitPresets, getClientIdentifier } from '@/lib/security/rate-limiter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await params;
    const body = await request.json();
    const { accessCode, password } = body;
    
    // TODO: Implement password protection for events
    // if (event.requirePasswordAccess && password !== event.accessPassword) {
    //   return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    // }

    // Check rate limit - FIXED: Use centralized rate limiter
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.GALLERY_ACCESS);
    
    if (!rateLimitResult.success) {
      const resetInMinutes = Math.ceil((rateLimitResult.reset * 1000 - Date.now()) / 60000);
      return NextResponse.json(
        { 
          error: `Too many attempts. Please try again in ${resetInMinutes} minutes.`,
          resetAt: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // Validate input
    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    // Validate access code format (6 alphanumeric characters)
    const cleanCode = accessCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: 'Access code must be 6 alphanumeric characters' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Validate access code and create session
    const result = await validateAccessCode(eventSlug, cleanCode, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid access code' },
        { status: 401 }
      );
    }

    // Set cookie
    if (result.token && result.expiresAt) {
      await setGalleryAccessCookie(result.event!.id, result.token, result.expiresAt);
    }

    return NextResponse.json({
      success: true,
      event: {
        id: result.event!.id,
        name: result.event!.name,
        slug: result.event!.slug,
        eventDate: result.event!.eventDate,
        location: result.event!.location,
        description: result.event!.description,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate access code' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Validate access code
    const result = await validateAccessCode(eventSlug, code, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid access code' },
        { status: 401 }
      );
    }

    // Set cookie
    if (result.token && result.expiresAt) {
      await setGalleryAccessCookie(result.event!.id, result.token, result.expiresAt);
    }

    // Redirect to gallery
    return NextResponse.redirect(new URL(`/${eventSlug}/gallery`, request.url));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate access code' },
      { status: 500 }
    );
  }
}
