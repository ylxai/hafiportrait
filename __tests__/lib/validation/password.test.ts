import { describe, it, expect } from 'vitest'
import { 
  validatePassword, 
  checkPasswordStrength, 
  PasswordStrength,
  passwordSchema 
} from '@/lib/validation/password'

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should accept valid strong password', () => {
      const result = validatePassword('MySecureP@ssw0rd!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 12 characters', () => {
      const result = validatePassword('Short1!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 12 characters')
    })

    it('should reject password without uppercase', () => {
      const result = validatePassword('lowercase123!')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true)
    })

    it('should reject password without lowercase', () => {
      const result = validatePassword('UPPERCASE123!')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('lowercase'))).toBe(true)
    })

    it('should reject password without number', () => {
      const result = validatePassword('NoNumbersHere!')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('number'))).toBe(true)
    })

    it('should reject password without special character', () => {
      const result = validatePassword('NoSpecialChar123')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('special'))).toBe(true)
    })

    it('should provide suggestions for weak passwords', () => {
      const result = validatePassword('weak')
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('checkPasswordStrength', () => {
    it('should rate strong password as STRONG', () => {
      const strength = checkPasswordStrength('MyVeryS3cure&ComplexP@ssw0rd!')
      expect(strength).toBe(PasswordStrength.STRONG)
    })

    it('should rate good password as GOOD', () => {
      const strength = checkPasswordStrength('GoodP@ssw0rd123')
      expect(strength).toBe(PasswordStrength.GOOD)
    })

    it('should rate fair password as FAIR', () => {
      const strength = checkPasswordStrength('FairPass123!')
      expect(strength).toBe(PasswordStrength.FAIR)
    })

    it('should rate weak password as WEAK', () => {
      const strength = checkPasswordStrength('weak123')
      expect(strength).toBe(PasswordStrength.WEAK)
    })
  })

  describe('passwordSchema (Zod)', () => {
    it('should parse valid password', () => {
      const result = passwordSchema.safeParse('ValidP@ssw0rd123')
      expect(result.success).toBe(true)
    })

    it('should reject invalid password', () => {
      const result = passwordSchema.safeParse('weak')
      expect(result.success).toBe(false)
    })
  })
})
