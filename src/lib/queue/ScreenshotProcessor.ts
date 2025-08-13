import { Job } from 'bull'
import { BrowserPool } from '../browser/BrowserPool'
import { StorageFactory } from '../storage/StorageFactory'
import { ScreenshotJobData, ScreenshotJobResult } from './ScreenshotQueue'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import universalDb from '../db/universal'

export class ScreenshotProcessor {
  private browserPool: BrowserPool
  private storageService: any

  constructor() {
    this.browserPool = BrowserPool.getInstance()
    this.storageService = StorageFactory.getInstance()
  }

  // Main processing function for screenshot jobs
  async processScreenshotJob(job: Job<ScreenshotJobData>): Promise<ScreenshotJobResult> {
    const startTime = Date.now()
    const { url, options, userId, apiKeyId, metadata } = job.data
    
    console.log(`Processing screenshot job ${job.id} for URL: ${url}`)
    
    let browserWrapper = null
    
    try {
      // Update job progress
      await job.progress(10)
      
      // Get browser from pool
      browserWrapper = await this.browserPool.getBrowser()
      await job.progress(20)
      
      // Create new page
      const page = await browserWrapper.getPage()
      await job.progress(30)
      
      try {
        // Configure page
        await this.configurePage(page, options)
        await job.progress(40)
        
        // Navigate to URL
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        })
        await job.progress(60)
        
        // Wait additional time if specified
        if (options.waitTime && options.waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, options.waitTime))
        }
        await job.progress(70)
        
        // Take screenshot
        const screenshotBuffer = await this.takeScreenshot(page, options)
        await job.progress(80)
        
        // Generate filename and save
        const fileName = this.generateFileName(url, options)
        const filePath = await this.storageService.save(screenshotBuffer, fileName)
        await job.progress(90)
        
        // Save to database
        const screenshotRecord = await this.saveToDatabase({
          userId,
          apiKeyId,
          url,
          fileName,
          filePath,
          fileSize: screenshotBuffer.length,
          ...options,
          metadata
        })
        
        await job.progress(100)
        
        const processingTime = Date.now() - startTime
        console.log(`Screenshot job ${job.id} completed in ${processingTime}ms`)
        
        return {
          success: true,
          filePath,
          fileName,
          fileSize: screenshotBuffer.length,
          processingTime,
          metadata: {
            screenshotId: screenshotRecord?.id,
            ...metadata
          }
        }
        
      } finally {
        // Always close the page
        await browserWrapper.closePage(page)
      }
      
    } catch (error) {
      console.error(`Screenshot job ${job.id} failed:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
      
    } finally {
      // Return browser to pool
      if (browserWrapper) {
        await this.browserPool.returnBrowser(browserWrapper)
      }
    }
  }
  
  // Configure page settings
  private async configurePage(page: any, options: ScreenshotJobData['options']): Promise<void> {
    // Set viewport
    await page.setViewport({
      width: options.width || 1920,
      height: options.height || 1080,
      deviceScaleFactor: 1,
    })
    
    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 NiceShot-Bot'
    )
    
    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true)
    
    page.on('request', (request: any) => {
      const resourceType = request.resourceType()
      
      // Block ads, analytics, and social media trackers
      if (['stylesheet', 'font', 'media'].includes(resourceType)) {
        // Allow CSS and fonts for proper rendering
        request.continue()
      } else if (['script'].includes(resourceType)) {
        // Block scripts that might contain trackers
        const url = request.url()
        if (this.isBlockedScript(url)) {
          request.abort()
        } else {
          request.continue()
        }
      } else {
        request.continue()
      }
    })
    
    // Set timeouts
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(30000)
  }
  
  // Check if script should be blocked
  private isBlockedScript(url: string): boolean {
    const blockedDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.net',
      'doubleclick.net',
      'googlesyndication.com',
      'scorecardresearch.com',
      'quantserve.com'
    ]
    
    return blockedDomains.some(domain => url.includes(domain))
  }
  
  // Take screenshot with specified options
  private async takeScreenshot(page: any, options: ScreenshotJobData['options']): Promise<Buffer> {
    const screenshotOptions: any = {
      type: options.format || 'png',
      fullPage: options.fullPage || false,
      quality: options.format === 'jpg' ? 90 : undefined
    }
    
    // Handle different formats
    if (options.format === 'gif') {
      // For GIF, we need to use the GIF service
      // This is a placeholder - would need to integrate with GifGenerationService
      screenshotOptions.type = 'png' // Fallback to PNG for now
    }
    
    return await page.screenshot(screenshotOptions)
  }
  
  // Generate unique filename
  private generateFileName(url: string, options: ScreenshotJobData['options']): string {
    const timestamp = Date.now()
    const randomId = uuidv4().split('-')[0]
    const format = options.format || 'png'
    
    // Extract domain for filename
    let domain = 'screenshot'
    try {
      const urlObj = new URL(url)
      domain = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '-')
    } catch (error) {
      // Use default if URL parsing fails
    }
    
    return `${domain}-${timestamp}-${randomId}.${format}`
  }
  
  // Save screenshot metadata to database
  private async saveToDatabase(data: {
    userId?: number
    apiKeyId?: number
    url: string
    fileName: string
    filePath: string
    fileSize: number
    width?: number
    height?: number
    deviceType?: string
    format?: string
    fullPage?: boolean
    waitTime?: number
    metadata?: Record<string, any>
  }) {
    try {
      const result = await universalDb.run(
        universalDb.queryBuilder.buildQuery(`
          INSERT INTO screenshots (
            user_id, api_key_id, url, filename, file_path, file_size,
            width, height, device_type, format, full_page, wait_time, metadata,
            storage_provider, storage_url, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, true),
        [
          data.userId || null,
          data.apiKeyId || null,
          data.url,
          data.fileName,
          data.filePath,
          data.fileSize,
          data.width || null,
          data.height || null,
          data.deviceType || 'desktop',
          data.format || 'png',
          universalDb.queryBuilder.convertBoolean(data.fullPage || false),
          data.waitTime || 0,
          JSON.stringify(data.metadata || {}),
          process.env.STORAGE_PROVIDER || 'local',
          data.filePath,
          universalDb.queryBuilder.getCurrentTimestamp()
        ]
      )
      
      return { id: result.id }
    } catch (error) {
      console.error('Failed to save screenshot to database:', error)
      return null
    }
  }
  
  // Health check for processor
  async healthCheck(): Promise<boolean> {
    try {
      const stats = this.browserPool.getStats()
      return stats.activeBrowsers >= 0 // Basic check that pool is accessible
    } catch (error) {
      console.error('Screenshot processor health check failed:', error)
      return false
    }
  }
}

export default ScreenshotProcessor