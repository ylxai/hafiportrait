import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hafiportrait-gallery-secret-key-change-in-production'
);

const COOKIE_NAME_PREFIX = 'gallery_access_';
const TOKEN_EXPIRY_DAYS = 30;

export interface GalleryTokenPayload extends JWTPayload {
  eventId: string;
  eventSlug: string;
  sessionId: string;
}

/**
 * Create a guest session token for gallery access
 */
export async function createGalleryToken(
  eventId: string,
  eventSlug: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
  const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Create JWT token
  const token = await new SignJWT({
    eventId,
    eventSlug,
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
    .sign(JWT_SECRET);

  // Store session in database
  await prisma.guestSession.create({
    data: {
      sessionId,
      eventId,
      guestToken: token,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  return { token, sessionId, expiresAt };
}

/**
 * Verify and decode a gallery token
 */
export async function verifyGalleryToken(token: string): Promise<GalleryTokenPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload;
    
    // Validate payload structure
    if (
      typeof payload.eventId === 'string' &&
      typeof payload.eventSlug === 'string' &&
      typeof payload.sessionId === 'string'
    ) {
      return payload as GalleryTokenPayload;
    }
    
    return null;
  } catch (error) {
    console.error('Gallery token verification failed:', error);
    return null;
  }
}

/**
 * Get current gallery session from cookies
 */
export async function getGallerySession(eventId: string): Promise<GalleryTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(`${COOKIE_NAME_PREFIX}${eventId}`)?.value;

  if (!token) {
    return null;
  }

  return verifyGalleryToken(token);
}

/**
 * Set gallery access cookie
 */
export async function setGalleryAccessCookie(
  eventId: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(`${COOKIE_NAME_PREFIX}${eventId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Clear gallery access cookie
 */
export async function clearGalleryAccessCookie(eventId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`${COOKIE_NAME_PREFIX}${eventId}`);
}

/**
 * Validate access code and create session
 */
export async function validateAccessCode(
  slug: string,
  accessCode: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; event?: any; token?: string; expiresAt?: Date; error?: string }> {
  // Find event by slug
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      photos: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!event) {
    return { success: false, error: 'Event not found' };
  }

  // Check if event is archived
  if (event.status === 'ARCHIVED') {
    return { success: false, error: 'This event has been archived' };
  }

  // Validate access code (case-insensitive)
  if (event.accessCode.toUpperCase() !== accessCode.toUpperCase()) {
    return { success: false, error: 'Invalid access code' };
  }

  // Create gallery token
  const { token, expiresAt } = await createGalleryToken(
    event.id,
    event.slug,
    ipAddress,
    userAgent
  );

  return {
    success: true,
    event,
    token,
    expiresAt,
  };
}

/**
 * Update session last access time
 */
export async function updateSessionLastAccess(sessionId: string): Promise<void> {
  await prisma.guestSession.update({
    where: { sessionId },
    data: { lastAccessAt: new Date() },
  });
}

/**
 * Get or create guest ID for tracking (stored in cookie)
 */
export async function getOrCreateGuestId(): Promise<string> {
  const cookieStore = await cookies();
  let guestId = cookieStore.get('guest_id')?.value;

  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    cookieStore.set('guest_id', guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
    });
  }

  return guestId;
}
