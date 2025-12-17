/**
 * Public Contact Form Submission API
 * POST /api/public/contact-form
 * 
 * SECURITY ENHANCEMENTS:
 * - Comprehensive input validation with Zod
 * - Rate limiting to prevent spam
 * - Input sanitization
 * - SQL injection protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactFormSchema } from '@/lib/validation/api-schemas';
import { handleError } from '@/lib/errors/handler';
import { checkRateLimit, getClientIdentifier } from '@/lib/security/rate-limiter';
// Note: Using custom rate limit config instead of presets
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - prevent spam submissions
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // Max 5 submissions per hour
      keyPrefix: 'rate-limit:contact-form',
    });

    if (!rateLimitResult.success) {
      const resetInMinutes = Math.ceil((rateLimitResult.reset * 1000 - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: `Too many submissions. Please try again in ${resetInMinutes} minutes.`,
          resetAt: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();

    // 3. Validate with Zod schema (includes sanitization)
    const validatedData = contactFormSchema.parse(body);

    // 4. Additional security checks
    // Check for suspicious patterns (basic spam detection)
    const suspiciousPatterns = [
      /https?:\/\//gi, // URLs in message
      /<script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
    ];

    const messageContent = validatedData.message || '';
    const hasSuspiciousContent = suspiciousPatterns.some(pattern =>
      pattern.test(messageContent)
    );

    if (hasSuspiciousContent) {
    }

    // 5. Get client metadata for tracking
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Log submission for monitoring (IP tracking for security)
    console.log(`📝 Contact form submission from ${ipAddress}: ${validatedData.name} <${validatedData.email}>`);

    // 6. Create form submission in database
    const submission = await prisma.form_submissions.create({
      data: {
        name: validatedData.name,
        whatsapp: validatedData.whatsapp,
        email: validatedData.email,
        package_interest: validatedData.package || null,
        wedding_date: validatedData.date || null,
        message: validatedData.message || null,
        status: hasSuspiciousContent ? 'pending' : 'new',
        notes: hasSuspiciousContent ? 'Flagged for review - suspicious content' : null,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        status: true,
      },
    });

    // 7. Log successful submission
    // TODO: Send notifications
    // - WhatsApp notification to admin
    // - Auto-response email to client

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Terima kasih! Kami akan segera menghubungi Anda.',
        submissionId: submission.id,
      },
      { status: 201 }
    );

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data provided',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('❌ Contact form submission error:', error);
    return handleError(error);
  }
}
