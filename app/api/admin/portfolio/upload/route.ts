/**
 * Portfolio Photo Upload API
 * POST /api/admin/portfolio/upload
 * 
 * Upload photos directly to portfolio (not event-based)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/lib/logger'
import prisma from '@/lib/prisma'
import { withPrismaRetry } from '@/lib/database/prisma-retry'
import {
  generateUniqueFilename,
  buildPhotoStorageKey,
  verifyFileType,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '@/lib/storage/r2'
import { uploadPhotoWithBackup } from '@/lib/storage/storage-adapter'
import {
  extractImageMetadata,
  generateThumbnailsWithRetry,
  validateImageBuffer,
} from '@/lib/storage/image-processor'
import { extractExifData } from '@/lib/utils/exif-extractor'
import { rateLimit } from '@/lib/security/rate-limiter'
import { memoryManager } from '@/lib/storage/memory-manager'

const MAX_FILES_PER_REQUEST = 50

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // 2. Rate limiting
    try {
      await rateLimit(request, {
        maxRequests: 100,
        windowMs: 60 * 1000,
        keyPrefix: 'portfolio-upload',
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      )
    }

    // 3. Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = formData.get('category') as string | null
    const description = formData.get('description') as string | null

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files per request`,
        },
        { status: 400 }
      )
    }

    // 4. Validate batch size
    const batchValidation = memoryManager.validateBatchSize(files)
    if (!batchValidation.valid) {
      return NextResponse.json(
        {
          error: batchValidation.error,
          totalSizeMB: (batchValidation.totalSize / 1024 / 1024).toFixed(2),
        },
        { status: 400 }
      )
    }

    // Get max display order
    const maxOrderPhoto = await withPrismaRetry(prisma, () =>
      prisma.portfolio_photos.findFirst({
        orderBy: { display_order: 'desc' },
        select: { display_order: true },
      })
    )
    let display_order = (maxOrderPhoto?.display_order ?? -1) + 1

    // 5. Process files
    const uploadResults = []
    const uploadedKeys: string[] = []

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          })
          continue
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: `Invalid file type: ${file.type}`,
          })
          continue
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Validate buffer (magic bytes)
        const bufferValidation = validateImageBuffer(buffer, file.type)
        if (!bufferValidation.valid) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: bufferValidation.error || 'Invalid image format',
          })
          continue
        }

        // Verify file type (content inspection)
        const typeVerification = await verifyFileType(buffer, file.type)
        if (!typeVerification.valid) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: typeVerification.error || 'File type verification failed',
          })
          continue
        }

        // Generate unique filename and storage key
        const uniqueFilename = generateUniqueFilename(file.name)
        const storageKey = buildPhotoStorageKey('portfolio', uniqueFilename)

        // Extract metadata for logging and potential future use
        const metadata = await extractImageMetadata(buffer)
        logger.debug('Image metadata extracted', {
          filename: file.name,
          dimensions: `${metadata.width}x${metadata.height}`,
          file_sizeKB: (metadata.size || 0) / 1024
        });

        // Extract EXIF data for logging and potential future storage
        let exif_data = null
        try {
          exif_data = await extractExifData(buffer)
          if (exif_data) {
            logger.debug('EXIF data extracted', {
              filename: file.name,
              exifProperties: Object.keys(exif_data).length
            });
          }
        } catch (exifError) {
          logger.warn('Failed to extract EXIF data', {
            filename: file.name,
            error: exifError instanceof Error ? exifError.message : String(exifError)
          });
        }

        // Upload original to VPS + R2 backup (DUAL STORAGE for redundancy)
        const uploadResult = await uploadPhotoWithBackup(
          buffer,
          'portfolio',
          uniqueFilename,
          'originals',
          file.type,
          true // Enable R2 backup
        )
        uploadedKeys.push(storageKey)

        // Log backup warnings (non-critical)
        if (uploadResult.warnings && uploadResult.warnings.length > 0) {
          console.warn('Upload warnings (R2 backup):', uploadResult.warnings)
        }

        // Generate thumbnails with correct parameters
        const thumbnailResult = await generateThumbnailsWithRetry(
          buffer,
          'portfolio',
          uniqueFilename.replace(/\.[^.]+$/, '')
        )

        // Get all thumbnail size URLs (WebP format preferred)
        let thumbnail_url = uploadResult.url
        let thumbnail_small_url = null
        let thumbnail_medium_url = null
        let thumbnail_large_url = null

        if (thumbnailResult.success) {
          // Small thumbnail (400px)
          if (thumbnailResult.thumbnails.small?.webp?.url) {
            thumbnail_small_url = thumbnailResult.thumbnails.small.webp.url
          } else if (thumbnailResult.thumbnails.small?.jpeg?.url) {
            thumbnail_small_url = thumbnailResult.thumbnails.small.jpeg.url
          }

          // Medium thumbnail (800px) - also used as legacy thumbnail_url
          if (thumbnailResult.thumbnails.medium?.webp?.url) {
            thumbnail_medium_url = thumbnailResult.thumbnails.medium.webp.url
            thumbnail_url = thumbnail_medium_url // Legacy field
          } else if (thumbnailResult.thumbnails.medium?.jpeg?.url) {
            thumbnail_medium_url = thumbnailResult.thumbnails.medium.jpeg.url
            thumbnail_url = thumbnail_medium_url
          }

          // Large thumbnail (1200px)
          if (thumbnailResult.thumbnails.large?.webp?.url) {
            thumbnail_large_url = thumbnailResult.thumbnails.large.webp.url
          } else if (thumbnailResult.thumbnails.large?.jpeg?.url) {
            thumbnail_large_url = thumbnailResult.thumbnails.large.jpeg.url
          }
        }

        // Create portfolio photo record with responsive image URLs
        const portfolioPhoto = await withPrismaRetry(prisma, () =>
          prisma.portfolio_photos.create({
            data: {
              id: crypto.randomUUID(),
              filename: file.name,
              original_url: uploadResult.url,
              thumbnail_url: thumbnail_url, // Legacy field (medium size)
              thumbnail_small_url: thumbnail_small_url,
              thumbnail_medium_url: thumbnail_medium_url,
              thumbnail_large_url: thumbnail_large_url,
              display_order: display_order++,
              is_featured: false,
              category: category || null,
              description: description || null,
              updated_at: new Date(),
            },
          })
        )

        uploadResults.push({
          filename: file.name,
          success: true,
          photo_id: portfolioPhoto.id,
          url: uploadResult.url,
          thumbnail_url: thumbnail_url,
        })
      } catch (error: unknown) {
        console.error(`❌ Failed to upload ${file.name}:`, error)
        uploadResults.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    }

    // Return results
    const successCount = uploadResults.filter(r => r.success).length
    const failCount = uploadResults.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Uploaded ${successCount} photos successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results: uploadResults,
      summary: {
        total: files.length,
        success: successCount,
        failed: failCount,
      },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    // Graceful handling for transient DB connection drops
    if (message.includes('kind: Closed') || message.includes('PostgreSQL connection')) {
      return NextResponse.json(
        {
          error: 'Database temporarily unavailable. Please retry the upload.',
          code: 'DB_CONNECTION_CLOSED',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: message || 'Upload failed' },
      { status: 500 }
    )
  }
}
