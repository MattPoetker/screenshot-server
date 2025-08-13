import Bull, { Queue, Job, JobOptions } from 'bull'
import Redis from 'ioredis'

// Screenshot job data interface
export interface ScreenshotJobData {
  id: string
  url: string
  options: {
    width?: number
    height?: number
    deviceType?: string
    format?: 'png' | 'jpg' | 'webp' | 'gif'
    fullPage?: boolean
    waitTime?: number
  }
  userId?: number
  apiKeyId?: number
  metadata?: Record<string, any>
}

// Screenshot job result interface
export interface ScreenshotJobResult {
  success: boolean
  filePath?: string
  fileName?: string
  fileSize?: number
  processingTime?: number
  error?: string
  metadata?: Record<string, any>
}

// Queue configuration
export interface QueueConfig {
  redis: {
    host: string
    port: number
    password?: string
    db?: number
  }
  concurrency: number
  removeOnComplete: number
  removeOnFail: number
  jobTimeout: number
  retryAttempts: number
  retryDelay: number
}

export class ScreenshotQueueManager {
  private static instance: ScreenshotQueueManager
  private queue: Queue<ScreenshotJobData> | null = null
  private config: QueueConfig
  private redis: Redis | null = null
  private initialized = false
  private initError: Error | null = null

  private constructor() {
    this.config = this.getConfig()
    // Don't initialize Redis connection during construction
    // Wait for explicit initialization
  }

  static getInstance(): ScreenshotQueueManager {
    if (!ScreenshotQueueManager.instance) {
      ScreenshotQueueManager.instance = new ScreenshotQueueManager()
    }
    return ScreenshotQueueManager.instance
  }

  // Lazy initialization - only connect when actually needed
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (this.initError) {
      throw this.initError
    }

    try {
      // Skip initialization during build process
      if (process.env.NEXT_PHASE === 'phase-production-build' || 
          process.env.NODE_ENV === 'production' && process.argv.includes('build')) {
        console.log('Skipping Redis initialization during build process')
        return
      }

      this.redis = this.createRedisConnection()
      this.queue = this.createQueue()
      this.setupEventHandlers()
      this.initialized = true
      
      console.log('Screenshot queue initialized successfully')
    } catch (error) {
      this.initError = error instanceof Error ? error : new Error('Unknown initialization error')
      console.warn('Failed to initialize screenshot queue:', this.initError.message)
      console.warn('Screenshot queue will operate in fallback mode')
      throw this.initError
    }
  }

  // Check if queue is available (graceful degradation)
  private async ensureInitialized(): Promise<boolean> {
    try {
      await this.initialize()
      return this.queue !== null && this.redis !== null
    } catch (error) {
      console.warn('Screenshot queue unavailable:', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  private getConfig(): QueueConfig {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    const redisConfig = this.parseRedisUrl(redisUrl)

    return {
      redis: redisConfig,
      concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
      removeOnComplete: parseInt(process.env.QUEUE_REMOVE_COMPLETE || '100'),
      removeOnFail: parseInt(process.env.QUEUE_REMOVE_FAIL || '50'),
      jobTimeout: parseInt(process.env.QUEUE_JOB_TIMEOUT || '60000'), // 1 minute
      retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000') // 5 seconds
    }
  }

  private parseRedisUrl(url: string) {
    const redisUrl = new URL(url)
    return {
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port) || 6379,
      password: redisUrl.password || undefined,
      db: parseInt(redisUrl.pathname.slice(1)) || 0
    }
  }

  private createRedisConnection(): Redis {
    return new Redis(this.config.redis)
  }

  private createQueue(): Queue<ScreenshotJobData> {
    const queue = new Bull<ScreenshotJobData>('screenshot-queue', {
      redis: this.config.redis,
      defaultJobOptions: {
        removeOnComplete: this.config.removeOnComplete,
        removeOnFail: this.config.removeOnFail,
        attempts: this.config.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: this.config.retryDelay
        }
      }
    })

    return queue
  }

  private setupEventHandlers(): void {
    if (!this.queue) {
      return
    }

    this.queue.on('error', (error) => {
      console.error('Screenshot queue error:', error)
    })

    this.queue.on('waiting', (jobId) => {
      console.log(`Screenshot job ${jobId} is waiting`)
    })

    this.queue.on('active', (job: Job<ScreenshotJobData>) => {
      console.log(`Screenshot job ${job.id} started processing`)
    })

    this.queue.on('completed', (job: Job<ScreenshotJobData>, result: ScreenshotJobResult) => {
      console.log(`Screenshot job ${job.id} completed in ${result.processingTime}ms`)
    })

    this.queue.on('failed', (job: Job<ScreenshotJobData>, error: Error) => {
      console.error(`Screenshot job ${job.id} failed:`, error.message)
    })

    this.queue.on('stalled', (job: Job<ScreenshotJobData>) => {
      console.warn(`Screenshot job ${job.id} stalled`)
    })
  }

  // Add screenshot job to queue
  async addJob(
    data: ScreenshotJobData, 
    options?: JobOptions
  ): Promise<Job<ScreenshotJobData> | null> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      console.warn('Queue unavailable - job will be processed synchronously')
      return null
    }

    const jobOptions: JobOptions = {
      ...options,
      timeout: this.config.jobTimeout,
      priority: this.calculatePriority(data)
    }

    return await this.queue.add(data, jobOptions)
  }

  // Add high priority screenshot job
  async addHighPriorityJob(
    data: ScreenshotJobData
  ): Promise<Job<ScreenshotJobData> | null> {
    return await this.addJob(data, {
      priority: 10,
      delay: 0
    })
  }

  // Add delayed screenshot job
  async addDelayedJob(
    data: ScreenshotJobData,
    delay: number
  ): Promise<Job<ScreenshotJobData> | null> {
    return await this.addJob(data, {
      delay
    })
  }

  // Process screenshot jobs
  async process(processor: (job: Job<ScreenshotJobData>) => Promise<ScreenshotJobResult>): Promise<void> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      console.warn('Queue unavailable - cannot process jobs')
      return
    }

    this.queue.process(this.config.concurrency, async (job: Job<ScreenshotJobData>) => {
      const startTime = Date.now()
      
      try {
        const result = await processor(job)
        
        return {
          ...result,
          processingTime: Date.now() - startTime
        }
      } catch (error) {
        console.error(`Job ${job.id} processing error:`, error)
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        }
      }
    })
  }

  // Get queue statistics
  async getStats() {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        available: false
      }
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed()
    ])

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
      available: true
    }
  }

  // Get job by ID
  async getJob(jobId: string): Promise<Job<ScreenshotJobData> | null> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      return null
    }
    return await this.queue.getJob(jobId)
  }

  // Remove job
  async removeJob(jobId: string): Promise<void> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      return
    }
    const job = await this.getJob(jobId)
    if (job) {
      await job.remove()
    }
  }

  // Clean old jobs
  async cleanOldJobs(): Promise<void> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      return
    }
    
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    
    await Promise.all([
      this.queue.clean(oneHourAgo, 'completed'),
      this.queue.clean(oneHourAgo, 'failed')
    ])
  }

  // Pause queue
  async pause(): Promise<void> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      return
    }
    await this.queue.pause()
  }

  // Resume queue
  async resume(): Promise<void> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.queue) {
      return
    }
    await this.queue.resume()
  }

  // Close queue and Redis connection
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close()
    }
    if (this.redis) {
      this.redis.disconnect()
    }
  }

  // Get Bull queue instance
  getQueue(): Queue<ScreenshotJobData> | null {
    return this.queue
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    const isAvailable = await this.ensureInitialized()
    if (!isAvailable || !this.redis) {
      return false
    }
    
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      console.error('Queue health check failed:', error)
      return false
    }
  }

  // Calculate job priority based on user type, API key tier, etc.
  private calculatePriority(data: ScreenshotJobData): number {
    // Higher numbers = higher priority
    let priority = 1 // Default priority
    
    // Premium users get higher priority
    if (data.metadata?.userTier === 'premium') {
      priority += 5
    }
    
    // Smaller screenshots get slight priority boost
    if (data.options.width && data.options.width <= 800) {
      priority += 1
    }
    
    // GIF generation gets lower priority (more resource intensive)
    if (data.options.format === 'gif') {
      priority -= 2
    }
    
    return Math.max(1, priority) // Ensure priority is at least 1
  }
}

// Export singleton getter instead of immediate instance
export const getScreenshotQueue = () => ScreenshotQueueManager.getInstance()
export default getScreenshotQueue