import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Public endpoint to fetch portfolio photos
export async function GET() {
  try {
    const portfolioPhotos = await prisma.portfolioPhoto.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        thumbnailUrl: true,
        displayOrder: true,
        isFeatured: true,
        category: true,
        description: true,
      },
    })

    return NextResponse.json({
      success: true,
      photos: portfolioPhotos,
      count: portfolioPhotos.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch portfolio photos',
      },
      { status: 500 }
    )
  }
}
