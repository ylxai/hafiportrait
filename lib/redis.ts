import { createClient } from 'redis'
import { logger } from './logger'

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

/**
 * Parse Redis URL dan handle authentication
 * Format: redis://:password@host:port atau redis://host:port
 */
import fs from 'node:fs'

function readEnvVarFromFile(filePath: string, key: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const k = trimmed.slice(0, idx).trim()
      if (k !== key) continue
      let v = trimmed.slice(idx + 1).trim()
      // strip surrounding quotes
      v = v.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
      return v
    }
    return null
  } catch {
    return null
  }
}

function getEffectiveRedisUrl(): string {
  const envUrl = process.env.REDIS_URL
  // If production accidentally has a dev REDIS_URL without auth (e.g. from .env.local),
  // prefer the value from .env.production when present.
  if (process.env.NODE_ENV === 'production' && envUrl && !envUrl.includes('://:')) {
    const prodUrl = readEnvVarFromFile('.env.production', 'REDIS_URL')
    if (prodUrl && prodUrl.includes('://:')) return prodUrl
  }
  return envUrl || 'redis://localhost:6379'
}

const redisUrl = getEffectiveRedisUrl()

function parseRedisUrl(url: string): { url: string; password?: string } {
  // Support: redis://:password@host:port or rediss://:password@host:port
  // Some env loaders may keep surrounding quotes, so normalize first.
  url = url.trim().replace(/^"|"$/g, '')
  // Some URL parsers/tools can mis-handle `+` and `=` in password when unencoded.
  // We extract the raw password segment directly.
  const match = url.match(/^(rediss?:\/\/)(?::([^@]+)@)?(.+)$/)
  if (!match) return { url }

  const scheme = match[1]
  const password = match[2]
  const rest = match[3]

  // Rebuild URL without embedding password
  return {
    url: `${scheme}${rest}`,
    password,
  }
}

const { url: redisUrlNoPass, password: redisPasswordFromUrl } = parseRedisUrl(redisUrl)
const redisPassword = process.env.REDIS_PASSWORD || redisPasswordFromUrl

export const redis =
  globalForRedis.redis ??
  createClient({
    url: redisUrlNoPass,
    password: redisPassword,
    socket: {
      reconnectStrategy: (retries) => {
        // Exponential backoff dengan max 3000ms
        if (retries > 10) {
          logger.error('Redis: Max reconnection attempts reached')
          return new Error('Redis: Max reconnection attempts reached')
        }
        return Math.min(retries * 100, 3000)
      },
      connectTimeout: 10000, // 10 seconds
    },
  })

// Development hot reload protection
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Error handling
redis.on('error', (err) => {
  logger.error('Redis Client Error', err)
})

redis.on('connect', () => {
  logger.info('Redis connected to server')
})

redis.on('ready', () => {
  logger.info('Redis ready to accept commands')
})

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...')
})

redis.on('end', () => {
  logger.info('Redis connection ended')
})

// Connect to Redis
if (!redis.isOpen) {
  redis.connect().catch((err) => {
    logger.error('Redis connection error', err)
    // Don't crash the application, let it retry
  })
}

/**
 * Graceful shutdown
 */
export async function disconnectRedis() {
  if (redis.isOpen) {
    await redis.quit()
  }
}

/**
 * Health check
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const response = await redis.ping()
    return response === 'PONG'
  } catch (error) {
    logger.error('Redis health check failed', error)
    return false
  }
}

/**
 * Get Redis client for specific database
 * @param db Database number (0-15)
 */
export async function getRedisDatabase(db: number) {
  const client = redis.duplicate()
  await client.connect()
  await client.select(db)
  return client
}

export default redis
