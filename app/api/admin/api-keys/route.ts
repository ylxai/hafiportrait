/**
 * API Keys Management Endpoint
 * Allows admins to create, list, and manage API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { 
  createApiKey, 
  listApiKeys, 
  revokeApiKey
} from '@/lib/auth/api-keys';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * GET /api/admin/api-keys
 * List all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    const apiKeys = await listApiKeys(user.user_id);
    
    return NextResponse.json({
      success: true,
      data: apiKeys
    });
    
  } catch (error) {
    logger.error('Failed to list API keys', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

const createKeySchema = z.object({
  name: z.string().min(3).max(100),
  expiresInDays: z.number().int().min(1).max(730).optional().default(365)
});

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validation = createKeySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }
    
    const { name, expiresInDays } = validation.data;
    
    const result = await createApiKey(user.user_id, name, expiresInDays);
    
    logger.info('API key created successfully', {
      userId: user.user_id,
      keyId: result.keyRecord.id,
      name
    });
    
    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key now - you will not see it again!',
      data: {
        apiKey: result.apiKey, // Plaintext key - shown ONCE
        keyRecord: result.keyRecord
      }
    }, { status: 201 });
    
  } catch (error) {
    logger.error('Failed to create API key', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

const revokeKeySchema = z.object({
  keyId: z.string().uuid()
});

/**
 * DELETE /api/admin/api-keys
 * Revoke or delete an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validation = revokeKeySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }
    
    const { keyId } = validation.data;
    
    // Revoke instead of delete (soft delete)
    await revokeApiKey(keyId, user.user_id);
    
    logger.info('API key revoked successfully', {
      userId: user.user_id,
      keyId
    });
    
    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    });
    
  } catch (error) {
    logger.error('Failed to revoke API key', { error });
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
