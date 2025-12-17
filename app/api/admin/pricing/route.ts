/**
 * Pricing Package Management API
 * GET /api/admin/pricing - List all pricing packages
 * POST /api/admin/pricing - Create new pricing package
 * PUT /api/admin/pricing - Update pricing package
 * DELETE /api/admin/pricing - Delete pricing package
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { Prisma } from '@prisma/client';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') === 'true';

    const where: Prisma.pricing_packagesWhereInput = {};
    if (category) where.category = category;
    if (activeOnly) where.is_active = true;

    const packages = await prisma.pricing_packages.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching pricing packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      category,
      price,
      currency = 'IDR',
      description,
      duration,
      shot_count,
      features,
      is_active = true,
    } = body;

    // Validate required fields
    if (!name || !category || !price) {
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = slugify(name);
    let slugExists = await prisma.pricing_packages.findUnique({
      where: { slug },
    });

    let counter = 1;
    while (slugExists) {
      slug = `${slugify(name)}-${counter}`;
      slugExists = await prisma.pricing_packages.findUnique({
        where: { slug },
      });
      counter++;
    }

    // Get max display order
    const maxOrder = await prisma.pricing_packages.findFirst({
      where: { category },
      orderBy: { display_order: 'desc' },
      select: { display_order: true },
    });

    const display_order = (maxOrder?.display_order ?? -1) + 1;

    // Create package
    const package_ = await prisma.pricing_packages.create({
      data: {
        id: crypto.randomUUID(),
        name,
        slug,
        category,
        price,
        currency,
        description,
        duration,
        shot_count,
        features: features || [],
        is_active,
        display_order,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      package: package_,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create pricing package' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, packageIds, updates } = body;

    if (action === 'reorder' && Array.isArray(packageIds)) {
      // Bulk reorder packages
      const updatePromises = packageIds.map((packageId, index) =>
        prisma.pricing_packages.update({
          where: { id: packageId },
          data: { display_order: index },
        })
      );
      await Promise.all(updatePromises);

      return NextResponse.json({
        success: true,
        message: 'Packages reordered successfully',
      });
    }

    if (action === 'update' && updates) {
      // Single package update
      const { id, name, ...data } = updates;

      // If name changed, regenerate slug
      let updateData: any = data;
      if (name) {
        updateData.name = name;

        const existingPackage = await prisma.pricing_packages.findUnique({
          where: { id },
        });

        if (existingPackage && existingPackage.name !== name) {
          let newSlug = slugify(name);
          let slugExists = await prisma.pricing_packages.findFirst({
            where: {
              slug: newSlug,
              NOT: { id },
            },
          });

          let counter = 1;
          while (slugExists) {
            newSlug = `${slugify(name)}-${counter}`;
            slugExists = await prisma.pricing_packages.findFirst({
              where: {
                slug: newSlug,
                NOT: { id },
              },
            });
            counter++;
          }
          updateData.slug = newSlug;
        }
      }

      const package_ = await prisma.pricing_packages.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        package: package_,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update pricing package' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('id');

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID required' },
        { status: 400 }
      );
    }

    await prisma.pricing_packages.delete({
      where: { id: packageId },
    });

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete pricing package' },
      { status: 500 }
    );
  }
}
