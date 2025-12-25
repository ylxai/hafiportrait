/**
 * API Key Individual Operations
 * GET, PATCH, DELETE /api/admin/api-keys/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get single API key details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const apiKey = await prisma.api_keys.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        created_at: true,
        last_used_at: true,
        expires_at: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ apiKey });

  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json(
      { error: 'Failed to get API key' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update API key
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, permissions, expires_at } = body;

    // Check if API key exists
    const existingKey = await prisma.api_keys.findUnique({
      where: { id },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Update API key
    const updatedKey = await prisma.api_keys.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(permissions && { permissions }),
        ...(expires_at && { expires_at: new Date(expires_at) }),
      },
      select: {
        id: true,
        name: true,
        key_hash: true,
        permissions: true,
        created_at: true,
        last_used_at: true,
        expires_at: true,
      },
    });

    return NextResponse.json({
      message: 'API key updated successfully',
      apiKey: updatedKey,
    });

  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Revoke/delete API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if API key exists
    const existingKey = await prisma.api_keys.findUnique({
      where: { id },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete API key
    await prisma.api_keys.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'API key deleted successfully',
    });

  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
