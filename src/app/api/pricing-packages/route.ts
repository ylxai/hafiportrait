import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const packages = await database.getActivePricingPackages();
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching active pricing packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing packages' },
      { status: 500 }
    );
  }
}