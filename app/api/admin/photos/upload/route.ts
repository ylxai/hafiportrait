/**
 * Photo Upload API Endpoint
 * Story 4.10: Photo Upload API & Validation
 * 
 * Features:
 * - Advanced file validation (magic bytes, size, integrity, malware)
 * - Authorization (admin only)
 * - Input sanitization
 * - Comprehensive error handling
 * - Chunked uploads for large files
 * - Parallel processing
 * - Progress tracking
 * 
 * PRODUCTION UPDATE:
 * - Rate limiting DISABLED for wedding photo business
 * - Increased file size limits to 200MB
 * - Relaxed validation for faster uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import { asyncHandler, successResponse } from '@/lib/errors/handler';
import {
  validateBatchUpload,
  validateAndSanitizeMetadata,
} from '@/lib/upload/upload-validator';
import {
  processBatchUpload,
  estimateUploadTime,
  estimateMemoryUsage,
} from '@/lib/upload/upload-processor';
import { FileValidationError, BatchUploadError } from '@/lib/errors/upload-errors';

/**
 * Rate limit config for photo uploads
 * PRODUCTION: DISABLED for wedding photo business
 */
const UPLOAD_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10000, // Essentially unlimited
  keyPrefix: 'rate-limit:photo-upload',
};

/**
 * POST /api/admin/photos/upload
 * Upload one or more photos to an event
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // 1. Authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Authorization - Admin only
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  // 3. Rate limiting - DISABLED for production wedding photo uploads
  /*
  try {
    await rateLimit(request, UPLOAD_RATE_LIMIT);
  } catch (error) {
    // Rate limit error is already formatted by rateLimit function
    throw error;
  }
  */

  // 4. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    throw new FileValidationError('Invalid form data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // 5. Extract and validate event ID
  const eventId = formData.get('eventId') as string;
  if (!eventId || typeof eventId !== 'string') {
    throw new FileValidationError('Event ID is required');
  }

  // 6. Extract metadata (optional)
  const metadataStr = formData.get('metadata') as string;
  let metadata = {};
  if (metadataStr) {
    try {
      metadata = JSON.parse(metadataStr);
    } catch (error) {
      throw new FileValidationError('Invalid metadata JSON');
    }
  }
  const sanitizedMetadata = validateAndSanitizeMetadata(metadata);

  // 7. Extract files from form data
  const files: Array<{ file: File; filename: string; mimeType: string }> = [];
  
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('file') && value instanceof File) {
      if (!value.type || value.size === 0) {
        throw new FileValidationError(`Invalid file: ${value.name}`);
      }
      
      files.push({
        file: value,
        filename: value.name,
        mimeType: value.type,
      });
    }
  }

  if (files.length === 0) {
    throw new FileValidationError('No files provided for upload');
  }

  // 8. Validate all files before processing (relaxed validation)
  const validationResult = await validateBatchUpload(files);

  if (!validationResult.valid) {
    throw new BatchUploadError(
      'File validation failed',
      validationResult.files.map((f) => ({
        filename: f.filename,
        success: f.valid,
        error: f.error,
      })),
      { errors: validationResult.errors }
    );
  }

  // 9. Check memory and time estimates
  const fileSizes = validationResult.files.map((f) => ({
    size: f.metadata?.size || 0,
  }));
  const estimatedTime = estimateUploadTime(fileSizes);
  const estimatedMemory = estimateMemoryUsage(fileSizes);
  
  // Log estimates for monitoring
  logger.debug('Upload estimates calculated', {
    estimatedTimeSeconds: estimatedTime,
    estimatedMemoryMB: (estimatedMemory / 1024 / 1024).toFixed(2),
    filesCount: fileSizes.length
  });
  
  // 10. Process uploads (convert Files to Buffers)
  const fileBuffers = await Promise.all(
    files.map(async (f) => ({
      buffer: Buffer.from(await f.file.arrayBuffer()),
      filename: f.filename,
      mimeType: f.mimeType,
    }))
  );

  // 11. Upload files with parallel processing and retry logic
  const uploadResults = await processBatchUpload(fileBuffers, {
    eventId,
    userId: user.userId,
    caption: sanitizedMetadata.caption,
    isFeatured: false,
  });

  // 12. Categorize results
  const successful = uploadResults.filter((r) => r.success);
  const failed = uploadResults.filter((r) => !r.success);

  // 13. Return response
  const response = {
    uploaded: successful.length,
    failed: failed.length,
    total: uploadResults.length,
    results: uploadResults.map((r) => ({
      filename: r.filename,
      success: r.success,
      ...(r.photoId && { photoId: r.photoId }),
      ...(r.url && { url: r.url }),
      ...(r.metadata && { metadata: r.metadata }),
      ...(r.error && { error: r.error }),
    })),
    estimates: {
      estimatedTime: `${estimatedTime}s`,
      totalSize: validationResult.totalSize,
    },
  };

  // If all failed, return error status
  if (failed.length > 0 && successful.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'All uploads failed',
        ...response,
      },
      { status: 500 }
    );
  }

  // Partial success or full success
  return successResponse(response, 
    successful.length === uploadResults.length
      ? 'All files uploaded successfully'
      : 'Some files uploaded successfully',
    successful.length === uploadResults.length ? 200 : 207 // 207 Multi-Status
  );
});

/**
 * GET /api/admin/photos/upload
 * Get upload configuration and limits
 */
export async function GET(request: NextRequest) {
  // Authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    config: {
      maxFileSize: 200 * 1024 * 1024, // 200MB
      minFileSize: 10 * 1024, // 10KB
      maxBatchSize: 5 * 1024 * 1024 * 1024, // 5GB
      maxFiles: 100,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
      maxConcurrentUploads: 10,
      chunkSize: 10 * 1024 * 1024, // 10MB
      rateLimit: {
        maxRequests: UPLOAD_RATE_LIMIT.maxRequests,
        windowMinutes: UPLOAD_RATE_LIMIT.windowMs / 60000,
        disabled: true, // PRODUCTION: Rate limiting disabled
      },
    },
  });
}
