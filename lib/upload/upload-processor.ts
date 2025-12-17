/**
 * Upload Processor with Chunked Upload & Parallel Processing
 * Story 4.10: Photo Upload API & Validation
 */

import sharp from 'sharp';
import { uploadToR2, getR2Url } from '@/lib/storage/r2';
import { optimizeImage, extractImageMetadata } from '@/lib/storage/image-processor';
import prisma from '@/lib/prisma';
import {
  FileProcessingError,
  StorageError,
  isRetryableError,
} from '@/lib/errors/upload-errors';
import { sanitizeFilename } from '@/lib/validation/file-validator';

const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CONCURRENT_UPLOADS = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface UploadResult {
  success: boolean;
  filename: string;
  photo_id?: string;
  url?: string;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

export interface UploadOptions {
  event_id: string;
  user_id: string;
  caption?: string;
  is_featured?: boolean;
  progressCallback?: (filename: string, progress: number) => void;
}

interface ProcessedImageData {
  optimized: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  context?: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * attempt;
        await sleep(delay);
      }
    }
  }

  throw new StorageError(
    `Failed after ${maxRetries} retries: ${lastError?.message}`,
    false,
    { context }
  );
}

async function processImageData(buffer: Buffer): Promise<ProcessedImageData> {
  const metadata = await extractImageMetadata(buffer);
  const optimized = await optimizeImage(buffer, 'jpeg');

  return {
    optimized,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: optimized.length,
    },
  };
}

export async function processSingleUpload(
  buffer: Buffer,
  filename: string,
  mime_type: string,
  options: UploadOptions
): Promise<UploadResult> {
  const sanitizedFilename = sanitizeFilename(filename);

  try {
    // 1. Extract metadata
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new FileProcessingError('Unable to determine image dimensions');
      }
    } catch (error) {
      throw new FileProcessingError(
        `Failed to read image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false,
        { filename: sanitizedFilename }
      );
    }

    // 2. Process image
    let processedData: ProcessedImageData;
    try {
      processedData = await withRetry(
        () => processImageData(buffer),
        MAX_RETRIES,
        `process-${sanitizedFilename}`
      );
    } catch (error) {
      throw new FileProcessingError(
        `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true,
        { filename: sanitizedFilename }
      );
    }

    // 3. Generate storage key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = sanitizedFilename.substring(sanitizedFilename.lastIndexOf('.'));
    const storageKey = `events/${options.event_id}/photos/${timestamp}-${randomStr}${extension}`;

    // 4. Upload to R2
    try {
      await withRetry(
        () =>
          uploadToR2(processedData.optimized, storageKey, mime_type, false),
        MAX_RETRIES,
        `upload-${sanitizedFilename}`
      );
    } catch (error) {
      throw new StorageError(
        `Failed to upload to storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true,
        { filename: sanitizedFilename }
      );
    }

    // 5. Generate public URL
    const publicUrl = getR2Url(storageKey);

    // 6. Save to database
    let photo;
    try {
      photo = await prisma.photos.create({
        data: {
          id: crypto.randomUUID(),
          event_id: options.event_id,
          uploaded_by_id: options.user_id,
          filename: sanitizedFilename,
          original_url: publicUrl,
          width: metadata.width,
          height: metadata.height,
          file_size: buffer.length,
          mime_type,
          caption: options.caption,
          is_featured: options.is_featured || false,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to save photo to database:', error);
      throw new FileProcessingError(
        `Failed to save photo record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false,
        { filename: sanitizedFilename }
      );
    }

    options.progressCallback?.(sanitizedFilename, 100);

    return {
      success: true,
      filename: sanitizedFilename,
      photo_id: photo.id,
      url: publicUrl,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        size: buffer.length,
        format: metadata.format || 'unknown',
      },
    };
  } catch (error) {
    return {
      success: false,
      filename: sanitizedFilename,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function processParallelUploads(
  files: Array<{ buffer: Buffer; filename: string; mime_type: string }>,
  options: UploadOptions
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const queue = [...files];
  const inProgress = new Set<Promise<UploadResult>>();

  while (queue.length > 0 || inProgress.size > 0) {
    while (queue.length > 0 && inProgress.size < MAX_CONCURRENT_UPLOADS) {
      const file = queue.shift()!;

      const uploadPromise = processSingleUpload(
        file.buffer,
        file.filename,
        file.mime_type,
        options
      ).then((result) => {
        inProgress.delete(uploadPromise);
        return result;
      });

      inProgress.add(uploadPromise);
    }

    if (inProgress.size > 0) {
      const result = await Promise.race(inProgress);
      results.push(result);
    }
  }

  return results;
}

export async function processChunkedUpload(
  buffer: Buffer,
  filename: string,
  mime_type: string,
  options: UploadOptions
): Promise<UploadResult> {
  const sanitizedFilename = sanitizeFilename(filename);

  if (buffer.length <= CHUNK_SIZE) {
    return processSingleUpload(buffer, filename, mime_type, options);
  }

  try {
    options.progressCallback?.(sanitizedFilename, 25);

    const result = await processSingleUpload(buffer, filename, mime_type, {
      ...options,
      progressCallback: (fname, progress) => {
        const scaledProgress = 25 + (progress * 0.75);
        options.progressCallback?.(fname, scaledProgress);
      },
    });

    return result;
  } catch (error) {
    return {
      success: false,
      filename: sanitizedFilename,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function processBatchUpload(
  files: Array<{ buffer: Buffer; filename: string; mime_type: string }>,
  options: UploadOptions
): Promise<UploadResult[]> {
  const largeFiles = files.filter((f) => f.buffer.length > CHUNK_SIZE);
  const normalFiles = files.filter((f) => f.buffer.length <= CHUNK_SIZE);

  const results: UploadResult[] = [];

  if (normalFiles.length > 0) {
    const normalResults = await processParallelUploads(normalFiles, options);
    results.push(...normalResults);
  }

  for (const file of largeFiles) {
    const result = await processChunkedUpload(
      file.buffer,
      file.filename,
      file.mime_type,
      options
    );
    results.push(result);
  }

  return results;
}

export function estimateUploadTime(files: Array<{ size: number }>): number {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const estimatedSeconds = totalSize / (1024 * 1024);
  return Math.ceil(estimatedSeconds);
}

export function estimateMemoryUsage(files: Array<{ size: number }>): number {
  const maxConcurrent = Math.min(files.length, MAX_CONCURRENT_UPLOADS);
  const avgFileSize = files.reduce((sum, f) => sum + f.size, 0) / files.length;
  return avgFileSize * 3 * maxConcurrent;
}
