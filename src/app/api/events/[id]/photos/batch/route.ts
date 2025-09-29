import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { directR2Uploader } from '@/lib/direct-r2-uploader';

// Configure API route for batch uploads with extended timeout
export const runtime = 'nodejs';
export const maxDuration = 90; // Extended to 90 seconds for batch operations
export const dynamic = 'force-dynamic';

interface BatchUploadResult {
  success: boolean;
  results: Array<{
    fileName: string;
    success: boolean;
    data?: any;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: eventId } = await params;
    
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const formData = await request.formData();
    const uploaderName = formData.get('uploaderName') as string || 'Anonymous';
    const albumName = formData.get('albumName') as string || 'Tamu';

    // Extract all files from FormData
    const files: File[] = [];
    const entries = Array.from(formData.entries());
    
    for (const [key, value] of entries) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ 
        error: "No files uploaded",
        message: "At least one file is required for batch upload"
      }, { status: 400 });
    }

    // Mobile vs Desktop limits
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const maxFiles = isMobile ? 5 : 10;
    const maxFileSize = isMobile ? 30 * 1024 * 1024 : 50 * 1024 * 1024;

    if (files.length > maxFiles) {
      return NextResponse.json({ 
        error: "Too many files",
        message: `Maximum ${maxFiles} files allowed ${isMobile ? 'on mobile' : 'on desktop'}`
      }, { status: 400 });
    }

    // Validate album name
    if (!['Official', 'Tamu', 'Bridesmaid'].includes(albumName)) {
      return NextResponse.json({ 
        error: "Invalid album name",
        message: "Album must be one of: Official, Tamu, Bridesmaid"
      }, { status: 400 });
    }

    console.log(`[Batch Upload] Processing ${files.length} files for event ${eventId}, album: ${albumName}`);

    // Initialize batch result
    const batchResult: BatchUploadResult = {
      success: false,
      results: [],
      summary: {
        total: files.length,
        successful: 0,
        failed: 0
      }
    };

    // Process files with controlled concurrency
    const maxConcurrent = isMobile ? 2 : 3;
    const processQueue = [...files];
    const processingPromises: Promise<void>[] = [];

    const processFile = async (file: File, index: number): Promise<void> => {
      const result = {
        fileName: file.name,
        success: false,
        data: undefined as any,
        error: undefined as string | undefined
      };

      try {
        // Validate file type
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
          'image/heic', 'image/heif', 'image/gif', 'image/bmp'
        ];

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp'];
        const fileExtension = file.name.toLowerCase().split('.').pop() || '';
        const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

        // Check for RAW formats
        const rawExtensions = ['nef', 'cr2', 'arw', 'dng', 'raf'];
        const rawMimeTypes = ['image/x-nikon-nef', 'image/x-canon-cr2', 'image/x-sony-arw', 'image/x-adobe-dng', 'image/x-fuji-raf'];
        
        if (rawExtensions.includes(fileExtension) || rawMimeTypes.includes(file.type)) {
          throw new Error('RAW format not supported. Please convert to JPEG, PNG, or WebP first.');
        }

        if (!isValidType) {
          throw new Error(`Invalid file type: ${file.type}. Supported: JPEG, PNG, WebP, HEIC, GIF, BMP`);
        }

        // Validate file size
        if (file.size > maxFileSize) {
          const maxSizeText = isMobile ? '30MB' : '50MB';
          throw new Error(`File size must be less than ${maxSizeText}`);
        }

        // Upload photo using existing uploader
        const photo = await directR2Uploader.uploadPhoto({
          eventId,
          file,
          uploaderName,
          albumName,
          compression: {
            quality: albumName === 'Official' ? 95 : 90,
            maxWidth: albumName === 'Official' ? 3000 : 2400
          }
        });

        result.success = true;
        result.data = photo;
        batchResult.summary.successful++;

      } catch (error: any) {
        console.error(`[Batch Upload] Error processing ${file.name}:`, error);
        result.error = error.message || 'Unknown error occurred';
        batchResult.summary.failed++;
      }

      batchResult.results.push(result);
    };

    // Process files with concurrency control
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map((file, batchIndex) => 
        processFile(file, i + batchIndex)
      );
      
      await Promise.all(batchPromises);
    }

    // Set overall success based on results
    batchResult.success = batchResult.summary.successful > 0;

    // Log summary
    console.log(`[Batch Upload] Completed: ${batchResult.summary.successful}/${batchResult.summary.total} files successful`);

    // Return response based on results
    if (batchResult.summary.successful === batchResult.summary.total) {
      // All files successful
      return NextResponse.json(batchResult, { status: 201 });
    } else if (batchResult.summary.successful > 0) {
      // Partial success
      return NextResponse.json(batchResult, { status: 207 }); // Multi-Status
    } else {
      // All files failed
      return NextResponse.json(batchResult, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Batch Upload] Critical error:', error);
    return NextResponse.json({ 
      error: "Batch upload failed",
      message: error.message || 'Unknown server error',
      success: false
    }, { status: 500 });
  }
}