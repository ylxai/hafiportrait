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
    const { id: event_id } = await params;
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: event_id },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Build where clause
    const whereClause: any = {
      event_id,
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    // Fetch comments
    const comments = await prisma.comments.findMany({
      where: whereClause,
      select: {
        id: true,
        guestName: true,
        email: true,
        message: true,
        relationship: true,
        status: true,
        ipAddress: true,
        created_at: true,
        photo_id: true,
        photo: {
          select: {
            filename: true,
            thumbnail_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get counts by status
    const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.comments.count({ where: { event_id } }),
      prisma.comments.count({ where: { event_id, status: 'pending' } }),
      prisma.comments.count({ where: { event_id, status: 'approved' } }),
      prisma.comments.count({ where: { event_id, status: 'rejected' } }),
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
    const { id: event_id } = await params;
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
    const event = await prisma.events.findUnique({
      where: { id: event_id },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Perform action
    if (action === 'delete') {
      await prisma.comments.deleteMany({
        where: {
          id: { in: commentIds },
          event_id,
        },
      });
    } else {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      await prisma.comments.updateMany({
        where: {
          id: { in: commentIds },
          event_id,
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
    const { id: event_id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'export') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: event_id },
      select: { id: true, name: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch all comments
    const comments = await prisma.comments.findMany({
      where: { event_id },
      select: {
        id: true,
        guestName: true,
        email: true,
        message: true,
        relationship: true,
        status: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Create CSV
    let csv = 'ID,Name,Email,Message,Relationship,Status,Created At\n';
    comments.forEach((comment) => {
      csv += `${comment.id},"${comment.guestName}","${comment.email || ''}","${comment.message.replace(/"/g, '""')}","${comment.relationship || ''}","${comment.status}","${comment.created_at.toISOString()}"\n`;
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
