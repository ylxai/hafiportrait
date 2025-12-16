/**
 * Cloudflare R2 Storage Utility
 * 
 * Provides functions for uploading, deleting, and managing files in Cloudflare R2.
 * R2 is S3-compatible, so we use AWS SDK for S3 operations.
 * 
 * Enhanced with:
 * - Stricter filename sanitization
 * - MIME type content verification
 * - Transaction-like cleanup
 * 
 * PRODUCTION UPDATE: Increased limits for wedding photo business
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileTypeFromBuffer } from 'file-type';

// Initialize R2 client
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Supported image MIME types
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/**
 * Maximum file size in bytes (200MB for wedding photos)
 * PRODUCTION: Increased from 50MB to 200MB untuk accommodate high-res wedding photos
 */
export const MAX_FILE_SIZE = 200 * 1024 * 1024;

/**
 * Reserved filenames (Windows)
 */
const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
];

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] as const;

/**
 * Sanitize filename (Enhanced Security)
 * Removes/replaces dangerous characters and limits length
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '');
  
  // Remove directory separators
  filename = filename.replace(/[\/\\]/g, '-');
  
  // Remove null bytes and control characters
  filename = filename.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Replace whitespace with hyphens
  filename = filename.replace(/\s+/g, '-');
  
  // Remove or replace special characters (keep only alphanumeric, hyphens, underscores, dots)
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Remove multiple consecutive dots
  filename = filename.replace(/\.{2,}/g, '.');
  
  // Remove leading/trailing dots and hyphens
  filename = filename.replace(/^[.-]+|[.-]+$/g, '');
  
  // Check for reserved Windows names
  const nameWithoutExt = filename.split('.')[0].toUpperCase();
  if (RESERVED_NAMES.includes(nameWithoutExt)) {
    filename = `file-${filename}`;
  }
  
  // Limit length (leave room for UUID prefix and extension)
  const maxBaseLength = 100;
  const parts = filename.split('.');
  const ext = parts.length > 1 ? `.${parts.pop()}` : '';
  let base = parts.join('.');
  
  if (base.length > maxBaseLength) {
    base = base.substring(0, maxBaseLength);
  }
  
  return base + ext;
}

/**
 * Generate unique filename with timestamp and random suffix
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  const parts = sanitized.split('.');
  const ext = parts.length > 1 ? `.${parts.pop()}` : '';
  const base = parts.join('.');
  
  return `${base}-${timestamp}-${random}${ext}`;
}

/**
 * Build storage key path for photos
 */
export function buildPhotoStorageKey(
  eventId: string,
  filename: string,
  folder: 'originals' | 'thumbnails' = 'originals',
  size?: 'small' | 'medium' | 'large'
): string {
  if (folder === 'thumbnails' && size) {
    return `events/${eventId}/photos/thumbnails/${size}/${filename}`;
  }
  return `events/${eventId}/photos/${folder}/${filename}`;
}

/**
 * Validate MIME type
 */
export function isValidImageType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Upload file to R2 (Enhanced with MIME verification)
 * 
 * @param file - File buffer to upload
 * @param key - Storage key (path) for the file
 * @param mimeType - Expected MIME type
 * @param verifyMimeType - Whether to verify MIME type matches content (default: false for faster uploads)
 * @returns Upload result with URL or error
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  mimeType: string,
  verifyMimeType: boolean = false
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    // Validate MIME type
    if (!isValidImageType(mimeType)) {
      return {
        success: false,
        url: '',
        error: `Invalid MIME type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      };
    }

    // Validate file size
    if (!isValidFileSize(file.length)) {
      return {
        success: false,
        url: '',
        error: `File size ${file.length} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      };
    }

    // Verify MIME type matches actual content (security check) - DISABLED BY DEFAULT
    if (verifyMimeType) {
      const mimeVerification = await verifyFileType(file, mimeType);
      if (!mimeVerification.valid) {
        return {
          success: false,
          url: '',
          error: mimeVerification.error || 'MIME type verification failed',
        };
      }
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await r2Client.send(command);

    const url = `${PUBLIC_URL}/${key}`;
    return { success: true, url };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload to R2 with retry logic
 */
export async function uploadToR2WithRetry(
  file: Buffer,
  key: string,
  mimeType: string,
  maxRetries: number = 3,
  verifyMimeType: boolean = false
): Promise<{ success: boolean; url: string; error?: string }> {
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await uploadToR2(file, key, mimeType, verifyMimeType);
    
    if (result.success) {
      if (attempt > 1) {
      }
      return result;
    }
    
    lastError = result.error;
    
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`Upload failed after ${maxRetries} attempts`);
  return {
    success: false,
    url: '',
    error: lastError || 'Upload failed after multiple retries',
  };
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cleanup failed upload (delete multiple files)
 * Used for transaction-like rollback when photo creation fails
 */
export async function cleanupFailedUpload(keys: string[]): Promise<void> {
  const deletePromises = keys.map(key => deleteFromR2(key));
  const results = await Promise.allSettled(deletePromises);
  
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) {
  } else {
  }
}

/**
 * Check if file exists in R2
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error('R2 file exists check error:', error);
    return false;
  }
}

/**
 * Generate presigned URL for temporary access
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Verify file type using magic bytes (Enhanced Security)
 * Checks if actual file content matches claimed MIME type
 * 
 * @param buffer - File buffer to verify
 * @param claimedMimeType - MIME type claimed by client
 * @returns Verification result
 */
export async function verifyFileType(
  buffer: Buffer,
  claimedMimeType: string
): Promise<{ valid: boolean; actualType?: string; error?: string }> {
  try {
    // Use file-type library to detect actual MIME type from magic bytes
    const detectedType = await fileTypeFromBuffer(buffer);
    
    if (!detectedType) {
      // Cannot detect type - might be a corrupted file or unsupported format
      // For HEIC/HEIF, file-type might not detect them properly
      if (claimedMimeType === 'image/heic' || claimedMimeType === 'image/heif') {
        // Allow HEIC/HEIF to pass without strict verification
        return { valid: true, actualType: claimedMimeType };
      }
      
      return {
        valid: false,
        error: 'Could not detect file type from content',
      };
    }

    const actualMimeType = detectedType.mime;
    
    // Normalize MIME types for comparison (jpg vs jpeg)
    const normalizedClaimed = claimedMimeType.replace('image/jpg', 'image/jpeg');
    const normalizedActual = actualMimeType.replace('image/jpg', 'image/jpeg');
    
    if (normalizedClaimed !== normalizedActual) {
      return {
        valid: false,
        actualType: actualMimeType,
        error: `MIME type mismatch: claimed ${claimedMimeType}, detected ${actualMimeType}`,
      };
    }
    
    // Verify it's an allowed image type
    if (!isValidImageType(actualMimeType)) {
      return {
        valid: false,
        actualType: actualMimeType,
        error: `Unsupported file type: ${actualMimeType}`,
      };
    }
    
    return { valid: true, actualType: actualMimeType };
  } catch (error) {
    console.error('File type verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Extract storage key from R2 URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    // Remove PUBLIC_URL prefix to get the key
    if (!url.startsWith(PUBLIC_URL)) {
      return null;
    }
    
    const key = url.replace(PUBLIC_URL + '/', '');
    return key;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
}

/**
 * Get R2 URL from storage key
 */
export function getR2Url(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}
