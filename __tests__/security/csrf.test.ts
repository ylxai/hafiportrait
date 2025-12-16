/**
 * CSRF Protection Tests
 */

import { describe, it, expect } from 'vitest'
import {
  generateCSRFSecret,
  generateCSRFToken,
  validateCSRFToken,
} from '@/lib/security/csrf'

describe('CSRF Protection', () => {
  describe('generateCSRFSecret', () => {
    it('should generate unique secrets', () => {
      const secret1 = generateCSRFSecret()
      const secret2 = generateCSRFSecret()
      
      expect(secret1).not.toBe(secret2)
      expect(secret1.length).toBeGreaterThan(0)
    })

    it('should generate secrets with correct length', () => {
      const secret = generateCSRFSecret()
      expect(secret.length).toBe(128)
    })
  })

  describe('validateCSRFToken', () => {
    it('should validate correct token', () => {
      const secret = generateCSRFSecret()
      const token = generateCSRFToken(secret)
      
      const isValid = validateCSRFToken(token, secret)
      expect(isValid).toBe(true)
    })

    it('should reject invalid token', () => {
      const secret = generateCSRFSecret()
      const invalidToken = 'invalid.token'
      
      const isValid = validateCSRFToken(invalidToken, secret)
      expect(isValid).toBe(false)
    })
  })
})
