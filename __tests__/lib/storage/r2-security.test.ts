/**
 * Security Tests for R2 Storage
 * Tests filename sanitization and MIME verification
 */

import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '@/lib/storage/r2';

describe('R2 Storage Security', () => {
  describe('sanitizeFilename', () => {
    it('should sanitize normal filename', () => {
      const result = sanitizeFilename('my photo 123.jpg');
      
      expect(result).toMatch(/^[a-zA-Z0-9_-]+\.jpg$/);
    });

    it('should block path traversal attempts', () => {
      const result = sanitizeFilename('../../../etc/passwd.jpg');
      
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should block hidden files', () => {
      const result = sanitizeFilename('.htaccess.jpg');
      
      expect(result).not.toMatch(/^\./);
    });

    it('should remove special characters', () => {
      const result = sanitizeFilename('my@photo#test$.jpg');
      
      expect(result).toMatch(/^[a-zA-Z0-9_-]+\.jpg$/);
    });

    it('should preserve file extension', () => {
      const result = sanitizeFilename('test.jpg');
      
      expect(result).toMatch(/\.jpg$/);
    });
  });
});
