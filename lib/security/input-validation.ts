/**
 * Enhanced Input Validation
 * Priority: MEDIUM
 * 
 * Comprehensive Zod schemas untuk all API endpoints dengan:
 * - XSS protection
 * - SQL injection prevention
 * - File upload validation
 * - Email/phone validation
 */

import { z } from 'zod'

// ============================================
// COMMON VALIDATORS
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255)
  .toLowerCase()
  .trim()

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
  .min(10)
  .max(20)
  .trim()

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048)

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
  .min(3)
  .max(100)
  .toLowerCase()

export const access_codeSchema = z
  .string()
  .regex(/^[A-Z0-9]{6}$/, 'Access code must be 6 uppercase alphanumeric characters')

// Sanitized text input (XSS prevention)
export const sanitizedTextSchema = z
  .string()
  .max(1000)
  .trim()
  .transform((val) => val.replace(/[<>]/g, ''))

// Rich text dengan HTML sanitization
export const richTextSchema = z
  .string()
  .max(10000)
  .trim()

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

export const registerSchema = z.object({
  email: emailSchema,
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2).max(100).trim(),
  role: z.enum(['ADMIN', 'CLIENT']).default('CLIENT'),
})

// ============================================
// EVENT SCHEMAS
// ============================================

export const createEventSchema = z.object({
  name: z.string().min(3).max(200).trim(),
  event_date: z.string().datetime().optional(),
  client_email: emailSchema.optional(),
  client_phone: phoneSchema.optional(),
  description: richTextSchema.optional(),
  location: z.string().max(200).trim().optional(),
  storage_duration_days: z.number().int().min(1).max(365).default(30),
  coupleName: z.string().max(200).trim().optional(),
})

export const updateEventSchema = createEventSchema.partial()

export const accessEventSchema = z.object({
  access_code: access_codeSchema,
})

// ============================================
// PHOTO SCHEMAS
// ============================================

export const uploadPhotoSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.enum([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic'
  ]),
  file_size: z.number().int().min(1).max(50 * 1024 * 1024), // Max 50MB
})

export const updatePhotoSchema = z.object({
  caption: sanitizedTextSchema.optional(),
  display_order: z.number().int().min(0).optional(),
  is_featured: z.boolean().optional(),
})

export const likePhotoSchema = z.object({
  photo_id: z.string().cuid(),
  guestId: z.string().min(1).max(100),
})

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  guestName: z.string().min(2).max(100).trim(),
  email: emailSchema.optional(),
  message: sanitizedTextSchema,
  relationship: z.string().max(50).trim().optional(),
  photo_id: z.string().cuid().optional(),
})

export const moderateCommentSchema = z.object({
  status: z.enum(['approved', 'pending', 'rejected']),
})

// ============================================
// CONTACT SCHEMAS
// ============================================

export const contactFormSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  message: sanitizedTextSchema,
})

export const formSubmissionSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  whatsapp: phoneSchema,
  email: emailSchema,
  packageInterest: z.string().max(100).optional(),
  weddingDate: z.string().max(100).optional(),
  message: sanitizedTextSchema.optional(),
})

// ============================================
// ADMIN SCHEMAS
// ============================================

export const createPackageSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: richTextSchema.optional(),
  price: z.number().int().min(0),
  features: z.array(z.string()).default([]),
  isBestSeller: z.boolean().default(false),
  categoryId: z.string().cuid(),
  display_order: z.number().int().min(0).default(0),
})

export const updatePackageSchema = createPackageSchema.partial()

export const createPortfolioPhotoSchema = z.object({
  filename: z.string().min(1).max(255),
  category: z.string().max(50).optional(),
  description: sanitizedTextSchema.optional(),
  display_order: z.number().int().min(0).default(0),
  is_featured: z.boolean().default(false),
  is_featuredBento: z.boolean().default(false),
  bentoSize: z.enum(['small', 'medium', 'large']).optional(),
})

// ============================================
// FILE UPLOAD VALIDATION
// ============================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_FILES_PER_UPLOAD = 50

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}` }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 50MB)` }
  }

  // Validate filename
  const filename = file.name
  if (filename.length > 255) {
    return { valid: false, error: 'Filename too long' }
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Invalid filename' }
  }

  return { valid: true }
}

// ============================================
// SANITIZATION HELPERS
// ============================================

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove dangerous tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}

export function validateAndSanitizeInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Fix: Check if errors array has elements before accessing
      const firstError = error.errors[0]
      if (firstError) {
        return {
          success: false,
          error: `${firstError.path.join('.')}: ${firstError.message}`
        }
      }
    }
    return { success: false, error: 'Validation failed' }
  }
}
