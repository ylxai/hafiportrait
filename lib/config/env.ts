/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // Cloudflare R2 Storage
  R2_ENDPOINT: z.string().url('R2_ENDPOINT must be a valid URL'),
  R2_ACCESS_KEY: z.string().min(1, 'R2_ACCESS_KEY is required'),
  R2_SECRET_KEY: z.string().min(1, 'R2_SECRET_KEY is required'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),
  R2_PUBLIC_URL: z.string().url('R2_PUBLIC_URL must be a valid URL'),
  
  // Redis (optional for caching)
  REDIS_URL: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables
 * This will throw an error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('Environment validation failed. Please check your .env file.')
    }
    throw error
  }
}

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv()

/**
 * Check if running in production
 */
export const isProd = env.NODE_ENV === 'production'

/**
 * Check if running in development
 */
export const isDev = env.NODE_ENV === 'development'

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test'
