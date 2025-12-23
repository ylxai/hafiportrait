/**
 * Response Schemas for API Data Validation
 * 
 * These schemas validate data coming FROM database/Prisma
 * Use with .parse() for runtime validation and type inference
 * 
 * Example:
 * const validatedEvent = EventResponseSchema.parse(prismaEvent)
 * type Event = z.infer<typeof EventResponseSchema>
 */

import { z } from 'zod'

// ============================================
// EVENT SCHEMAS
// ============================================

/**
 * Event response from Prisma queries
 */
export const EventResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  client_email: z.string().email().nullable(),
  client_phone: z.string().nullable(),
  event_date: z.date().nullable(),
  location: z.string().nullable(),
  couple_name: z.string().nullable(),
  access_code: z.string().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  cover_photo_id: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  _count: z.object({
    photos: z.number(),
    comments: z.number(),
  }).optional(),
})

export type EventResponse = z.infer<typeof EventResponseSchema>

/**
 * Simplified event for listing/cards
 */
export const EventListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  event_date: z.date().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  photo_count: z.number(),
  cover_photo_url: z.string().nullable(),
  created_at: z.date(),
})

export type EventListItem = z.infer<typeof EventListItemSchema>

// ============================================
// PHOTO SCHEMAS
// ============================================

/**
 * Photo response from Prisma queries
 */
export const PhotoResponseSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  filename: z.string(),
  original_url: z.string(),
  thumbnail_small_url: z.string().nullable(),
  thumbnail_medium_url: z.string().nullable(),
  thumbnail_large_url: z.string().nullable(),
  file_size: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  caption: z.string().nullable(),
  taken_at: z.date().nullable(),
  camera_make: z.string().nullable(),
  camera_model: z.string().nullable(),
  lens_model: z.string().nullable(),
  focal_length: z.number().nullable(),
  aperture: z.number().nullable(),
  shutter_speed: z.string().nullable(),
  iso: z.number().nullable(),
  display_order: z.number(),
  is_featured: z.boolean(),
  views_count: z.number(),
  likes_count: z.number(),
  downloads_count: z.number(),
  deleted_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type PhotoResponse = z.infer<typeof PhotoResponseSchema>

/**
 * Simplified photo for grid/gallery
 */
export const PhotoGridItemSchema = z.object({
  id: z.string(),
  filename: z.string(),
  original_url: z.string(),
  thumbnail_medium_url: z.string().nullable(),
  caption: z.string().nullable(),
  is_featured: z.boolean(),
  views_count: z.number(),
  likes_count: z.number(),
  display_order: z.number(),
  created_at: z.date(),
})

export type PhotoGridItem = z.infer<typeof PhotoGridItemSchema>

// ============================================
// COMMENT SCHEMAS
// ============================================

/**
 * Comment response from Prisma queries
 */
export const CommentResponseSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  guest_name: z.string(),
  email: z.string().email().nullable(),
  message: z.string(),
  relationship: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  created_at: z.date(),
  updated_at: z.date(),
})

export type CommentResponse = z.infer<typeof CommentResponseSchema>

// ============================================
// PORTFOLIO SCHEMAS
// ============================================

/**
 * Portfolio photo response
 */
export const PortfolioPhotoResponseSchema = z.object({
  id: z.string(),
  filename: z.string(),
  original_url: z.string(),
  thumbnail_url: z.string(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  is_featured: z.boolean(),
  display_order: z.number(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type PortfolioPhotoResponse = z.infer<typeof PortfolioPhotoResponseSchema>

// ============================================
// PACKAGE SCHEMAS
// ============================================

/**
 * Package response
 */
export const PackageResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  price: z.string(),
  currency: z.string(),
  description: z.string().nullable(),
  features: z.array(z.string()),
  is_active: z.boolean(),
  display_order: z.number(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type PackageResponse = z.infer<typeof PackageResponseSchema>

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse Prisma data with error handling
 */
export function parseResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Validation error${context ? ` in ${context}` : ''}:`, error.errors)
      throw new Error(`Invalid data format${context ? ` in ${context}` : ''}`)
    }
    throw error
  }
}

/**
 * Parse array of Prisma data
 */
export function parseResponseArray<T>(
  schema: z.ZodSchema<T>,
  data: unknown[],
  context?: string
): T[] {
  return data.map((item, index) => 
    parseResponse(schema, item, `${context}[${index}]`)
  )
}
