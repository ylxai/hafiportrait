/**
 * Comprehensive API Validation Schemas
 * All API inputs MUST be validated through these schemas
 * 
 * SECURITY: Input validation is the first line of defense against:
 * - SQL Injection
 * - XSS attacks
 * - Buffer overflow
 * - Invalid data
 */

import { z } from 'zod';

// ============================================
// COMMON VALIDATION PATTERNS
// ============================================

/**
 * Safe string: alphanumeric + spaces, hyphens, underscores
 */
export const safeString = (minLength = 1, maxLength = 100) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must not exceed ${maxLength} characters`)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Contains invalid characters');

/**
 * Email validation with sanitization
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .transform(email => email.trim())
  .refine(email => email.length <= 255, 'Email too long');

/**
 * Phone number validation (Indonesian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Invalid phone number format')
  .transform(phone => phone.trim());

/**
 * Slug validation (URL-safe)
 */
export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(100, 'Slug must not exceed 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with hyphen');

/**
 * Access code validation (6 alphanumeric uppercase)
 */
export const access_codeSchema = z
  .string()
  .length(6, 'Access code must be exactly 6 characters')
  .regex(/^[A-Z0-9]{6}$/, 'Access code must be 6 uppercase alphanumeric characters')
  .transform(code => code.toUpperCase().trim());

/**
 * Text content validation (with HTML sanitization consideration)
 */
export const textContentSchema = (maxLength = 5000) =>
  z
    .string()
    .max(maxLength, `Text must not exceed ${maxLength} characters`)
    .transform(text => text.trim());

/**
 * Safe HTML-free text (removes all HTML tags)
 */
export const plainTextSchema = (maxLength = 5000) =>
  z
    .string()
    .max(maxLength)
    .transform(text => text.replace(/<[^>]*>/g, '').trim());

// ============================================
// EVENT SCHEMAS
// ============================================

export const createEventSchema = z.object({
  name: safeString(3, 200),
  slug: slugSchema,
  client_email: emailSchema,
  client_phone: phoneSchema.optional(),
  event_date: z.string().datetime().optional().nullable(),
  description: textContentSchema(500).optional().nullable(),
  location: safeString(1, 500).optional().nullable(),
  coupleName: safeString(1, 200).optional().nullable(),
  storage_duration_days: z.number().int().min(30).max(365).default(30),
  autoGenerateAccessCode: z.boolean().default(true),
});

export const updateEventSchema = createEventSchema.partial();

export const eventAccessSchema = z.object({
  access_code: access_codeSchema,
  password: z.string().max(100).optional().nullable(),
});

// ============================================
// CONTACT & FORM SCHEMAS
// ============================================

export const contactFormSchema = z.object({
  name: safeString(2, 100),
  whatsapp: phoneSchema,
  email: emailSchema,
  package: safeString(1, 100).optional().nullable(),
  date: z.string().max(100).optional().nullable(), // Wedding date as string for flexibility
  message: textContentSchema(1000).optional().nullable(),
});

export const contactMessageSchema = z.object({
  name: safeString(2, 100),
  email: emailSchema,
  phone: phoneSchema.optional().nullable(),
  message: textContentSchema(5000),
});

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  guestName: safeString(2, 100),
  email: emailSchema.optional().nullable(),
  message: textContentSchema(1000),
  relationship: safeString(1, 100).optional().nullable(),
  photo_id: z.string().cuid().optional().nullable(),
});

export const updateCommentSchema = z.object({
  status: z.enum(['approved', 'pending', 'rejected']),
  message: textContentSchema(1000).optional(),
});

// ============================================
// PHOTO SCHEMAS
// ============================================

export const updatePhotoSchema = z.object({
  caption: textContentSchema(500).optional().nullable(),
  display_order: z.number().int().min(0).optional(),
  is_featured: z.boolean().optional(),
});

export const photoFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['created_at', 'display_order', 'likes_count', 'views_count']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  is_featured: z.string().transform(val => val === 'true').optional(),
});

// ============================================
// PACKAGE & PRICING SCHEMAS
// ============================================

export const createPackageSchema = z.object({
  name: safeString(3, 100),
  description: textContentSchema(1000).optional().nullable(),
  price: z.number().int().min(0).max(1000000000), // Max 1 billion IDR
  features: z.array(z.string().max(200)).max(20).default([]),
  isBestSeller: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
  categoryId: z.string().cuid(),
});

export const updatePackageSchema = createPackageSchema.partial();

export const createPackageCategorySchema = z.object({
  name: safeString(3, 100),
  slug: slugSchema,
  icon: z.string().max(50).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const updatePackageCategorySchema = createPackageCategorySchema.partial();

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const loginSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
  name: safeString(2, 100),
});

// ============================================
// PAGINATION & FILTERING
// ============================================

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
});

export const searchSchema = z.object({
  search: z.string().max(100).optional(),
  status: z.string().max(20).optional(),
  sortBy: z.string().max(50).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// FILE UPLOAD VALIDATION
// ============================================

/**
 * Validate file metadata before processing
 */
export const fileMetadataSchema = z.object({
  filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),
  mimetype: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  size: z.number().int().min(1).max(200 * 1024 * 1024), // Max 200MB
});

// ============================================
// HERO SLIDESHOW SCHEMAS
// ============================================

export const createHeroSlideSchema = z.object({
  imageUrl: z.string().url().max(255),
  thumbnail_url: z.string().url().max(255).optional().nullable(),
  title: safeString(1, 100).optional().nullable(),
  subtitle: safeString(1, 200).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial();

// ============================================
// ADMIN OPERATIONS
// ============================================

export const bulkActionSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, 'At least one ID is required').max(100, 'Too many IDs'),
  action: z.enum(['delete', 'restore', 'archive', 'activate', 'deactivate']),
});

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

export const apiSchemas = {
  // Events
  createEvent: createEventSchema,
  updateEvent: updateEventSchema,
  eventAccess: eventAccessSchema,
  
  // Contact
  contactForm: contactFormSchema,
  contactMessage: contactMessageSchema,
  
  // Comments
  createComment: createCommentSchema,
  updateComment: updateCommentSchema,
  
  // Photos
  updatePhoto: updatePhotoSchema,
  photoFilter: photoFilterSchema,
  
  // Packages
  createPackage: createPackageSchema,
  updatePackage: updatePackageSchema,
  createPackageCategory: createPackageCategorySchema,
  updatePackageCategory: updatePackageCategorySchema,
  
  // Auth
  login: loginSchema,
  register: registerSchema,
  
  // Common
  pagination: paginationSchema,
  search: searchSchema,
  fileMetadata: fileMetadataSchema,
  bulkAction: bulkActionSchema,
  
  // Hero
  createHeroSlide: createHeroSlideSchema,
  updateHeroSlide: updateHeroSlideSchema,
};

export default apiSchemas;
