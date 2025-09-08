import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { packages } = body;

    if (!packages || !Array.isArray(packages)) {
      return NextResponse.json(
        { error: 'Invalid packages data' },
        { status: 400 }
      );
    }

    // Validate packages structure
    for (const pkg of packages) {
      if (!pkg.id || typeof pkg.sort_order !== 'number') {
        return NextResponse.json(
          { error: 'Invalid package structure' },
          { status: 400 }
        );
      }
    }

    // Update sort orders using database service
    try {
      // Update each package's sort order
      for (const pkg of packages) {
        await database.updatePricingPackage(pkg.id, { sort_order: pkg.sort_order });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Package order updated successfully' 
      });
      
    } catch (error) {
      console.error('Error updating sort orders:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error reordering packages:', error);
    return NextResponse.json(
      { error: 'Failed to reorder packages' },
      { status: 500 }
    );
  }
}