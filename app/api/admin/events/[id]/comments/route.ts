/**
 * Admin Comments Management API
 * Handles comment moderation actions
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET - Fetch comments for moderation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Build where clause
    const whereClause: any = {
      eventId,
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: whereClause,
      select: {
        id: true,
        guestName: true,
        email: true,
        message: true,
        relationship: true,
        status: true,
        ipAddress: true,
        createdAt: true,
        photoId: true,
        photo: {
          select: {
            filename: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get counts by status
    const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.comment.count({ where: { eventId } }),
      prisma.comment.count({ where: { eventId, status: 'pending' } }),
      prisma.comment.count({ where: { eventId, status: 'approved' } }),
      prisma.comment.count({ where: { eventId, status: 'rejected' } }),
    ]);

    return NextResponse.json({
      comments,
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update comment status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { commentIds, action } = body;

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json(
        { error: 'Comment IDs are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Perform action
    if (action === 'delete') {
      await prisma.comment.deleteMany({
        where: {
          id: { in: commentIds },
          eventId,
        },
      });
    } else {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      await prisma.comment.updateMany({
        where: {
          id: { in: commentIds },
          eventId,
        },
        data: {
          status: newStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${commentIds.length} comment(s) ${action}d successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update comments' },
      { status: 500 }
    );
  }
}

/**
 * POST - Export comments as CSV
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'export') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch all comments
    const comments = await prisma.comment.findMany({
      where: { eventId },
      select: {
        id: true,
        guestName: true,
        email: true,
        message: true,
        relationship: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Create CSV
    let csv = 'ID,Name,Email,Message,Relationship,Status,Created At\n';
    comments.forEach((comment) => {
      csv += `${comment.id},"${comment.guestName}","${comment.email || ''}","${comment.message.replace(/"/g, '""')}","${comment.relationship || ''}","${comment.status}","${comment.createdAt.toISOString()}"\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="comments-${event.name.replace(/\s+/g, '-')}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export comments' },
      { status: 500 }
    );
  }
}
