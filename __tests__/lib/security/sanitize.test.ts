import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeComment,
  sanitizeEmail,
  sanitizeFilename,
  sanitizeSlug,
  stripHtml,
  escapeHtml,
} from '@/lib/security/sanitize'

describe('Sanitization Functions', () => {
  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const result = sanitizeText('<script>alert("xss")</script>Hello')
      expect(result).toBe('Hello')
    })

    it('should remove malicious scripts', () => {
      const result = sanitizeText('Hello<script>document.cookie</script>World')
      expect(result).toBe('HelloWorld')
    })

    it('should handle empty input', () => {
      expect(sanitizeText('')).toBe('')
    })
  })

  describe('sanitizeComment', () => {
    it('should allow safe formatting tags', () => {
      const result = sanitizeComment('This is <b>bold</b> and <i>italic</i>')
      expect(result).toContain('<b>bold</b>')
      expect(result).toContain('<i>italic</i>')
    })

    it('should remove dangerous tags', () => {
      const result = sanitizeComment('Hello <script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
    })

    it('should remove event handlers', () => {
      const result = sanitizeComment('<b onclick="alert()">Click</b>')
      expect(result).not.toContain('onclick')
    })
  })

  describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
      const result = sanitizeEmail('TEST@EXAMPLE.COM')
      expect(result).toBe('test@example.com')
    })

    it('should remove HTML from email', () => {
      const result = sanitizeEmail('<b>test@example.com</b>')
      expect(result).toBe('test@example.com')
    })
  })

  describe('sanitizeFilename', () => {
    it('should remove path traversal', () => {
      const result = sanitizeFilename('../../../etc/passwd')
      expect(result).not.toContain('..')
    })

    it('should remove path separators', () => {
      const result = sanitizeFilename('path/to/file.txt')
      expect(result).not.toContain('/')
    })

    it('should keep valid filename characters', () => {
      const result = sanitizeFilename('my-file_123.txt')
      expect(result).toBe('my-file_123.txt')
    })

    it('should replace invalid characters with underscore', () => {
      const result = sanitizeFilename('file name!@#.txt')
      expect(result).toBe('file_name___.txt')
    })
  })

  describe('sanitizeSlug', () => {
    it('should create valid slug', () => {
      const result = sanitizeSlug('Hello World!')
      expect(result).toBe('hello-world-')
    })

    it('should replace spaces with hyphens', () => {
      const result = sanitizeSlug('My Event Name')
      expect(result).toBe('my-event-name')
    })

    it('should remove special characters', () => {
      const result = sanitizeSlug('Test@#$%Event')
      expect(result).toBe('test----event')
    })

    it('should handle multiple hyphens', () => {
      const result = sanitizeSlug('test---slug')
      expect(result).toBe('test-slug')
    })
  })

  describe('stripHtml', () => {
    it('should completely remove all HTML', () => {
      const result = stripHtml('<div><p>Hello</p></div>')
      expect(result).toBe('Hello')
    })
  })

  describe('escapeHtml', () => {
    it('should escape dangerous characters', () => {
      const result = escapeHtml('<script>alert("xss")</script>')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).not.toContain('<script>')
    })

    it('should escape quotes', () => {
      const result = escapeHtml('"test" and \'test\'')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
    })
  })
})
