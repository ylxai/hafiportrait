/**
 * Environment Variables Validation
 * Centralized, type-safe environment configuration
 * 
 * CRITICAL: All environment variables MUST be validated here
 * This prevents runtime errors from missing or invalid env vars
 */

import { z } from 'zod';

/**
 * Environment variable schema
 * Add all required env vars here with proper validation
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL').optional(),
  
  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
  
  // Authentication & Security
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  JWT_EXPIRATION: z.string().default('24h'),
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(10).max(15)).default('12'),
  
  // Cloudflare R2 Storage
  R2_PUBLIC_URL: z.string().url('R2_PUBLIC_URL must be a valid URL'),
  R2_ENDPOINT: z.string().url('R2_ENDPOINT must be a valid URL'),
  R2_ACCESS_KEY: z.string().min(1, 'R2_ACCESS_KEY is required'),
  R2_SECRET_KEY: z.string().min(1, 'R2_SECRET_KEY is required'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),
  R2_REGION: z.string().default('auto'),
  
  // Socket.IO (Optional)
  SOCKET_IO_ENABLED: z.string().transform(val => val === 'true').default('false'),
  SOCKET_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1024).max(65535)).optional(),
  
  // Public Environment Variables (for client-side)
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL').optional(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url('NEXT_PUBLIC_SOCKET_URL must be a valid URL').optional(),
  NEXT_PUBLIC_ENABLE_REALTIME: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  
  // CORS & Security
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Optional Services
  WHATSAPP_API_URL: z.string().url().optional(),
  WHATSAPP_API_KEY: z.string().optional(),
  WHATSAPP_PHONE_NUMBER: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

/**
 * Validated environment variables
 * Safe to use throughout the application
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * This will throw an error if any required variable is missing or invalid
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Additional runtime checks
    if (parsed.NODE_ENV === 'production') {
      if (parsed.NEXTAUTH_SECRET === 'generate-a-secure-secret-minimum-32-characters-long') {
        throw new Error('CRITICAL: Default NEXTAUTH_SECRET detected in production! Generate a secure secret.');
      }
      
      if (!parsed.DATABASE_URL.includes('sslmode=require')) {
      }
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment variables. Please check your .env file.');
    }
    throw error;
  }
}

/**
 * Export validated environment variables
 * Use this throughout your application instead of process.env
 */
export const env = validateEnv();

/**
 * Helper: Get allowed CORS origins as array
 */
export function getAllowedOrigins(): string[] {
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
}

/**
 * Helper: Check if running in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Helper: Check if running in development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Helper: Check if running in test
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

/**
 * Helper: Get database URL with fallback
 */
export function getDatabaseUrl(): string {
  return env.DATABASE_URL;
}

/**
 * Helper: Get Redis URL
 */
export function getRedisUrl(): string {
  return env.REDIS_URL;
}

/**
 * Helper: Check if Socket.IO is enabled
 */
export function isSocketIOEnabled(): boolean {
  return env.SOCKET_IO_ENABLED;
}

/**
 * Type-safe environment variable access
 */
export default env;
