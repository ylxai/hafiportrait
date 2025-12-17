import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch packages for public (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')

    // Fetch categories with packages
    const categories = await prisma.package_categories.findMany({
      where: {
        is_active: true,
      },
      include: {
        packages: {
          where: {
            is_active: true,
            ...(categorySlug ? { category: { slug: categorySlug } } : {}),
          },
          orderBy: [
            { display_order: 'asc' },
            { created_at: 'desc' },
          ],
        },
      },
      orderBy: {
        display_order: 'asc',
      },
    })

    // Fetch additional services
    const additionalServices = await prisma.additional_services.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        display_order: 'asc',
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
