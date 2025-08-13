import Redis from 'ioredis'

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
  keyGenerator: (identifier: string) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

export class RateLimiter {
  private redis: Redis
  private config: RateLimitConfig

  constructor(redis: Redis, config: RateLimitConfig) {
    this.redis = redis
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    }
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(identifier)
    const now = Date.now()
    const window = Math.floor(now / this.config.windowMs)
    const windowKey = `${key}:${window}`

    try {
      // Use a Lua script for atomic operations
      const luaScript = `
        local key = KEYS[1]
        local window_ms = tonumber(ARGV[1])
        local max_requests = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local current = redis.call('INCR', key)
        
        if current == 1 then
          redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
        end
        
        local ttl = redis.call('TTL', key)
        local reset_time = now + (ttl * 1000)
        
        return {current, max_requests - current, reset_time, max_requests}
      `

      const result = await this.redis.eval(
        luaScript,
        1,
        windowKey,
        this.config.windowMs.toString(),
        this.config.maxRequests.toString(),
        now.toString()
      ) as number[]

      const [current, remaining, resetTime] = result

      return {
        allowed: current <= this.config.maxRequests,
        remaining: Math.max(0, remaining),
        resetTime,
        totalRequests: current
      }

    } catch (error) {
      console.error('Rate limit check failed:', error)
      
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalRequests: 0
      }
    }
  }

  async resetLimit(identifier: string): Promise<void> {
    try {
      const key = this.config.keyGenerator(identifier)
      const pattern = `${key}:*`
      
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Rate limit reset failed:', error)
    }
  }

  async getStatus(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(identifier)
    const now = Date.now()
    const window = Math.floor(now / this.config.windowMs)
    const windowKey = `${key}:${window}`

    try {
      const current = await this.redis.get(windowKey)
      const totalRequests = current ? parseInt(current) : 0
      const remaining = Math.max(0, this.config.maxRequests - totalRequests)
      
      // Calculate reset time
      const ttl = await this.redis.ttl(windowKey)
      const resetTime = ttl > 0 ? now + (ttl * 1000) : now + this.config.windowMs

      return {
        allowed: totalRequests < this.config.maxRequests,
        remaining,
        resetTime,
        totalRequests
      }
    } catch (error) {
      console.error('Rate limit status check failed:', error)
      
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalRequests: 0
      }
    }
  }
}

// Pre-configured rate limiters
export class RateLimiterFactory {
  private static redis: Redis | null = null

  static initialize(redisUrl?: string): void {
    if (!this.redis) {
      const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
      this.redis = new Redis(url, {
        keyPrefix: 'ratelimit:',
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })
    }
  }

  static createIPRateLimiter(windowMs: number = 60000, maxRequests: number = 100): RateLimiter {
    if (!this.redis) {
      this.initialize()
    }

    return new RateLimiter(this.redis!, {
      windowMs,
      maxRequests,
      keyGenerator: (ip: string) => `ip:${ip}`
    })
  }

  static createApiKeyRateLimiter(windowMs: number = 3600000, maxRequests: number = 1000): RateLimiter {
    if (!this.redis) {
      this.initialize()
    }

    return new RateLimiter(this.redis!, {
      windowMs,
      maxRequests,
      keyGenerator: (apiKey: string) => `apikey:${apiKey}`
    })
  }

  static createUserRateLimiter(windowMs: number = 3600000, maxRequests: number = 500): RateLimiter {
    if (!this.redis) {
      this.initialize()
    }

    return new RateLimiter(this.redis!, {
      windowMs,
      maxRequests,
      keyGenerator: (userId: string) => `user:${userId}`
    })
  }

  static createGlobalRateLimiter(windowMs: number = 60000, maxRequests: number = 10000): RateLimiter {
    if (!this.redis) {
      this.initialize()
    }

    return new RateLimiter(this.redis!, {
      windowMs,
      maxRequests,
      keyGenerator: () => 'global'
    })
  }

  static async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      if (!this.redis) {
        return false
      }
      
      await this.redis.ping()
      return true
    } catch (error) {
      console.error('Rate limiter health check failed:', error)
      return false
    }
  }
}

// Export configured rate limiters
export const IPRateLimiter = () => RateLimiterFactory.createIPRateLimiter()
export const ApiKeyRateLimiter = () => RateLimiterFactory.createApiKeyRateLimiter()
export const UserRateLimiter = () => RateLimiterFactory.createUserRateLimiter()
export const GlobalRateLimiter = () => RateLimiterFactory.createGlobalRateLimiter()

export default RateLimiterFactory