/**
 * Upload Errors Tests
 * Story 4.10: Photo Upload API & Validation
 */

import { describe, it, expect } from 'vitest';
import {
  UploadError,
  UploadErrorCategory,
  FileValidationError,
  FileProcessingError,
  StorageError,
  NetworkError,
  SecurityError,
  BatchUploadError,
  isRetryableError,
  getUserFriendlyMessage,
} from '@/lib/errors/upload-errors';

describe('Upload Errors', () => {
  describe('UploadError', () => {
    it('should create upload error with category', () => {
      const error = new UploadError(
        'Test error',
        UploadErrorCategory.VALIDATION,
        false,
        400
      );

      expect(error.message).toBe('Test error');
      expect(error.category).toBe(UploadErrorCategory.VALIDATION);
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Specific Error Types', () => {
    it('should create FileValidationError', () => {
      const error = new FileValidationError('Invalid file type');

      expect(error.category).toBe(UploadErrorCategory.VALIDATION);
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(400);
    });

    it('should create FileProcessingError', () => {
      const error = new FileProcessingError('Processing failed', true);

      expect(error.category).toBe(UploadErrorCategory.PROCESSING);
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(500);
    });

    it('should create StorageError', () => {
      const error = new StorageError('Storage failed', true);

      expect(error.category).toBe(UploadErrorCategory.STORAGE);
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(500);
    });

    it('should create NetworkError', () => {
      const error = new NetworkError('Network timeout');

      expect(error.category).toBe(UploadErrorCategory.NETWORK);
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(503);
    });

    it('should create SecurityError', () => {
      const error = new SecurityError('Malware detected');

      expect(error.category).toBe(UploadErrorCategory.SECURITY);
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(403);
    });

    it('should create BatchUploadError with results', () => {
      const results = [
        { filename: 'file1.jpg', success: true, photoId: '123' },
        { filename: 'file2.jpg', success: false, error: 'Invalid file' },
      ];

      const error = new BatchUploadError('Some uploads failed', results);

      expect(error.results).toEqual(results);
      expect(error.category).toBe(UploadErrorCategory.VALIDATION);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable upload errors', () => {
      const retryable = new StorageError('Storage failed', true);
      const notRetryable = new FileValidationError('Invalid file');

      expect(isRetryableError(retryable)).toBe(true);
      expect(isRetryableError(notRetryable)).toBe(false);
    });

    it('should identify retryable network errors', () => {
      const timeoutError = new Error('Connection timeout');
      const networkError = new Error('ECONNREFUSED');
      const otherError = new Error('Invalid input');

      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(otherError)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly messages for different error types', () => {
      const validationError = new FileValidationError('File too large');
      const processingError = new FileProcessingError('Sharp failed');
      const storageError = new StorageError('R2 unavailable');
      const networkError = new NetworkError('Timeout');
      const securityError = new SecurityError('Malware detected');

      expect(getUserFriendlyMessage(validationError)).toBe('File too large');
      expect(getUserFriendlyMessage(processingError)).toContain('Failed to process image');
      expect(getUserFriendlyMessage(storageError)).toContain('Failed to save image');
      expect(getUserFriendlyMessage(networkError)).toContain('Network error');
      expect(getUserFriendlyMessage(securityError)).toBe('Malware detected');
    });

    it('should return generic message for unknown errors', () => {
      const unknownError = new Error('Unknown');
      const message = getUserFriendlyMessage(unknownError);

      expect(message).toContain('unexpected error');
    });
  });
});
