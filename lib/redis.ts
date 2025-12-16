import { createClient } from 'redis'

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

/**
 * Parse Redis URL dan handle authentication
 * Format: redis://:password@host:port atau redis://host:port
 */
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis =
  globalForRedis.redis ??
  createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        // Exponential backoff dengan max 3000ms
        if (retries > 10) {
          console.error('Redis: Max reconnection attempts reached')
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
  console.error('Redis Client Error:', err)
})

redis.on('connect', () => {
  console.log('Redis: Connected to server')
})

redis.on('ready', () => {
  console.log('Redis: Ready to accept commands')
})

redis.on('reconnecting', () => {
  console.log('Redis: Reconnecting...')
})

redis.on('end', () => {
  console.log('Redis: Connection ended')
})

// Connect to Redis
if (!redis.isOpen) {
  redis.connect().catch((err) => {
    console.error('Redis connection error:', err)
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
    console.error('Redis health check failed:', error)
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
