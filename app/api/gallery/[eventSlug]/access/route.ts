import { NextRequest, NextResponse } from 'next/server';
import { validateAccessCode, validateEventAccess, setGalleryAccessCookie } from '@/lib/gallery/auth';
import { getRequestOrigin } from '@/lib/utils/request-origin';
import { checkRateLimit, RateLimitPresets, getClientIdentifier } from '@/lib/security/rate-limiter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await params;
    const body = await request.json();
    const { access_code } = body;
    
    // Check rate limit
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

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    let result;

    // If access_code provided, validate strictly. If not, validate by slug only.
    if (access_code && typeof access_code === 'string') {
      const cleanCode = access_code.trim().toUpperCase();
      // Basic format check
      if (/^[A-Z0-9]{6}$/.test(cleanCode)) {
         result = await validateAccessCode(eventSlug, cleanCode, ipAddress, userAgent);
      } else {
         // If code format is invalid, try falling back to direct access or return error
         // For now, let's treat invalid code format as a reason to fail if code WAS provided
         return NextResponse.json({ error: 'Invalid access code format' }, { status: 400 });
      }
    } else {
      // Direct access without code
      result = await validateEventAccess(eventSlug, ipAddress, userAgent);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Access denied' },
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
        event_date: result.event!.event_date,
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

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    let result;

    if (code) {
       // Validate strictly if code provided
       result = await validateAccessCode(eventSlug, code, ipAddress, userAgent);
    } else {
       // Validate by slug only (direct access)
       result = await validateEventAccess(eventSlug, ipAddress, userAgent);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Access denied' },
        { status: 401 }
      );
    }

    // Set cookie
    if (result.token && result.expiresAt) {
      await setGalleryAccessCookie(result.event!.id, result.token, result.expiresAt);
    }

    // Redirect to gallery (use forwarded host/proto to avoid localhost redirects behind proxy)
    return NextResponse.redirect(new URL(`/${eventSlug}/gallery`, getRequestOrigin(request)));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate access code' },
      { status: 500 }
    );
  }
}
