import Redis from 'ioredis'
import crypto from 'crypto'

export interface CacheEntry {
  filePath: string
  fileName: string
  fileSize: number
  format: string
  metadata: Record<string, any>
  createdAt: string
}

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  skipCache?: boolean
  refreshCache?: boolean
}

export class ScreenshotCache {
  private static instance: ScreenshotCache
  private redis: Redis | null = null
  private enabled: boolean
  private defaultTTL: number

  private constructor() {
    this.enabled = process.env.ENABLE_SCREENSHOT_CACHE === 'true'
    this.defaultTTL = parseInt(process.env.SCREENSHOT_CACHE_TTL || '3600') // 1 hour default
    
    if (this.enabled) {
      this.initializeRedis()
    }
  }

  static getInstance(): ScreenshotCache {
    if (!ScreenshotCache.instance) {
      ScreenshotCache.instance = new ScreenshotCache()
    }
    return ScreenshotCache.instance
  }

  private initializeRedis(): void {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      this.redis = new Redis(redisUrl, {
        keyPrefix: 'screenshot:',
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })

      this.redis.on('error', (error) => {
        console.error('Screenshot cache Redis error:', error)
        this.enabled = false
      })

      this.redis.on('connect', () => {
        console.log('Screenshot cache connected to Redis')
      })
    } catch (error) {
      console.error('Failed to initialize screenshot cache:', error)
      this.enabled = false
    }
  }

  // Generate cache key from URL and options
  generateCacheKey(url: string, options: Record<string, any> = {}): string {
    const normalizedOptions = {
      width: options.width || 1920,
      height: options.height || 1080,
      format: options.format || 'png',
      fullPage: options.fullPage || false,
      deviceType: options.deviceType || 'desktop',
      waitTime: options.waitTime || 0
    }

    const cacheString = `${url}:${JSON.stringify(normalizedOptions)}`
    return crypto.createHash('sha256').update(cacheString).digest('hex')
  }

  // Check if screenshot is cached
  async get(url: string, options: Record<string, any> = {}): Promise<CacheEntry | null> {
    if (!this.enabled || !this.redis) {
      return null
    }

    try {
      const cacheKey = this.generateCacheKey(url, options)
      const cached = await this.redis.get(cacheKey)
      
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached)
        
        // Check if file still exists (basic validation)
        // In production, you might want to verify S3/R2 file existence
        
        console.log(`Cache hit for URL: ${url}`)
        return entry
      }
      
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Cache screenshot result
  async set(
    url: string, 
    options: Record<string, any>, 
    entry: CacheEntry,
    cacheOptions: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      const cacheKey = this.generateCacheKey(url, options)
      const ttl = cacheOptions.ttl || this.defaultTTL
      
      const cacheData = {
        ...entry,
        createdAt: new Date().toISOString()
      }

      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheData))
      
      console.log(`Cached screenshot for URL: ${url} (TTL: ${ttl}s)`)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  // Invalidate specific cache entry
  async invalidate(url: string, options: Record<string, any> = {}): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      const cacheKey = this.generateCacheKey(url, options)
      const result = await this.redis.del(cacheKey)
      
      return result > 0
    } catch (error) {
      console.error('Cache invalidate error:', error)
      return false
    }
  }

  // Invalidate all cache entries for a URL (all variations)
  async invalidateUrl(url: string): Promise<number> {
    if (!this.enabled || !this.redis) {
      return 0
    }

    try {
      // Create a pattern to match all variations of this URL
      const urlHash = crypto.createHash('sha256').update(url).digest('hex').substring(0, 16)
      const pattern = `*${urlHash}*`
      
      const keys = await this.redis.keys(pattern)
      
      if (keys.length > 0) {
        const result = await this.redis.del(...keys)
        console.log(`Invalidated ${result} cache entries for URL: ${url}`)
        return result
      }
      
      return 0
    } catch (error) {
      console.error('Cache invalidateUrl error:', error)
      return 0
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    enabled: boolean
    totalKeys: number
    memoryUsage: string | null
    hitRate: number | null
  }> {
    if (!this.enabled || !this.redis) {
      return {
        enabled: false,
        totalKeys: 0,
        memoryUsage: null,
        hitRate: null
      }
    }

    try {
      const info = await this.redis.info('keyspace')
      const memory = await this.redis.info('memory')
      
      // Parse keyspace info to get total keys
      let totalKeys = 0
      const keyspaceMatch = info.match(/keys=(\d+)/)
      if (keyspaceMatch) {
        totalKeys = parseInt(keyspaceMatch[1])
      }

      // Parse memory usage
      let memoryUsage = null
      const memoryMatch = memory.match(/used_memory_human:([^\r\n]+)/)
      if (memoryMatch) {
        memoryUsage = memoryMatch[1].trim()
      }

      return {
        enabled: true,
        totalKeys,
        memoryUsage,
        hitRate: null // Would need to track hits/misses for this
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        enabled: true,
        totalKeys: 0,
        memoryUsage: null,
        hitRate: null
      }
    }
  }

  // Clear all cache entries
  async clear(): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      await this.redis.flushdb()
      console.log('Screenshot cache cleared')
      return true
    } catch (error) {
      console.error('Cache clear error:', error)
      return false
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      await this.redis.ping()
      return true
    } catch (error) {
      console.error('Cache health check failed:', error)
      return false
    }
  }

  // Cleanup expired entries (Redis handles this automatically, but useful for monitoring)
  async cleanup(): Promise<number> {
    if (!this.enabled || !this.redis) {
      return 0
    }

    try {
      // Redis automatically handles TTL expiration
      // This method could be used for custom cleanup logic if needed
      const info = await this.redis.info('keyspace')
      console.log('Cache cleanup completed. Current keyspace:', info)
      return 0
    } catch (error) {
      console.error('Cache cleanup error:', error)
      return 0
    }
  }

  // Close Redis connection
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

// Export singleton instance
export const screenshotCache = ScreenshotCache.getInstance()
export default screenshotCache