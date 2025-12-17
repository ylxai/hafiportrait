import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Public endpoint to fetch portfolio photos
export async function GET() {
  try {
    const portfolioPhotos = await prisma.portfolio_photos.findMany({
      orderBy: {
        display_order: 'asc',
      },
      select: {
        id: true,
        filename: true,
        original_url: true,
        thumbnail_url: true,
        display_order: true,
        is_featured: true,
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
