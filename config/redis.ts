import Redis from 'ioredis'

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3
}

/**
 * Redis client for caching and rate limiting
 */
export const redis = new Redis(redisConfig)

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message)
})

/**
 * Helper: Set with TTL
 */
export async function setCache(key: string, value: any, ttl: number = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value))
}

/**
 * Helper: Get and parse
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

/**
 * Helper: Delete key
 */
export async function delCache(key: string) {
  await redis.del(key)
}

/**
 * Helper: Check rate limit
 * Returns true if rate limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const key = `ratelimit:${identifier}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.pexpire(key, windowMs)
  }

  return current > maxRequests
}

export default redis
