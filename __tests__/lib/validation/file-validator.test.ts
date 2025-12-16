/**
 * File Validator Tests
 * Story 4.10: Photo Upload API & Validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateMimeType,
  validateFileSize,
  validateBatchSize,
  sanitizeFilename,
  isAllowedMimeType,
  validateMagicBytes,
  checkMalwareSignatures,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
} from '@/lib/validation/file-validator';

describe('File Validator', () => {
  describe('validateMagicBytes', () => {
    it('should validate JPEG magic bytes', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const result = validateMagicBytes(jpegBuffer, 'image/jpeg');
      expect(result.valid).toBe(true);
    });

    it('should validate PNG magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = validateMagicBytes(pngBuffer, 'image/png');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid magic bytes', () => {
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = validateMagicBytes(invalidBuffer, 'image/jpeg');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMimeType', () => {
    it('should accept allowed MIME types', () => {
      const result = validateMimeType('image/jpeg');
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      const result = validateMimeType('application/exe');
      expect(result.valid).toBe(false);
    });

    it('should reject empty MIME type', () => {
      const result = validateMimeType('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept file within size limit', () => {
      const result = validateFileSize(5 * 1024 * 1024); // 5MB
      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const result = validateFileSize(FILE_SIZE_LIMITS.MAX_FILE_SIZE + 1);
      expect(result.valid).toBe(false);
    });

    it('should reject zero-size file', () => {
      const result = validateFileSize(0);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBatchSize', () => {
    it('should accept batch within limit', () => {
      const files = [
        { size: 10 * 1024 * 1024 }, // 10MB
        { size: 20 * 1024 * 1024 }, // 20MB
        { size: 20 * 1024 * 1024 }  // 20MB = total 50MB
      ];
      const result = validateBatchSize(files);
      expect(result.valid).toBe(true);
    });

    it('should reject batch exceeding limit', () => {
      const files = [
        { size: FILE_SIZE_LIMITS.MAX_BATCH_SIZE + 1 }
      ];
      const result = validateBatchSize(files);
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove special characters', () => {
      const result = sanitizeFilename('my@photo#test$.jpg');
      expect(result).toMatch(/^[a-zA-Z0-9_-]+\.jpg$/);
    });

    it('should block path traversal', () => {
      const result = sanitizeFilename('../../../etc/passwd.jpg');
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should preserve extension', () => {
      const result = sanitizeFilename('test.jpg');
      expect(result).toMatch(/\.jpg$/);
    });
  });

  describe('isAllowedMimeType', () => {
    it('should return true for allowed types', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('should return false for disallowed types', () => {
      expect(isAllowedMimeType('application/exe')).toBe(false);
      expect(isAllowedMimeType('text/html')).toBe(false);
    });
  });

  describe('checkMalwareSignatures', () => {
    it('should not detect malware in clean buffer', () => {
      const cleanBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const result = checkMalwareSignatures(cleanBuffer);
      expect(result.valid).toBe(true);
    });

    it('should detect suspicious patterns', () => {
      const suspiciousBuffer = Buffer.from('<?php eval($_POST[');
      const result = checkMalwareSignatures(suspiciousBuffer);
      expect(result.valid).toBe(false);
    });
  });
});
