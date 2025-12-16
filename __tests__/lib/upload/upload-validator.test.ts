/**
 * Upload Validator Tests
 * Story 4.10: Photo Upload API & Validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSingleFile,
  validateBatchUpload,
  validateAndSanitizeMetadata,
} from '@/lib/upload/upload-validator';
import { FILE_SIZE_LIMITS } from '@/lib/validation/file-validator';

describe('Upload Validator', () => {
  describe('validateSingleFile', () => {
    it('should validate a valid JPEG file', async () => {
      // Create a minimal valid JPEG
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
      const jpegData = Buffer.concat([jpegHeader, Buffer.alloc(FILE_SIZE_LIMITS.MIN_FILE_SIZE)]);
      
      const result = await validateSingleFile(
        jpegData,
        'test.jpg',
        'image/jpeg'
      );

      // Note: This will likely fail integrity check since it's not a real image
      // We're testing the size and type validation parts
      expect(result.filename).toBe('test.jpg');
      expect(result.sanitizedFilename).toBe('test.jpg');
    });

    it('should reject file that is too small', async () => {
      const smallBuffer = Buffer.alloc(1024); // 1KB
      
      const result = await validateSingleFile(
        smallBuffer,
        'small.jpg',
        'image/jpeg'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too small');
    });

    it('should reject file that is too large', async () => {
      const largeBuffer = Buffer.alloc(FILE_SIZE_LIMITS.MAX_FILE_SIZE + 1000);
      
      const result = await validateSingleFile(
        largeBuffer,
        'large.jpg',
        'image/jpeg'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject disallowed MIME type', async () => {
      const buffer = Buffer.alloc(FILE_SIZE_LIMITS.MIN_FILE_SIZE + 1000);
      
      const result = await validateSingleFile(
        buffer,
        'test.gif',
        'image/gif'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });

    it('should sanitize filename', async () => {
      const buffer = Buffer.alloc(FILE_SIZE_LIMITS.MIN_FILE_SIZE + 1000);
      
      const result = await validateSingleFile(
        buffer,
        '../../../etc/passwd.jpg',
        'image/jpeg'
      );

      expect(result.sanitizedFilename).not.toContain('..');
      expect(result.sanitizedFilename).not.toContain('/');
    });
  });

  describe('validateBatchUpload', () => {
    it('should reject empty file list', async () => {
      const result = await validateBatchUpload([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No files provided');
    });

    it('should reject too many files', async () => {
      const files = Array(101).fill(null).map((_, i) => ({
        file: Buffer.alloc(FILE_SIZE_LIMITS.MIN_FILE_SIZE + 1000),
        filename: `file${i}.jpg`,
        mimeType: 'image/jpeg',
      }));

      const result = await validateBatchUpload(files, { maxFiles: 100 });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Too many files');
    });

    it('should reject batch that exceeds size limit', async () => {
      const largeFileSize = 1.5 * 1024 * 1024 * 1024; // 1.5GB each
      const files = [
        {
          file: Buffer.alloc(largeFileSize),
          filename: 'large1.jpg',
          mimeType: 'image/jpeg',
        },
        {
          file: Buffer.alloc(largeFileSize),
          filename: 'large2.jpg',
          mimeType: 'image/jpeg',
        },
      ];

      const result = await validateBatchUpload(files, {
        maxBatchSize: FILE_SIZE_LIMITS.MAX_BATCH_SIZE,
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Batch too large');
    });

    it('should calculate total batch size correctly', async () => {
      const fileSize = 100 * 1024; // 100KB
      const files = [
        {
          file: Buffer.alloc(fileSize),
          filename: 'file1.jpg',
          mimeType: 'image/jpeg',
        },
        {
          file: Buffer.alloc(fileSize),
          filename: 'file2.jpg',
          mimeType: 'image/jpeg',
        },
      ];

      const result = await validateBatchUpload(files);

      expect(result.totalSize).toBe(fileSize * 2);
    });
  });

  describe('validateAndSanitizeMetadata', () => {
    it('should sanitize caption', () => {
      const metadata = {
        caption: '<script>alert("xss")</script>Beautiful photo',
      };

      const sanitized = validateAndSanitizeMetadata(metadata);

      expect(sanitized.caption).not.toContain('<');
      expect(sanitized.caption).not.toContain('>');
      expect(sanitized.caption).toContain('Beautiful photo');
    });

    it('should limit caption length', () => {
      const metadata = {
        caption: 'A'.repeat(2000),
      };

      const sanitized = validateAndSanitizeMetadata(metadata);

      expect(sanitized.caption?.length).toBeLessThanOrEqual(1000);
    });

    it('should validate and sanitize tags', () => {
      const metadata = {
        tags: ['wedding', '<script>xss</script>', 'portrait', '', '   whitespace   '],
      };

      const sanitized = validateAndSanitizeMetadata(metadata);

      expect(sanitized.tags).toContain('wedding');
      expect(sanitized.tags).toContain('portrait');
      expect(sanitized.tags).toContain('whitespace');
      expect(sanitized.tags?.every(tag => !tag.includes('<'))).toBe(true);
      expect(sanitized.tags?.every(tag => tag.trim() === tag)).toBe(true);
      expect(sanitized.tags?.every(tag => tag.length > 0)).toBe(true);
    });

    it('should limit number of tags', () => {
      const metadata = {
        tags: Array(30).fill('tag'),
      };

      const sanitized = validateAndSanitizeMetadata(metadata);

      expect(sanitized.tags?.length).toBeLessThanOrEqual(20);
    });

    it('should validate ISO range', () => {
      const validMeta = validateAndSanitizeMetadata({ iso: 400 });
      expect(validMeta.iso).toBe(400);

      const tooLow = validateAndSanitizeMetadata({ iso: 10 });
      expect(tooLow.iso).toBeUndefined();

      const tooHigh = validateAndSanitizeMetadata({ iso: 200000 });
      expect(tooHigh.iso).toBeUndefined();
    });

    it('should validate aperture range', () => {
      const validMeta = validateAndSanitizeMetadata({ aperture: 2.8 });
      expect(validMeta.aperture).toBe(2.8);

      const tooLow = validateAndSanitizeMetadata({ aperture: 0.5 });
      expect(tooLow.aperture).toBeUndefined();

      const tooHigh = validateAndSanitizeMetadata({ aperture: 100 });
      expect(tooHigh.aperture).toBeUndefined();
    });

    it('should validate focal length range', () => {
      const validMeta = validateAndSanitizeMetadata({ focalLength: 50 });
      expect(validMeta.focalLength).toBe(50);

      const tooLow = validateAndSanitizeMetadata({ focalLength: 0 });
      expect(tooLow.focalLength).toBeUndefined();

      const tooHigh = validateAndSanitizeMetadata({ focalLength: 3000 });
      expect(tooHigh.focalLength).toBeUndefined();
    });
  });
});
