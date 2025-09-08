import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const packages = await database.getAllPricingPackages();
    return NextResponse.json(packages);
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

    const newPackage = await database.createPricingPackage(packageData);
    return NextResponse.json(newPackage);
  } catch (error) {
    console.error('Error creating pricing package:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing package' },
      { status: 500 }
    );
  }
}