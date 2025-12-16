import { z } from 'zod'

/**
 * Password validation requirements
 */
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
}

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'WEAK',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  STRONG = 'STRONG',
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean
  strength: PasswordStrength
  errors: string[]
  suggestions: string[]
}

/**
 * Zod schema untuk password dengan complexity requirements
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character (!@#$%^&*)'
  )
/**
 * Check password strength
 */
/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0

  // Length scoring
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (password.length >= 20) score += 1

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  // Pattern checks (deduct points)
  if (/(.)\1{2,}/.test(password)) score -= 1 // Repeated characters
  if (/^[0-9]+$/.test(password)) score -= 2 // Only numbers
  if (/^[a-zA-Z]+$/.test(password)) score -= 2 // Only letters

  // Determine strength
  if (score >= 7) return PasswordStrength.STRONG
  if (score >= 5) return PasswordStrength.GOOD
  if (score >= 3) return PasswordStrength.FAIR
  return PasswordStrength.WEAK
}

/**
 * Validate password dan return detailed result
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  const suggestions: string[] = []

  // Length check
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    suggestions.push('Add more characters to meet minimum length')
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
    suggestions.push('Add uppercase letters (A-Z)')
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
    suggestions.push('Add lowercase letters (a-z)')
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
    suggestions.push('Add numbers (0-9)')
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
    suggestions.push('Add special characters (!@#$%^&*)')
  }

  // Additional checks untuk suggestions
  if (password.length < 16) {
    suggestions.push('Consider using 16+ characters for better security')
  }

  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Avoid repeated characters (e.g., "aaa", "111")')
  }

  const strength = checkPasswordStrength(password)
  const isValid = errors.length === 0

  return {
    isValid,
    strength,
    errors,
    suggestions,
  }
}

/**
 * Get password strength label dengan color
 */
export function getPasswordStrengthLabel(strength: PasswordStrength): {
  label: string
  color: string
} {
  switch (strength) {
    case PasswordStrength.STRONG:
      return { label: 'Strong', color: 'green' }
    case PasswordStrength.GOOD:
      return { label: 'Good', color: 'blue' }
    case PasswordStrength.FAIR:
      return { label: 'Fair', color: 'yellow' }
    case PasswordStrength.WEAK:
      return { label: 'Weak', color: 'red' }
  }
}
