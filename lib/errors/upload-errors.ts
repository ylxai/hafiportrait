/**
 * Upload-specific Error Classes
 * Story 4.10: Photo Upload API & Validation
 * 
 * Categorizes upload errors into specific types for better error handling
 */

import { AppError, ErrorCode } from './types';

/**
 * Upload error categories
 */
export enum UploadErrorCategory {
  VALIDATION = 'VALIDATION',
  PROCESSING = 'PROCESSING',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  SECURITY = 'SECURITY',
}

/**
 * Base upload error with category
 */
export class UploadError extends AppError {
  public readonly category: UploadErrorCategory;
  public readonly retryable: boolean;

  constructor(
    message: string,
    category: UploadErrorCategory,
    retryable: boolean = false,
    statusCode: number = 400,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, statusCode, true, context);
    this.category = category;
    this.retryable = retryable;
    Object.setPrototypeOf(this, UploadError.prototype);
  }
}

/**
 * File validation error
 */
export class FileValidationError extends UploadError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, UploadErrorCategory.VALIDATION, false, 400, context);
    Object.setPrototypeOf(this, FileValidationError.prototype);
  }
}

/**
 * File processing error (Sharp, etc.)
 */
export class FileProcessingError extends UploadError {
  constructor(message: string, retryable: boolean = false, context?: Record<string, any>) {
    super(message, UploadErrorCategory.PROCESSING, retryable, 500, context);
    Object.setPrototypeOf(this, FileProcessingError.prototype);
  }
}

/**
 * Storage error (R2, S3, etc.)
 */
export class StorageError extends UploadError {
  constructor(message: string, retryable: boolean = true, context?: Record<string, any>) {
    super(message, UploadErrorCategory.STORAGE, retryable, 500, context);
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Network error (timeout, connection failed)
 */
export class NetworkError extends UploadError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, UploadErrorCategory.NETWORK, true, 503, context);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Security error (malware, suspicious content)
 */
export class SecurityError extends UploadError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, UploadErrorCategory.SECURITY, false, 403, context);
    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}

/**
 * Batch upload error with individual file results
 */
export class BatchUploadError extends UploadError {
  public readonly results: Array<{
    filename: string;
    success: boolean;
    error?: string;
    photo_id?: string;
  }>;

  constructor(
    message: string,
    results: Array<{
      filename: string;
      success: boolean;
      error?: string;
      photo_id?: string;
    }>,
    context?: Record<string, any>
  ) {
    super(message, UploadErrorCategory.VALIDATION, false, 400, context);
    this.results = results;
    Object.setPrototypeOf(this, BatchUploadError.prototype);
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof UploadError) {
    return error.retryable;
  }
  
  // Network errors are generally retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    );
  }
  
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof FileValidationError) {
    return error.message; // Already user-friendly
  }
  
  if (error instanceof FileProcessingError) {
    return 'Failed to process image. Please ensure the file is a valid image.';
  }
  
  if (error instanceof StorageError) {
    return 'Failed to save image. Please try again.';
  }
  
  if (error instanceof NetworkError) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error instanceof SecurityError) {
    return error.message; // Show security message
  }
  
  return 'An unexpected error occurred. Please try again.';
}
