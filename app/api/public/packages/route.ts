import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch packages for public (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')

    // Fetch categories with packages
    const categories = await prisma.packageCategory.findMany({
      where: {
        isActive: true,
      },
      include: {
        packages: {
          where: {
            isActive: true,
            ...(categorySlug ? { category: { slug: categorySlug } } : {}),
          },
          orderBy: [
            { displayOrder: 'asc' },
            { createdAt: 'desc' },
          ],
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    // Fetch additional services
    const additionalServices = await prisma.additionalService.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json({
      categories,
      additionalServices,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
