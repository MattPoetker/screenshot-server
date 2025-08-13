import { getScreenshotQueue } from './ScreenshotQueue'
import ScreenshotProcessor from './ScreenshotProcessor'
import { BrowserPool } from '../browser/BrowserPool'

export class QueueService {
  private static instance: QueueService
  private processor: ScreenshotProcessor
  private initialized = false

  private constructor() {
    this.processor = new ScreenshotProcessor()
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService()
    }
    return QueueService.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    console.log('Initializing Queue Service...')

    try {
      // Initialize browser pool first
      const browserPool = BrowserPool.getInstance()
      await browserPool.initialize()

      // Setup screenshot job processor
      const screenshotQueue = getScreenshotQueue()
      await screenshotQueue.process(async (job) => {
        return await this.processor.processScreenshotJob(job)
      })

      // Setup periodic cleanup
      this.setupCleanup()

      this.initialized = true
      console.log('✅ Queue Service initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize Queue Service:', error)
      throw error
    }
  }

  private setupCleanup(): void {
    // Clean old jobs every hour
    setInterval(async () => {
      try {
        const screenshotQueue = getScreenshotQueue()
        await screenshotQueue.cleanOldJobs()
        console.log('Queue cleanup completed')
      } catch (error) {
        console.error('Queue cleanup failed:', error)
      }
    }, 60 * 60 * 1000) // 1 hour
  }

  // Get comprehensive health status
  async getHealthStatus() {
    try {
      const screenshotQueue = getScreenshotQueue()
      const [queueHealthy, queueStats, processorHealthy, browserStats] = await Promise.all([
        screenshotQueue.healthCheck(),
        screenshotQueue.getStats(),
        this.processor.healthCheck(),
        BrowserPool.getInstance().getStats()
      ])

      return {
        healthy: queueHealthy && processorHealthy,
        queue: {
          healthy: queueHealthy,
          stats: queueStats
        },
        processor: {
          healthy: processorHealthy
        },
        browserPool: browserStats,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get queue service health status:', error)
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('Shutting down Queue Service...')
    
    try {
      const screenshotQueue = getScreenshotQueue()
      
      // Pause the queue to prevent new jobs
      await screenshotQueue.pause()
      
      // Wait for active jobs to complete (with timeout)
      const timeout = 30000 // 30 seconds
      const startTime = Date.now()
      
      while (Date.now() - startTime < timeout) {
        const stats = await screenshotQueue.getStats()
        if (stats.active === 0) {
          break
        }
        
        console.log(`Waiting for ${stats.active} active jobs to complete...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Close queue and browser pool
      await screenshotQueue.close()
      await BrowserPool.getInstance().forceCleanup()
      
      console.log('Queue Service shutdown complete')
    } catch (error) {
      console.error('Error during Queue Service shutdown:', error)
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

// Export singleton
export const queueService = QueueService.getInstance()
export default queueService