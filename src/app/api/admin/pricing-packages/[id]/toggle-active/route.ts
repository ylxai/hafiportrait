import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { is_active } = body;

    const updatedPackage = await database.togglePricingPackageActive(params.id, is_active);
    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Error toggling package active status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle package active status' },
      { status: 500 }
    );
  }
}