import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { handleError } from '@/lib/errors/handler'
import { generateAccessCode } from '@/lib/utils/slug'
import { z } from 'zod'

// Validation schema
const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  eventDate: z.string().optional(),
  description: z.string().max(500).optional(),
  location: z.string().optional(),
  coupleName: z.string().max(200).optional(),
  storageDurationDays: z.number().min(30).max(365).default(30),
  autoGenerateAccessCode: z.boolean().default(true),
})

// GET - List all events
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    // Get total count
    const total = await prisma.event.count({ where })

    // Get events with pagination
    const events = await prisma.event.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        eventDate: true,
        location: true,
        accessCode: true,
        qrCodeUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            photos: true,
            comments: true,
          },
        },
      },
    })

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    // Check if slug is unique
    const existingEvent = await prisma.event.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingEvent) {
      return NextResponse.json(
        { error: 'An event with this slug already exists' },
        { status: 409 }
      )
    }

    // Generate access code
    let accessCode = generateAccessCode()
    
    // Ensure access code is unique
    let existingCode = await prisma.event.findUnique({
      where: { accessCode },
    })
    
    while (existingCode) {
      accessCode = generateAccessCode()
      existingCode = await prisma.event.findUnique({
        where: { accessCode },
      })
    }

    // Calculate expiration date
    let expiresAt = null
    if (validatedData.eventDate) {
      const eventDate = new Date(validatedData.eventDate)
      expiresAt = new Date(
        eventDate.getTime() +
          validatedData.storageDurationDays * 24 * 60 * 60 * 1000
      )
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        accessCode,
        clientEmail: validatedData.clientEmail,
        clientPhone: validatedData.clientPhone,
        eventDate: validatedData.eventDate
          ? new Date(validatedData.eventDate)
          : null,
        description: validatedData.description,
        location: validatedData.location,
        storageDurationDays: validatedData.storageDurationDays,
        expiresAt,
        status: 'DRAFT',
        clientId: user.userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        accessCode: true,
        status: true,
        eventDate: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Event created successfully',
        event,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return handleError(error)
  }
}
