import { logger } from './logger'

// Check if running on Vercel (serverless) or VPS
// Support both Vercel KV and Upstash direct integration
const UPSTASH_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const isVercel = process.env.VERCEL === '1' || !!UPSTASH_URL

// =============================================================================
// UPSTASH REDIS (for Vercel serverless)
// =============================================================================
let upstashClient: import('@upstash/redis').Redis | null = null

async function getUpstashClient() {
  if (!upstashClient) {
    const { Redis } = await import('@upstash/redis')
    upstashClient = new Redis({
      url: UPSTASH_URL!,
      token: UPSTASH_TOKEN!,
    })
  }
  return upstashClient
}

// =============================================================================
// NODE REDIS (for VPS with local Redis)
// =============================================================================
let nodeRedisClient: ReturnType<typeof import('redis').createClient> | null =
  null

async function getNodeRedisClient() {
  if (!nodeRedisClient) {
    const { createClient } = await import('redis')

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    nodeRedisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis max retries reached, stopping reconnection')
            return false
          }
          return Math.min(retries * 100, 3000)
        },
      },
    })

    nodeRedisClient.on('error', (err) => {
      logger.error('Redis Client Error', err)
    })

    nodeRedisClient.on('connect', () => {
      logger.info('Redis connected')
    })

    nodeRedisClient.on('ready', () => {
      logger.info('Redis ready')
    })

    try {
      await nodeRedisClient.connect()
    } catch (error) {
      logger.error('Redis connection failed', error)
    }
  }

  return nodeRedisClient
}

// =============================================================================
// UNIFIED REDIS INTERFACE
// =============================================================================

/**
 * Get a value from Redis
 */
export async function get(key: string): Promise<string | null> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      return await client.get(key)
    } else {
      const client = await getNodeRedisClient()
      return (await client?.get(key)) ?? null
    }
  } catch (error) {
    logger.error('Redis GET error', { key, error })
    return null
  }
}

/**
 * Set a value in Redis
 */
export async function set(
  key: string,
  value: string,
  options?: { ex?: number }
): Promise<void> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      if (options?.ex) {
        await client.set(key, value, { ex: options.ex })
      } else {
        await client.set(key, value)
      }
    } else {
      const client = await getNodeRedisClient()
      if (options?.ex) {
        await client?.setEx(key, options.ex, value)
      } else {
        await client?.set(key, value)
      }
    }
  } catch (error) {
    logger.error('Redis SET error', { key, error })
  }
}

/**
 * Delete a key from Redis
 */
export async function del(key: string): Promise<void> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      await client.del(key)
    } else {
      const client = await getNodeRedisClient()
      await client?.del(key)
    }
  } catch (error) {
    logger.error('Redis DEL error', { key, error })
  }
}

/**
 * Increment a value
 */
export async function incr(key: string): Promise<number> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      return await client.incr(key)
    } else {
      const client = await getNodeRedisClient()
      return (await client?.incr(key)) ?? 0
    }
  } catch (error) {
    logger.error('Redis INCR error', { key, error })
    return 0
  }
}

/**
 * Set expiration on a key
 */
export async function expire(key: string, seconds: number): Promise<void> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      await client.expire(key, seconds)
    } else {
      const client = await getNodeRedisClient()
      await client?.expire(key, seconds)
    }
  } catch (error) {
    logger.error('Redis EXPIRE error', { key, error })
  }
}

/**
 * Health check
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      const response = await client.ping()
      return response === 'PONG'
    } else {
      const client = await getNodeRedisClient()
      const response = await client?.ping()
      return response === 'PONG'
    }
  } catch (error) {
    logger.error('Redis health check failed', error)
    return false
  }
}

/**
 * Get TTL of a key
 */
export async function ttl(key: string): Promise<number> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      return await client.ttl(key)
    } else {
      const client = await getNodeRedisClient()
      return (await client?.ttl(key)) ?? -2
    }
  } catch (error) {
    logger.error('Redis TTL error', { key, error })
    return -2
  }
}

/**
 * Sorted Set: Add members
 */
export async function zAdd(
  key: string,
  options: { score: number; value: string }
): Promise<void> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      await client.zadd(key, { score: options.score, member: options.value })
    } else {
      const client = await getNodeRedisClient()
      await client?.zAdd(key, { score: options.score, value: options.value })
    }
  } catch (error) {
    logger.error('Redis ZADD error', { key, error })
  }
}

/**
 * Sorted Set: Get range by score
 */
export async function zRangeByScore(
  key: string,
  min: number,
  max: number
): Promise<string[]> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      return (await client.zrange(key, min, max, { byScore: true })) as string[]
    } else {
      const client = await getNodeRedisClient()
      return (await client?.zRangeByScore(key, min, max)) ?? []
    }
  } catch (error) {
    logger.error('Redis ZRANGEBYSCORE error', { key, error })
    return []
  }
}

/**
 * Sorted Set: Remove range by score
 */
export async function zRemRangeByScore(
  key: string,
  min: number,
  max: number
): Promise<void> {
  try {
    if (isVercel) {
      const client = await getUpstashClient()
      await client.zremrangebyscore(key, min, max)
    } else {
      const client = await getNodeRedisClient()
      await client?.zRemRangeByScore(key, min, max)
    }
  } catch (error) {
    logger.error('Redis ZREMRANGEBYSCORE error', { key, error })
  }
}

// Export unified interface
const redis = {
  get,
  set,
  del,
  incr,
  expire,
  ttl,
  isHealthy: isRedisHealthy,
  zAdd,
  zRangeByScore,
  zRemRangeByScore,
}

export default redis
