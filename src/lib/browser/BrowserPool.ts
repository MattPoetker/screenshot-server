import puppeteer, { Browser, Page } from 'puppeteer'

export interface BrowserPoolConfig {
  maxBrowsers: number
  browserMaxUses: number
  browserIdleTimeout: number
  memoryCheckInterval: number
  maxMemoryMB: number
  forceCleanupInterval: number
}

export interface BrowserMetrics {
  createdAt: number
  lastUsed: number
  useCount: number
  isHealthy: boolean
  pid?: number
  activePages: Set<Page>
}

export class BrowserWrapper {
  public browser: Browser
  public metrics: BrowserMetrics
  
  constructor(browser: Browser) {
    this.browser = browser
    this.metrics = {
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 0,
      isHealthy: true,
      pid: browser.process()?.pid,
      activePages: new Set()
    }
    
    if (this.metrics.pid) {
      BrowserPool.getInstance().trackProcess(this.metrics.pid)
    }
  }
  
  async getPage(): Promise<Page> {
    const page = await this.browser.newPage()
    this.metrics.activePages.add(page)
    return page
  }
  
  async closePage(page: Page): Promise<void> {
    if (this.metrics.activePages.has(page)) {
      try {
        await page.close()
        this.metrics.activePages.delete(page)
      } catch (error) {
        console.warn('Error closing page:', error)
        this.metrics.activePages.delete(page)
      }
    }
  }
  
  markUsed(): void {
    this.metrics.lastUsed = Date.now()
    this.metrics.useCount++
  }
  
  isExpired(config: BrowserPoolConfig): boolean {
    const now = Date.now()
    return (
      this.metrics.useCount >= config.browserMaxUses ||
      (now - this.metrics.lastUsed) > config.browserIdleTimeout ||
      !this.metrics.isHealthy
    )
  }
  
  async close(): Promise<void> {
    try {
      // Close all active pages first
      const pagePromises = Array.from(this.metrics.activePages).map(page => 
        page.close().catch(err => console.warn('Page close error:', err))
      )
      await Promise.allSettled(pagePromises)
      this.metrics.activePages.clear()
      
      // Close browser
      await this.browser.close()
      
      // Remove from tracking
      if (this.metrics.pid) {
        BrowserPool.getInstance().untrackProcess(this.metrics.pid)
      }
    } catch (error) {
      console.warn('Browser close error:', error)
      // Force kill if normal close fails
      if (this.metrics.pid) {
        try {
          process.kill(this.metrics.pid, 'SIGKILL')
          BrowserPool.getInstance().untrackProcess(this.metrics.pid)
        } catch (killError) {
          console.warn('Failed to kill browser process:', killError)
        }
      }
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      if (this.isExpired(BrowserPool.getInstance().config)) {
        return false
      }
      
      // Try to get browser version (quick health check)
      await this.browser.version()
      return true
    } catch (error) {
      this.metrics.isHealthy = false
      return false
    }
  }
}

export class BrowserPool {
  private static instance: BrowserPool
  private pool: BrowserWrapper[] = []
  private activeBrowsers = new Map<Browser, BrowserWrapper>()
  private browserProcesses = new Set<number>()
  private initializingBrowser: Promise<BrowserWrapper> | null = null
  private memoryMonitorInterval?: NodeJS.Timeout
  private cleanupInterval?: NodeJS.Timeout
  
  public readonly config: BrowserPoolConfig = {
    maxBrowsers: parseInt(process.env.MAX_BROWSERS || '10'), // Increased for production
    browserMaxUses: parseInt(process.env.BROWSER_MAX_USES || '100'), // Increased capacity
    browserIdleTimeout: parseInt(process.env.BROWSER_IDLE_TIMEOUT || '300000'), // 5 minutes
    memoryCheckInterval: parseInt(process.env.MEMORY_CHECK_INTERVAL || '30000'), // 30 seconds
    maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB || '2048'), // Increased for production
    forceCleanupInterval: parseInt(process.env.FORCE_CLEANUP_INTERVAL || '600000') // 10 minutes
  }
  
  private constructor() {
    this.startMonitoring()
    this.setupProcessCleanup()
  }
  
  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool()
    }
    return BrowserPool.instance
  }
  
  async initialize(): Promise<void> {
    console.log('Initializing browser pool...')
    const promises = []
    
    for (let i = 0; i < this.config.maxBrowsers; i++) {
      try {
        promises.push(this.createBrowserWrapper())
      } catch (error) {
        console.error('Failed to initialize browser:', error)
      }
    }
    
    const results = await Promise.allSettled(promises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    console.log(`Browser pool initialized with ${successful}/${this.config.maxBrowsers} browsers`)
  }
  
  private async createBrowser(): Promise<Browser> {
    return await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      headless: 'new',  // Use new headless mode
      timeout: 30000,
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    })
  }
  
  private async createBrowserWrapper(): Promise<BrowserWrapper> {
    try {
      const browser = await this.createBrowser()
      const wrapper = new BrowserWrapper(browser)
      this.activeBrowsers.set(browser, wrapper)
      this.pool.push(wrapper)
      return wrapper
    } catch (error) {
      console.error('Failed to create browser:', error)
      throw error
    }
  }
  
  async getBrowser(): Promise<BrowserWrapper> {
    // Clean expired browsers first
    await this.cleanExpiredBrowsers()
    
    // Try to get a healthy browser from pool
    while (this.pool.length > 0) {
      const wrapper = this.pool.pop()!
      
      // Health check
      if (await wrapper.healthCheck()) {
        wrapper.markUsed()
        return wrapper
      } else {
        // Remove unhealthy browser
        this.activeBrowsers.delete(wrapper.browser)
        await wrapper.close()
      }
    }
    
    // No healthy browsers available, create new one
    if (!this.initializingBrowser) {
      this.initializingBrowser = this.createBrowserWrapper()
    }
    
    const wrapper = await this.initializingBrowser
    this.initializingBrowser = null
    wrapper.markUsed()
    return wrapper
  }
  
  async returnBrowser(wrapper: BrowserWrapper): Promise<void> {
    if (!wrapper || !this.activeBrowsers.has(wrapper.browser)) {
      return // Already cleaned up
    }
    
    try {
      // Check if browser is still healthy and not expired
      if (wrapper.isExpired(this.config) || !(await wrapper.healthCheck())) {
        this.activeBrowsers.delete(wrapper.browser)
        await wrapper.close()
        return
      }
      
      // Return to pool if there's space
      if (this.pool.length < this.config.maxBrowsers) {
        this.pool.push(wrapper)
      } else {
        // Pool is full, close this browser
        this.activeBrowsers.delete(wrapper.browser)
        await wrapper.close()
      }
    } catch (error) {
      console.warn('Error returning browser to pool:', error)
      this.activeBrowsers.delete(wrapper.browser)
      await wrapper.close()
    }
  }
  
  private async cleanExpiredBrowsers(): Promise<void> {
    const validBrowsers: BrowserWrapper[] = []
    
    for (const wrapper of this.pool) {
      if (wrapper.isExpired(this.config) || !(await wrapper.healthCheck())) {
        this.activeBrowsers.delete(wrapper.browser)
        await wrapper.close()
      } else {
        validBrowsers.push(wrapper)
      }
    }
    
    this.pool = validBrowsers
  }
  
  private startMonitoring(): void {
    this.memoryMonitorInterval = setInterval(() => {
      this.monitorMemory()
    }, this.config.memoryCheckInterval)
    
    this.cleanupInterval = setInterval(() => {
      this.forceCleanup()
    }, this.config.forceCleanupInterval)
  }
  
  private async monitorMemory(): Promise<void> {
    try {
      const memUsage = process.memoryUsage()
      const memMB = memUsage.heapUsed / 1024 / 1024
      
      console.log(`Memory usage: ${memMB.toFixed(2)}MB, Active browsers: ${this.activeBrowsers.size}`)
      
      // If memory is high, aggressively clean up
      if (memMB > this.config.maxMemoryMB * 0.8) {
        console.warn('High memory usage detected, forcing cleanup')
        await this.forceCleanup()
      }
    } catch (error) {
      console.error('Memory monitoring error:', error)
    }
  }
  
  async forceCleanup(): Promise<void> {
    console.log('Performing force cleanup of all browsers')
    
    // Clear the pool
    this.pool = []
    
    // Close all active browsers
    const closePromises = Array.from(this.activeBrowsers.values()).map(wrapper => wrapper.close())
    await Promise.allSettled(closePromises)
    
    this.activeBrowsers.clear()
    
    // Kill any remaining browser processes
    for (const pid of this.browserProcesses) {
      try {
        process.kill(pid, 'SIGKILL')
      } catch (error) {
        // Process already dead, ignore
      }
    }
    this.browserProcesses.clear()
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }
  
  trackProcess(pid: number): void {
    this.browserProcesses.add(pid)
  }
  
  untrackProcess(pid: number): void {
    this.browserProcesses.delete(pid)
  }
  
  private setupProcessCleanup(): void {
    const cleanup = async () => {
      console.log('Shutting down browser pool...')
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval)
      }
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
      }
      await this.forceCleanup()
    }
    
    process.on('exit', cleanup)
    process.on('SIGINT', async () => {
      await cleanup()
      process.exit(0)
    })
    process.on('SIGTERM', async () => {
      await cleanup()
      process.exit(0)
    })
  }
  
  getStats() {
    return {
      poolSize: this.pool.length,
      activeBrowsers: this.activeBrowsers.size,
      trackedProcesses: this.browserProcesses.size,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    }
  }
}