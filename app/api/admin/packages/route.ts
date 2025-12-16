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
    const categoryId = searchParams.get('categoryId')

    const packages = await prisma.package.findMany({
      where: categoryId ? { categoryId } : {},
      include: {
        category: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ packages })
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
      isBestSeller,
      isActive,
      displayOrder,
      categoryId,
    } = body

    const package_ = await prisma.package.create({
      data: {
        name,
        description: description || null,
        price: parseInt(price),
        features: features || [],
        isBestSeller: isBestSeller || false,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
        categoryId,
      },
      include: {
        category: true,
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

    const package_ = await prisma.package.update({
      where: { id },
      data: updates,
      include: {
        category: true,
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

    await prisma.package.delete({
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
