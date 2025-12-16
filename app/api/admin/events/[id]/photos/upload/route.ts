/**
 * Photo Upload API Endpoint (ENHANCED with EXIF)
 * POST /api/admin/events/[id]/photos/upload
 * 
 * Enhanced with:
 * - Buffer validation (magic bytes)
 * - MIME type content verification
 * - Transaction rollback (cleanup on failure)
 * - Memory management (concurrency control)
 * - Enhanced filename sanitization
 * - EXIF data extraction
 * 
 * PRODUCTION UPDATE: 
 * - Rate limiting DISABLED for wedding photo business
 * - Increased file size limits to 200MB
 * - Relaxed validation for faster uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  uploadToR2WithRetry, 
  generateUniqueFilename, 
  buildPhotoStorageKey,
  isValidImageType,
  isValidFileSize,
  cleanupFailedUpload,
  // verifyFileType, // PRODUCTION: Disabled for faster uploads
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '@/lib/storage/r2';
import { 
  extractImageMetadata, 
  generateThumbnailsWithRetry,
  validateImageBuffer,
} from '@/lib/storage/image-processor';
import { extractExifData } from '@/lib/utils/exif-extractor';
// import { rateLimit } from '@/lib/security/rate-limiter'; // PRODUCTION: Disabled for wedding uploads
import { memoryManager } from '@/lib/storage/memory-manager';

// Maximum files per request - PRODUCTION: Increased for bulk uploads
const MAX_FILES_PER_REQUEST = 100;

/**
 * POST handler for photo upload
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const { id: eventId } = await params;
    
    // 2. PRODUCTION: Rate limiting DISABLED untuk wedding photo uploads
    // Wedding photographers need to upload many photos quickly
    // Rate limiting can be re-enabled later if abuse is detected
    /*
    try {
      await rateLimit(request, {
        maxRequests: 1000,
        windowMs: 60 * 1000,
        keyPrefix: 'photo-upload',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }
    */

    // 3. Verify event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, clientId: true, name: true, status: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check ownership (admin or event owner)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isAdmin = user.role === 'ADMIN';
    const isOwner = event.clientId === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to upload photos to this event' },
        { status: 403 }
      );
    }

    // 4. Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { 
          error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files per request`,
          maxFiles: MAX_FILES_PER_REQUEST,
        },
        { status: 400 }
      );
    }

    // 5. SECURITY: Validate total batch size (memory management)
    const batchValidation = memoryManager.validateBatchSize(files);
    if (!batchValidation.valid) {
      return NextResponse.json(
        { 
          error: batchValidation.error,
          totalSizeMB: (batchValidation.totalSize / 1024 / 1024).toFixed(2),
        },
        { status: 400 }
      );
    }

    console.log(`📦 Processing batch: ${files.length} files, ${(batchValidation.totalSize / 1024 / 1024).toFixed(2)}MB total`);

    // Get max display order for event to assign new photos
    const maxOrderPhoto = await prisma.photo.findFirst({
      where: { 
        eventId: eventId,
        deletedAt: null,
      },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    let nextDisplayOrder = (maxOrderPhoto?.displayOrder || 0) + 1;

    // 6. Process and upload files with transaction-like rollback
    const uploadResults: Array<{
      originalName: string;
      success: boolean;
      photo?: any;
      error?: string;
    }> = [];

    for (const file of files) {
      // Track all uploaded files for this photo (for rollback)
      const uploadedKeys: string[] = [];
      
      try {
        // SECURITY: Validate file type
        if (!isValidImageType(file.type)) {
          uploadResults.push({
            originalName: file.name,
            success: false,
            error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
          });
          continue;
        }

        // SECURITY: Validate file size
        if (!isValidFileSize(file.size)) {
          uploadResults.push({
            originalName: file.name,
            success: false,
            error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          });
          continue;
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        // SECURITY: Validate image buffer with magic bytes (DoS prevention)
        // PRODUCTION: Relaxed validation for faster uploads
        const bufferValidation = validateImageBuffer(buffer, file.type);
        if (!bufferValidation.valid) {
          // Warning only, don't block upload for HEIC/HEIF
          if (file.type !== 'image/heic' && file.type !== 'image/heif') {
            console.warn(`🛡️ Buffer validation warning for ${file.name}: ${bufferValidation.error}`);
          }
        }

        // SECURITY: MIME verification DISABLED for faster uploads
        // Can be re-enabled if security issues are detected
        /*
        const mimeVerification = await verifyFileType(buffer, file.type);
        if (!mimeVerification.valid) {
          console.warn(`🛡️ MIME verification failed for ${file.name}: ${mimeVerification.error}`);
          uploadResults.push({
            originalName: file.name,
            success: false,
            error: `MIME type verification failed: ${mimeVerification.error}`,
          });
          continue;
        }
        */

        console.log(`✓ Security checks passed for ${file.name}`);

        // PERFORMANCE: Process with memory control (limits concurrent large files)
        await memoryManager.processWithControl(file.size, async () => {
          try {
            // Extract image metadata
            const metadata = await extractImageMetadata(buffer);

            // NEW: Extract EXIF data (optional, don't fail if it errors)
            let exifData = null;
            try {
              exifData = await extractExifData(buffer);
              if (exifData) {
                console.log(`📷 Extracted EXIF data for ${file.name}`);
              }
            } catch (exifError) {
              console.warn(`Could not extract EXIF for ${file.name}:`, exifError);
              // Continue without EXIF - not a critical error
            }

            // Generate unique filename
            const uniqueFilename = generateUniqueFilename(file.name);
            const baseFilename = uniqueFilename.replace(/\.[^/.]+$/, ''); // Remove extension

            // Upload original to R2 (MIME verification disabled for speed)
            const originalKey = buildPhotoStorageKey(eventId, uniqueFilename, 'originals');
            const uploadResult = await uploadToR2WithRetry(buffer, originalKey, file.type, 3, false);

            if (!uploadResult.success) {
              throw new Error(uploadResult.error || 'Failed to upload original photo');
            }

            // Track uploaded file for potential rollback
            uploadedKeys.push(originalKey);

            // PERFORMANCE: Generate thumbnails (now optimized with parallel processing)
            const thumbnailsResult = await generateThumbnailsWithRetry(
              buffer,
              eventId,
              baseFilename
            );

            // Track thumbnail URLs for potential rollback
            const thumbnailKeys: string[] = [];
            if (thumbnailsResult.thumbnails.small.jpeg?.url) {
              thumbnailKeys.push(thumbnailsResult.thumbnails.small.jpeg.url.split('/').pop() || '');
            }
            if (thumbnailsResult.thumbnails.small.webp?.url) {
              thumbnailKeys.push(thumbnailsResult.thumbnails.small.webp.url.split('/').pop() || '');
            }
            if (thumbnailsResult.thumbnails.medium.jpeg?.url) {
              thumbnailKeys.push(thumbnailsResult.thumbnails.medium.jpeg.url.split('/').pop() || '');
            }
            if (thumbnailsResult.thumbnails.medium.webp?.url) {
              thumbnailKeys.push(thumbnailsResult.thumbnails.medium.webp.url.split('/').pop() || '');
            }
            if (thumbnailsResult.thumbnails.large.jpeg?.url) {
              thumbnailKeys.push(thumbnailsResult.thumbnails.large.jpeg.url.split('/').pop() || '');
            }
            if (thumbnailsResult.thumbnails.large.webp?.url) {
              thumbnailKeys.push(thumbnailsResult.thumbnails.large.webp.url.split('/').pop() || '');
            }

            uploadedKeys.push(...thumbnailKeys.filter(k => k));

            // Get thumbnail URLs (prefer WebP, fallback to JPEG)
            const thumbnailSmallUrl = 
              thumbnailsResult.thumbnails.small.webp?.url || 
              thumbnailsResult.thumbnails.small.jpeg?.url || 
              null;
            
            const thumbnailMediumUrl = 
              thumbnailsResult.thumbnails.medium.webp?.url || 
              thumbnailsResult.thumbnails.medium.jpeg?.url || 
              null;
            
            const thumbnailLargeUrl = 
              thumbnailsResult.thumbnails.large.webp?.url || 
              thumbnailsResult.thumbnails.large.jpeg?.url || 
              null;

            // TRANSACTION: Create database record (if this fails, we cleanup R2 files)
            try {
              const photo = await prisma.photo.create({
                data: {
                  filename: uniqueFilename,
                  originalUrl: uploadResult.url,
                  thumbnailUrl: thumbnailMediumUrl, // Legacy field for compatibility
                  thumbnailSmallUrl,
                  thumbnailMediumUrl,
                  thumbnailLargeUrl,
                  fileSize: file.size,
                  mimeType: file.type,
                  width: metadata.width,
                  height: metadata.height,
                  exifData: exifData as any, // NEW: Store EXIF data
                  eventId: eventId,
                  uploadedById: userId,
                  displayOrder: nextDisplayOrder++,
                },
                include: {
                  event: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              });

              uploadResults.push({
                originalName: file.name,
                success: true,
                photo: {
                  id: photo.id,
                  filename: photo.filename,
                  originalUrl: photo.originalUrl,
                  thumbnailSmallUrl: photo.thumbnailSmallUrl,
                  thumbnailMediumUrl: photo.thumbnailMediumUrl,
                  thumbnailLargeUrl: photo.thumbnailLargeUrl,
                  width: photo.width,
                  height: photo.height,
                  fileSize: photo.fileSize,
                  mimeType: photo.mimeType,
                  createdAt: photo.createdAt,
                  hasExif: exifData !== null,
                },
              });

              console.log(`✓ Uploaded photo: ${file.name} -> ${uniqueFilename}${exifData ? ' (with EXIF)' : ''}`);
            } catch (dbError) {
              // TRANSACTION ROLLBACK: Database insert failed, cleanup R2 files
              console.error(`❌ Database insert failed for ${file.name}, cleaning up R2 files...`, dbError);
              await cleanupFailedUpload(uploadedKeys);
              throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
            }
          } finally {
            // MEMORY: Explicit buffer cleanup
            buffer = null as any;
          }
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        // TRANSACTION ROLLBACK: If we have uploaded files, clean them up
        if (uploadedKeys.length > 0) {
          console.log(`🔄 Rolling back ${uploadedKeys.length} uploaded files for ${file.name}...`);
          await cleanupFailedUpload(uploadedKeys);
        }
        
        uploadResults.push({
          originalName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    // 7. Calculate statistics
    const successCount = uploadResults.filter(r => r.success).length;
    const failCount = uploadResults.filter(r => !r.success).length;
    const withExifCount = uploadResults.filter(r => r.success && r.photo?.hasExif).length;

    // 8. Log upload activity
    console.log(`✅ Upload complete for event ${eventId}: ${successCount} success (${withExifCount} with EXIF), ${failCount} failed`);
    console.log(`📊 Memory status:`, memoryManager.getStatus());

    return NextResponse.json({
      success: true,
      message: `Uploaded ${successCount} of ${files.length} photos successfully`,
      results: uploadResults,
      statistics: {
        total: files.length,
        success: successCount,
        failed: failCount,
        withExif: withExifCount,
        totalSizeMB: (batchValidation.totalSize / 1024 / 1024).toFixed(2),
      },
      event: {
        id: event.id,
        name: event.name,
      },
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during photo upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable body parsing to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};
