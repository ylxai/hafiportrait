import { z } from 'zod'

/**
 * Security Configuration Schema
 * Validates environment variables untuk security settings
 */
const securityConfigSchema = z.object({
  jwtSecret: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long')
    .refine(
      (secret) => secret !== 'default-secret-change-this',
      'JWT_SECRET cannot be the default value. Generate a secure secret.'
    ),
  jwtExpirationTime: z.string().default('24h'),
  bcryptRounds: z.number().min(12).max(15).default(12),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
})

export type SecurityConfig = z.infer<typeof securityConfigSchema>

/**
 * Validate dan load security configuration dari environment variables
 * Throws error jika configuration tidak valid
 */
function loadSecurityConfig(): SecurityConfig {
  const rawConfig = {
    jwtSecret: process.env.NEXTAUTH_SECRET,
    jwtExpirationTime: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  }

  try {
    return securityConfigSchema.parse(rawConfig)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(
        `❌ Security Configuration Error:\n${errorMessages}\n\n` +
          `Please check your environment variables:\n` +
          `  1. Ensure NEXTAUTH_SECRET is set\n` +
          `  2. NEXTAUTH_SECRET must be at least 32 characters\n` +
          `  3. Generate a secure secret using: openssl rand -base64 32\n\n` +
          `Add to your .env.local file:\n` +
          `NEXTAUTH_SECRET="your-secure-secret-here"`
    )
    }
    throw error
  }
}

// Load dan validate config saat startup
export const securityConfig = loadSecurityConfig()

/**
 * Get JWT secret as Uint8Array untuk jose library
 */
export function getJWTSecret(): Uint8Array {
  return new TextEncoder().encode(securityConfig.jwtSecret)
}

/**
 * Validate JWT secret exists dan memenuhi requirements
 * Digunakan untuk startup checks
 */
export function validateJWTSecret(): void {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      '❌ CRITICAL: NEXTAUTH_SECRET is not set!\n\n' +
        'Generate a secure secret:\n' +
        '  openssl rand -base64 32\n\n' +
        'Then add to .env.local:\n' +
        '  NEXTAUTH_SECRET="your-generated-secret"'
    )

  }
  const secret = process.env.NEXTAUTH_SECRET
  
  if (secret.length < 32) {
    throw new Error(
      `❌ CRITICAL: NEXTAUTH_SECRET is too short (${secret.length} characters)\n\n` +
        'Minimum requirement: 32 characters\n' +
        'Generate a secure secret:\n' +
        '  openssl rand -base64 32'
    )
  }

  if (secret === 'default-secret-change-this') {
    throw new Error(
      '❌ CRITICAL: You are using the default NEXTAUTH_SECRET!\n\n' +
        'This is a severe security risk. Generate a unique secret:\n' +
        '  openssl rand -base64 32\n\n' +
        'Then update your .env.local file.'
    )
  }
}

// Validate saat module di-load
validateJWTSecret()

// Log configuration (tanpa expose secret) di development
if (securityConfig.nodeEnv === 'development') {
}
