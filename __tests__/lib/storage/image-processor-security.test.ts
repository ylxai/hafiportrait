/**
 * Security Tests for Image Processor
 * Tests magic byte validation and DoS prevention
 */

import { describe, it, expect } from 'vitest';
import { validateImageBuffer } from '@/lib/storage/image-processor';

describe('Image Processor Security', () => {
  describe('validateImageBuffer', () => {
    it('should validate JPEG magic bytes correctly', () => {
      // Create valid JPEG buffer
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
      
      const result = validateImageBuffer(jpegBuffer, 'image/jpeg');
      
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/jpeg');
    });

    it('should validate PNG magic bytes correctly', () => {
      // Create valid PNG buffer
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
      
      const result = validateImageBuffer(pngBuffer, 'image/png');
      
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/png');
    });

    it('should validate WebP magic bytes correctly', () => {
      // Create valid WebP buffer (RIFF....WEBP)
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x00, 0x00, 0x00, 0x00, // File size
        0x57, 0x45, 0x42, 0x50, // "WEBP"
        0x56, 0x50              // VP8 chunk
      ]);
      
      const result = validateImageBuffer(webpBuffer, 'image/webp');
      
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/webp');
    });

    it('should reject buffer that is too small', () => {
      const smallBuffer = Buffer.from([0xFF, 0xD8]);
      
      const result = validateImageBuffer(smallBuffer);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should reject invalid magic bytes', () => {
      // Random bytes that don't match any format
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B]);
      
      const result = validateImageBuffer(invalidBuffer);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid or unsupported');
    });

    it('should reject MIME type mismatch', () => {
      // JPEG buffer but declared as PNG
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
      
      const result = validateImageBuffer(jpegBuffer, 'image/png');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MIME type mismatch');
      expect(result.detectedType).toBe('image/jpeg');
    });

    it('should prevent malicious executable disguised as image', () => {
      // Executable signature (MZ header)
      const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
      
      const result = validateImageBuffer(exeBuffer);
      
      expect(result.valid).toBe(false);
    });

    it('should accept image/jpg as alias for image/jpeg', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
      
      const result = validateImageBuffer(jpegBuffer, 'image/jpg');
      
      expect(result.valid).toBe(true);
    });
  });
});
