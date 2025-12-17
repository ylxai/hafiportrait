/**
 * Comprehensive Upload Validation
 * Story 4.10: Photo Upload API & Validation
 * 
 * Combines all validation checks for upload requests
 */

import {
  validateFile,
  validateFileSize,
  validateBatchSize,
  sanitizeFilename,
  isAllowedMimeType,
  FILE_SIZE_LIMITS,
} from '@/lib/validation/file-validator';
import {
  FileValidationError,
  SecurityError,
  BatchUploadError,
} from '@/lib/errors/upload-errors';

/**
 * Upload request validation options
 */
export interface UploadValidationOptions {
  maxFiles?: number;
  maxFileSize?: number;
  maxBatchSize?: number;
  allowedMimeTypes?: string[];
}

/**
 * Individual file validation result
 */
export interface FileValidationResult {
  valid: boolean;
  filename: string;
  sanitizedFilename: string;
  error?: string;
  metadata?: {
    size: number;
    mime_type: string;
    width?: number;
    height?: number;
    format?: string;
  };
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  valid: boolean;
  files: FileValidationResult[];
  totalSize: number;
  errors: string[];
}

/**
 * Convert File to Buffer
 */
async function fileToBuffer(file: File | Buffer): Promise<Buffer> {
  if (file instanceof Buffer) {
    return file;
  }
  if (Buffer.isBuffer(file)) return file;
  return Buffer.from(await file.arrayBuffer());
}

/**
 * Validate single file upload
 */
export async function validateSingleFile(
  file: File | Buffer,
  filename: string,
  mime_type: string,
  options?: UploadValidationOptions
): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    valid: false,
    filename,
    sanitizedFilename: sanitizeFilename(filename),
  };

  try {
    // Get file buffer
    const buffer = await fileToBuffer(file);
    const file_size = buffer.length;

    // 1. Check MIME type
    if (!isAllowedMimeType(mime_type)) {
      result.error = `File type not allowed: ${mime_type}. Only JPEG, PNG, WebP, and HEIC are supported.`;
      return result;
    }

    // 2. Validate file size
    const sizeValidation = validateFileSize(file_size, {
      minSize: FILE_SIZE_LIMITS.MIN_FILE_SIZE,
      maxSize: options?.maxFileSize || FILE_SIZE_LIMITS.MAX_FILE_SIZE,
    });

    if (!sizeValidation.valid) {
      result.error = sizeValidation.error;
      return result;
    }

    // 3. Comprehensive file validation (magic bytes, integrity, malware)
    const fileValidation = await validateFile(buffer, { filename, mime_type, size: file_size });

    if (!fileValidation.valid) {
      result.error = fileValidation.error;
      return result;
    }

    // Success!
    result.valid = true;
    result.metadata = {
      size: file_size,
      mime_type,
      width: fileValidation.details?.dimensions?.width,
      height: fileValidation.details?.dimensions?.height,
      format: fileValidation.details?.format,
    };

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown validation error';
    return result;
  }
}

/**
 * Validate batch file upload
 */
export async function validateBatchUpload(
  files: Array<{ file: File | Buffer; filename: string; mime_type: string }>,
  options?: UploadValidationOptions
): Promise<BatchValidationResult> {
  const maxFiles = options?.maxFiles || 100;
  const results: FileValidationResult[] = [];
  const errors: string[] = [];

  // 1. Check file count
  if (files.length === 0) {
    errors.push('No files provided');
    return {
      valid: false,
      files: [],
      totalSize: 0,
      errors,
    };
  }

  if (files.length > maxFiles) {
    errors.push(`Too many files. Maximum: ${maxFiles}, Provided: ${files.length}`);
    return {
      valid: false,
      files: [],
      totalSize: 0,
      errors,
    };
  }

  // 2. Calculate total batch size
  const file_sizes = await Promise.all(
    files.map(async ({ file }) => {
      const buffer = await fileToBuffer(file);
      return buffer.length;
    })
  );

  const totalSize = file_sizes.reduce((sum, size) => sum + size, 0);

  // 3. Validate batch size
  const batchSizeValidation = validateBatchSize(
    file_sizes.map((size) => ({ size })),
    options?.maxBatchSize || FILE_SIZE_LIMITS.MAX_BATCH_SIZE
  );

  if (!batchSizeValidation.valid) {
    errors.push(batchSizeValidation.error!);
    return {
      valid: false,
      files: [],
      totalSize,
      errors,
    };
  }

  // 4. Validate each file
  const validationPromises = files.map(({ file, filename, mime_type }) =>
    validateSingleFile(file, filename, mime_type, options)
  );

  const fileResults = await Promise.all(validationPromises);
  results.push(...fileResults);

  // 5. Collect errors
  const invalidFiles = fileResults.filter((r) => !r.valid);
  if (invalidFiles.length > 0) {
    invalidFiles.forEach((r) => {
      if (r.error) {
        errors.push(`${r.filename}: ${r.error}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    files: results,
    totalSize,
    errors,
  };
}

/**
 * Validate and sanitize metadata
 */
export interface PhotoMetadata {
  caption?: string;
  tags?: string[];
  location?: string;
  cameraMake?: string;
  cameraModel?: string;
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  focalLength?: number;
}

export function validateAndSanitizeMetadata(metadata: any): PhotoMetadata {
  const sanitized: PhotoMetadata = {};

  // Caption - limit length and remove dangerous characters
  if (metadata.caption && typeof metadata.caption === 'string') {
    sanitized.caption = metadata.caption
      .trim()
      .substring(0, 1000)
      .replace(/[<>]/g, ''); // Remove HTML brackets
  }

  // Tags - validate array and sanitize each tag
  if (Array.isArray(metadata.tags)) {
    sanitized.tags = metadata.tags
      .filter((tag: any) => typeof tag === 'string')
      .map((tag: string) => tag.trim().substring(0, 50).replace(/[<>]/g, ''))
      .filter((tag: string) => tag.length > 0)
      .slice(0, 20); // Max 20 tags
  }

  // Location - limit length
  if (metadata.location && typeof metadata.location === 'string') {
    sanitized.location = metadata.location.trim().substring(0, 200);
  }

  // Camera make
  if (metadata.cameraMake && typeof metadata.cameraMake === 'string') {
    sanitized.cameraMake = metadata.cameraMake.trim().substring(0, 100);
  }

  // Camera model
  if (metadata.cameraModel && typeof metadata.cameraModel === 'string') {
    sanitized.cameraModel = metadata.cameraModel.trim().substring(0, 100);
  }

  // ISO - validate number range
  if (typeof metadata.iso === 'number' && metadata.iso >= 50 && metadata.iso <= 102400) {
    sanitized.iso = Math.floor(metadata.iso);
  }

  // Aperture - validate number range
  if (typeof metadata.aperture === 'number' && metadata.aperture >= 0.95 && metadata.aperture <= 64) {
    sanitized.aperture = Math.round(metadata.aperture * 10) / 10;
  }

  // Shutter speed
  if (metadata.shutterSpeed && typeof metadata.shutterSpeed === 'string') {
    sanitized.shutterSpeed = metadata.shutterSpeed.trim().substring(0, 20);
  }

  // Focal length - validate number range
  if (typeof metadata.focalLength === 'number' && metadata.focalLength >= 1 && metadata.focalLength <= 2000) {
    sanitized.focalLength = Math.floor(metadata.focalLength);
  }

  return sanitized;
}
