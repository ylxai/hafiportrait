/**
 * Event Analytics API
 * Provides engagement analytics data for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getEventEngagementAnalytics,
  getTopLikedPhotos,
  detectBulkLikePatterns,
  exportEngagementData,
} from '@/lib/services/engagement-analytics';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET - Get event analytics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'export':
        const csvData = await exportEngagementData(eventId);
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="engagement-${eventId}.csv"`,
          },
        });

      case 'top-photos':
        const topPhotos = await getTopLikedPhotos(eventId, limit);
        return NextResponse.json({ topPhotos });

      case 'detect-abuse':
        const suspiciousGuests = await detectBulkLikePatterns(eventId);
        return NextResponse.json({ suspiciousGuests });

      default:
        // Get comprehensive analytics
        const analytics = await getEventEngagementAnalytics(eventId, {
          limit,
        });
        return NextResponse.json(analytics);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
