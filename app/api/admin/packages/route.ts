import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

// GET - Fetch all packages
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category_id = searchParams.get('category_id')

    const packages = await prisma.packages.findMany({
      where: category_id ? { category_id } : {},
      include: {
        package_categories: true,
      },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' },
      ],
    })

    // Return packages array directly for frontend compatibility
    return NextResponse.json(packages)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

// POST - Create new package
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      features,
      is_best_seller,
      is_active,
      display_order,
      category_id,
    } = body

    const package_ = await prisma.packages.create({
      data: {
        name,
        description: description || null,
        price: parseInt(price),
        features: features || [],
        is_best_seller: is_best_seller || false,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
        category_id,
        updated_at: new Date(),
      },
      include: {
        package_categories: true,
      },
    })

    return NextResponse.json({ package: package_ }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}

// PUT - Update package
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Convert price to integer if provided
    if (updates.price) {
      updates.price = parseInt(updates.price)
    }

    const package_ = await prisma.packages.update({
      where: { id },
      data: updates,
      include: {
        package_categories: true,
      },
    })

    return NextResponse.json({ package: package_ })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    )
  }
}

// DELETE - Delete package
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    await prisma.packages.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    )
  }
}
