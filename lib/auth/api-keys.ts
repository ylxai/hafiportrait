/**
 * API Key Management System
 * Generate, validate, and manage API keys for automation clients
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const API_KEY_PREFIX = 'hpk_'; // hafiportrait key
const API_KEY_LENGTH = 32;

/**
 * Generate a new API key
 * Format: hpk_{random_hex}
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH).toString('hex');
  return `${API_KEY_PREFIX}${randomBytes}`;
}

/**
 * Hash API key for secure storage
 * Using SHA-256 for fast lookup
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Extract prefix for display (first 15 chars)
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 15);
}

/**
 * Create a new API key for a user
 * 
 * @param userId - User ID who owns the key
 * @param name - Descriptive name for the key (e.g., "Python Upload Script")
 * @param expiresInDays - Expiry in days (default: 365)
 * @returns Object with plaintext key (shown once) and key record
 */
export async function createApiKey(
  userId: string,
  name: string,
  expiresInDays: number = 365
) {
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const keyPrefix = getKeyPrefix(apiKey);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  const apiKeyRecord = await prisma.api_keys.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      expires_at: expiresAt,
      created_at: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
  
  logger.info('API key created', {
    keyId: apiKeyRecord.id,
    userId,
    name,
    prefix: keyPrefix,
    expiresAt
  });
  
  // Return plaintext key ONCE - cannot be retrieved again
  return {
    apiKey, // Full plaintext key - show this ONCE to user
    keyRecord: {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      key_prefix: apiKeyRecord.key_prefix,
      expires_at: apiKeyRecord.expires_at,
      created_at: apiKeyRecord.created_at,
      user: apiKeyRecord.user
    }
  };
}

/**
 * Validate API key and return associated user
 * Also updates last_used_at timestamp
 * 
 * @param apiKey - The plaintext API key from request
 * @returns User object if valid, null if invalid/expired
 */
export async function validateApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }
  
  const keyHash = hashApiKey(apiKey);
  
  const apiKeyRecord = await prisma.api_keys.findUnique({
    where: {
      key_hash: keyHash
    },
    include: {
      user: true
    }
  });
  
  if (!apiKeyRecord) {
    logger.warn('API key not found', { keyHash: keyHash.substring(0, 10) });
    return null;
  }
  
  // Check if expired
  if (apiKeyRecord.expires_at < new Date()) {
    logger.warn('API key expired', {
      keyId: apiKeyRecord.id,
      expiredAt: apiKeyRecord.expires_at
    });
    return null;
  }
  
  // Check if revoked
  if (apiKeyRecord.revoked_at) {
    logger.warn('API key revoked', {
      keyId: apiKeyRecord.id,
      revokedAt: apiKeyRecord.revoked_at
    });
    return null;
  }
  
  // Update last used timestamp (fire and forget)
  prisma.api_keys.update({
    where: { id: apiKeyRecord.id },
    data: { last_used_at: new Date() }
  }).catch((error: Error) => {
    logger.error('Failed to update API key last_used_at', { error });
  });
  
  logger.debug('API key validated successfully', {
    keyId: apiKeyRecord.id,
    userId: apiKeyRecord.user_id,
    name: apiKeyRecord.name
  });
  
  return {
    user_id: apiKeyRecord.user.id,
    email: apiKeyRecord.user.email,
    name: apiKeyRecord.user.name,
    role: apiKeyRecord.user.role,
    keyId: apiKeyRecord.id,
    keyName: apiKeyRecord.name
  };
}

/**
 * List all API keys for a user
 */
export async function listApiKeys(userId: string) {
  const keys = await prisma.api_keys.findMany({
    where: {
      user_id: userId
    },
    orderBy: {
      created_at: 'desc'
    },
    select: {
      id: true,
      name: true,
      key_prefix: true,
      last_used_at: true,
      expires_at: true,
      revoked_at: true,
      created_at: true
    }
  });
  
  return keys;
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string) {
  const apiKey = await prisma.api_keys.findFirst({
    where: {
      id: keyId,
      user_id: userId
    }
  });
  
  if (!apiKey) {
    throw new Error('API key not found or unauthorized');
  }
  
  if (apiKey.revoked_at) {
    throw new Error('API key already revoked');
  }
  
  await prisma.api_keys.update({
    where: { id: keyId },
    data: { revoked_at: new Date() }
  });
  
  logger.info('API key revoked', {
    keyId,
    userId,
    name: apiKey.name
  });
  
  return true;
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(keyId: string, userId: string) {
  const apiKey = await prisma.api_keys.findFirst({
    where: {
      id: keyId,
      user_id: userId
    }
  });
  
  if (!apiKey) {
    throw new Error('API key not found or unauthorized');
  }
  
  await prisma.api_keys.delete({
    where: { id: keyId }
  });
  
  logger.info('API key deleted', {
    keyId,
    userId,
    name: apiKey.name
  });
  
  return true;
}
