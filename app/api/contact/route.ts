import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { sanitizeHtml } from '@/lib/security/sanitize'

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(20).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = contactSchema.parse(body)

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeHtml(validatedData.name),
      email: validatedData.email.toLowerCase().trim(),
      phone: validatedData.phone ? sanitizeHtml(validatedData.phone) : null,
      message: sanitizeHtml(validatedData.message),
    }

    // Save to database
    const contactMessage = await prisma.contact_messages.create({
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        message: sanitizedData.message,
        status: 'new',
        id: crypto.randomUUID(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        id: contactMessage.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send message',
      },
      { status: 500 }
    )
  }
}
