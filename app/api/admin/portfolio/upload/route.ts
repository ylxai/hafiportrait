/**
 * Portfolio Photo Upload API
 * POST /api/admin/portfolio/upload
 * 
 * Upload photos directly to portfolio (not event-based)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { 
  uploadToR2WithRetry, 
  generateUniqueFilename, 
  buildPhotoStorageKey,
  verifyFileType,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '@/lib/storage/r2'
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
    const maxOrderPhoto = await prisma.portfolioPhoto.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    })
    let displayOrder = (maxOrderPhoto?.displayOrder ?? -1) + 1

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
        console.log(`📏 Image metadata for ${file.name}: ${metadata.width}x${metadata.height}, ${(metadata.fileSize || 0 / 1024).toFixed(0)}KB`)
        
        // Extract EXIF data for logging and potential future storage
        let exifData = null
        try {
          exifData = await extractExifData(buffer)
          if (exifData) {
            console.log(`📷 EXIF extracted for ${file.name}: ${Object.keys(exifData).length} properties`)
          }
        } catch (exifError) {
          console.warn(`Could not extract EXIF for ${file.name}:`, exifError)
        }

        // Upload original to R2
        const uploadResult = await uploadToR2WithRetry(buffer, storageKey, file.type)
        uploadedKeys.push(storageKey)

        // Generate thumbnails with correct parameters
        const thumbnailResult = await generateThumbnailsWithRetry(
          buffer,
          'portfolio',
          uniqueFilename.replace(/\.[^.]+$/, '')
        )

        // Get the medium thumbnail URL (WebP format preferred)
        let thumbnailUrl = uploadResult.url
        if (thumbnailResult.success && thumbnailResult.thumbnails.medium?.webp?.url) {
          thumbnailUrl = thumbnailResult.thumbnails.medium.webp.url
        } else if (thumbnailResult.thumbnails.medium?.jpeg?.url) {
          thumbnailUrl = thumbnailResult.thumbnails.medium.jpeg.url
        }

        // Create portfolio photo record
        const portfolioPhoto = await prisma.portfolioPhoto.create({
          data: {
            filename: file.name,
            originalUrl: uploadResult.url,
            thumbnailUrl: thumbnailUrl,
            displayOrder: displayOrder++,
            isFeatured: false,
            category: category || null,
            description: description || null,
          },
        })

        uploadResults.push({
          filename: file.name,
          success: true,
          photoId: portfolioPhoto.id,
          url: uploadResult.url,
          thumbnailUrl: thumbnailUrl,
        })
      } catch (error: any) {
        console.error(`❌ Failed to upload ${file.name}:`, error)
        uploadResults.push({
          filename: file.name,
          success: false,
          error: error.message || 'Upload failed',
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

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
