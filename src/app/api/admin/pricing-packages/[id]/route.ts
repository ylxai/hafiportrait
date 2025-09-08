import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      price,
      duration,
      guests,
      photos,
      delivery,
      features,
      badge,
      is_popular,
      is_active
    } = body;

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const packageData = {
      name,
      price,
      duration: duration || null,
      guests: guests || null,
      photos: photos || null,
      delivery: delivery || null,
      features: features || [],
      badge: badge || null,
      is_popular: is_popular || false,
      is_active: is_active !== undefined ? is_active : true
    };

    const updatedPackage = await database.updatePricingPackage(params.id, packageData);
    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Error updating pricing package:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await database.deletePricingPackage(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing package:', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing package' },
      { status: 500 }
    );
  }
}