import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { handleError } from '@/lib/errors/handler'
import { generateAccessCode } from '@/lib/utils/slug'
import { EventListApiResponse, EventApiResponse } from '@/lib/types/api'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Validation schema
const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  client_email: z.string().email(),
  client_phone: z.string().optional(),
  event_date: z.string().optional(),
  description: z.string().max(500).optional(),
  location: z.string().optional(),
  coupleName: z.string().max(200).optional(),
  storage_duration_days: z.number().min(30).max(365).default(30),
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
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause with proper Prisma types
    const where: Prisma.eventsWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status !== 'all') {
      where.status = status.toUpperCase() as Prisma.EnumEventStatusFilter
    }

    // Get total count
    const total = await prisma.events.count({ where })

    // Get events with pagination
    const events = await prisma.events.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        event_date: true,
        location: true,
        access_code: true,
        qr_code_url: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            photos: true,
            comments: true,
          },
        },
      },
    })

    // Transform events data to match interface
    const transformedEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      description: null, // Not selected in this query
      date: event.event_date?.toISOString() || event.created_at.toISOString(),
      slug: event.slug,
      access_code: event.access_code,
      is_active: event.status === 'ACTIVE',
      cover_photo_id: null, // TODO: Add cover photo logic
      coverPhotoUrl: null,
      photosCount: event._count.photos,
      views_count: 0, // TODO: Implement analytics
      downloadsCount: 0, // TODO: Implement analytics
      created_at: event.created_at.toISOString(),
      updated_at: event.updated_at.toISOString(),
    }))

    // Return events array directly for frontend compatibility
    return NextResponse.json(transformedEvents)
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
    const existingEvent = await prisma.events.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingEvent) {
      return NextResponse.json(
        { error: 'An event with this slug already exists' },
        { status: 409 }
      )
    }

    // Generate access code
    let access_code = generateAccessCode()

    // Ensure access code is unique
    let existingCode = await prisma.events.findUnique({
      where: { access_code },
    })

    while (existingCode) {
      access_code = generateAccessCode()
      existingCode = await prisma.events.findUnique({
        where: { access_code },
      })
    }

    // Calculate expiration date
    let expiresAt = null
    if (validatedData.event_date) {
      const event_date = new Date(validatedData.event_date)
      expiresAt = new Date(
        event_date.getTime() +
        validatedData.storage_duration_days * 24 * 60 * 60 * 1000
      )
    }

    // Create event
    const event = await prisma.events.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name,
        slug: validatedData.slug,
        access_code,
        client_email: validatedData.client_email,
        client_phone: validatedData.client_phone,
        event_date: validatedData.event_date
          ? new Date(validatedData.event_date)
          : null,
        description: validatedData.description,
        location: validatedData.location,
        storage_duration_days: validatedData.storage_duration_days,
        expires_at: expiresAt,
        status: 'DRAFT',
        client_id: user.user_id,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        access_code: true,
        status: true,
        event_date: true,
        created_at: true,
      },
    })

    // Transform created event to match interface
    const transformedEvent = {
      id: event.id,
      name: event.name,
      description: null,
      date: event.event_date?.toISOString() || event.created_at.toISOString(),
      slug: event.slug,
      access_code: event.access_code,
      is_active: event.status === 'ACTIVE',
      cover_photo_id: null,
      coverPhotoUrl: null,
      photosCount: 0,
      views_count: 0,
      downloadsCount: 0,
      created_at: event.created_at.toISOString(),
      updated_at: event.created_at.toISOString(),
    }

    const response: EventApiResponse = {
      success: true,
      data: transformedEvent,
      message: 'Event created successfully'
    }

    return NextResponse.json(response, { status: 201 })
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
