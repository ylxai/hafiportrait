import { z } from 'zod'

// Password validation schema
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character')

// Username validation schema
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must not exceed 50 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

// Authentication schemas
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  username: usernameSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

// Event schemas
export const createEventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters').max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  access_code: z
    .string()
    .min(6, 'Access code must be at least 6 characters')
    .max(20)
    .regex(/^[A-Z0-9]+$/, 'Access code can only contain uppercase letters and numbers'),
  storage_duration_days: z
    .number()
    .int()
    .min(1, 'Storage duration must be at least 1 day')
    .max(365, 'Storage duration cannot exceed 365 days')
    .default(30),
  event_date: z.string().datetime().optional().nullable(),
  client_email: z.string().email().optional().nullable(),
  client_phone: z.string().max(20).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
})

export const updateEventSchema = createEventSchema.partial()

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(20).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
})

// Comment schema
export const commentSchema = z.object({
  guestName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format').optional().nullable(),
  message: z.string().min(1, 'Comment cannot be empty').max(1000),
  relationship: z.string().max(100).optional().nullable(),
})
