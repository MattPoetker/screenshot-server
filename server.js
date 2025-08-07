const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { spawn } = require('child_process');
const GifGenerationService = require('./gif-service');
const app = express();
const port = 3000;

const AUTH_TOKEN = '7facc2116210f6bfd3153ffe2fed2e3d0b73ae22039bf49600da41cc1a70b15da7d9f709';
const IMAGES_DIR = '/var/www/screenshots';
const MAX_CONCURRENT_BROWSERS = 3; // Reduced for better memory management
const BROWSER_MAX_USES = 50; // Recycle browsers after N uses
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MEMORY_CHECK_INTERVAL = 30 * 1000; // 30 seconds
const MAX_MEMORY_MB = 1024; // Maximum memory per browser process
const FORCE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Enhanced browser pool with metadata
let browserPool = [];
let initializingBrowser = null;
let activeBrowsers = new Map(); // Track all active browsers
let browserProcesses = new Set(); // Track browser PIDs for cleanup
let memoryMonitorInterval;
let cleanupInterval;

// Enhanced browser metadata tracking
class BrowserWrapper {
    constructor(browser) {
        this.browser = browser;
        this.createdAt = Date.now();
        this.lastUsed = Date.now();
        this.useCount = 0;
        this.isHealthy = true;
        this.pid = browser.process()?.pid;
        this.activePages = new Set();
        
        if (this.pid) {
            browserProcesses.add(this.pid);
        }
    }
    
    async getPage() {
        const page = await this.browser.newPage();
        this.activePages.add(page);
        return page;
    }
    
    async closePage(page) {
        if (this.activePages.has(page)) {
            try {
                await page.close();
                this.activePages.delete(page);
            } catch (error) {
                console.warn('Error closing page:', error.message);
                this.activePages.delete(page);
            }
        }
    }
    
    markUsed() {
        this.lastUsed = Date.now();
        this.useCount++;
    }
    
    isExpired() {
        const now = Date.now();
        return (
            this.useCount >= BROWSER_MAX_USES ||
            (now - this.lastUsed) > BROWSER_IDLE_TIMEOUT ||
            !this.isHealthy
        );
    }
    
    async close() {
        try {
            // Close all active pages first
            const pagePromises = Array.from(this.activePages).map(page => 
                page.close().catch(err => console.warn('Page close error:', err.message))
            );
            await Promise.allSettled(pagePromises);
            this.activePages.clear();
            
            // Close browser
            await this.browser.close();
            
            // Remove from tracking
            if (this.pid) {
                browserProcesses.delete(this.pid);
            }
        } catch (error) {
            console.warn('Browser close error:', error.message);
            // Force kill if normal close fails
            if (this.pid) {
                try {
                    process.kill(this.pid, 'SIGKILL');
                    browserProcesses.delete(this.pid);
                } catch (killError) {
                    console.warn('Failed to kill browser process:', killError.message);
                }
            }
        }
    }
}

// Initialize enhanced browser pool
async function initializeBrowserPool() {
    for (let i = 0; i < MAX_CONCURRENT_BROWSERS; i++) {
        try {
            const browser = await createBrowser();
            const wrapper = new BrowserWrapper(browser);
            browserPool.push(wrapper);
            activeBrowsers.set(browser, wrapper);
        } catch (error) {
            console.error('Failed to initialize browser:', error.message);
        }
    }
}

// Create browser with optimized settings
async function createBrowser() {
    return await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images', // Disable image loading for performance
            '--disable-javascript', // Disable JS for basic screenshots (can be overridden)
            '--memory-pressure-off',
            `--max-old-space-size=${MAX_MEMORY_MB}`,
            '--single-process', // Helps with cleanup
            '--no-zygote'
        ],
        headless: 'new',
        timeout: 30000
    });
}

// Get available browser from pool with health checks
async function getBrowser() {
    // Clean expired browsers first
    await cleanExpiredBrowsers();
    
    // Try to get a healthy browser from pool
    while (browserPool.length > 0) {
        const wrapper = browserPool.pop();
        
        // Health check
        if (await isHealthy(wrapper)) {
            wrapper.markUsed();
            return wrapper;
        } else {
            // Remove unhealthy browser
            activeBrowsers.delete(wrapper.browser);
            await wrapper.close();
        }
    }
    
    // No healthy browsers available, create new one
    if (!initializingBrowser) {
        initializingBrowser = createNewBrowserWrapper();
    }
    
    const wrapper = await initializingBrowser;
    initializingBrowser = null;
    wrapper.markUsed();
    return wrapper;
}

// Create new browser wrapper
async function createNewBrowserWrapper() {
    try {
        const browser = await createBrowser();
        const wrapper = new BrowserWrapper(browser);
        activeBrowsers.set(browser, wrapper);
        return wrapper;
    } catch (error) {
        console.error('Failed to create browser:', error.message);
        throw error;
    }
}

// Health check for browser
async function isHealthy(wrapper) {
    try {
        if (wrapper.isExpired()) {
            return false;
        }
        
        // Try to get browser version (quick health check)
        await wrapper.browser.version();
        return true;
    } catch (error) {
        wrapper.isHealthy = false;
        return false;
    }
}

// Return browser to pool with enhanced management
async function returnBrowser(wrapper) {
    if (!wrapper || !activeBrowsers.has(wrapper.browser)) {
        return; // Already cleaned up
    }
    
    try {
        // Check if browser is still healthy and not expired
        if (wrapper.isExpired() || !(await isHealthy(wrapper))) {
            activeBrowsers.delete(wrapper.browser);
            await wrapper.close();
            return;
        }
        
        // Return to pool if there's space
        if (browserPool.length < MAX_CONCURRENT_BROWSERS) {
            browserPool.push(wrapper);
        } else {
            // Pool is full, close this browser
            activeBrowsers.delete(wrapper.browser);
            await wrapper.close();
        }
    } catch (error) {
        console.warn('Error returning browser to pool:', error.message);
        activeBrowsers.delete(wrapper.browser);
        await wrapper.close();
    }
}

// Clean expired browsers from pool
async function cleanExpiredBrowsers() {
    const validBrowsers = [];
    
    for (const wrapper of browserPool) {
        if (wrapper.isExpired() || !(await isHealthy(wrapper))) {
            activeBrowsers.delete(wrapper.browser);
            await wrapper.close();
        } else {
            validBrowsers.push(wrapper);
        }
    }
    
    browserPool = validBrowsers;
}

// Memory monitoring
async function monitorMemory() {
    try {
        const memUsage = process.memoryUsage();
        const memMB = memUsage.heapUsed / 1024 / 1024;
        
        console.log(`Memory usage: ${memMB.toFixed(2)}MB, Active browsers: ${activeBrowsers.size}`);
        
        // If memory is high, aggressively clean up
        if (memMB > MAX_MEMORY_MB * 0.8) {
            console.warn('High memory usage detected, forcing cleanup');
            await forceCleanup();
        }
    } catch (error) {
        console.error('Memory monitoring error:', error.message);
    }
}

// Force cleanup of all browsers
async function forceCleanup() {
    console.log('Performing force cleanup of all browsers');
    
    // Clear the pool
    browserPool = [];
    
    // Close all active browsers
    const closePromises = Array.from(activeBrowsers.values()).map(wrapper => wrapper.close());
    await Promise.allSettled(closePromises);
    
    activeBrowsers.clear();
    
    // Kill any remaining browser processes
    for (const pid of browserProcesses) {
        try {
            process.kill(pid, 'SIGKILL');
        } catch (error) {
            // Process already dead, ignore
        }
    }
    browserProcesses.clear();
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
}

// Process isolation for critical requests
async function takeScreenshotInIsolation(config) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error('Screenshot process timeout'));
        }, config.timeout + 10000);
        
        const child = spawn('node', ['-e', `
            const puppeteer = require('puppeteer');
            const fs = require('fs');
            
            (async () => {
                let browser;
                try {
                    browser = await puppeteer.launch({
                        args: ['--no-sandbox', '--disable-setuid-sandbox'],
                        headless: 'new'
                    });
                    
                    const page = await browser.newPage();
                    await page.setViewport({
                        width: ${config.width},
                        height: ${config.height}
                    });
                    
                    await page.goto('${config.url}', { waitUntil: 'load' });
                    const screenshot = await page.screenshot({ encoding: 'base64' });
                    
                    console.log(JSON.stringify({ success: true, screenshot }));
                } catch (error) {
                    console.log(JSON.stringify({ success: false, error: error.message }));
                } finally {
                    if (browser) await browser.close();
                }
            })();
        `]);
        
        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.on('exit', () => {
            clearTimeout(timeout);
            try {
                const result = JSON.parse(output);
                if (result.success) {
                    resolve(Buffer.from(result.screenshot, 'base64'));
                } else {
                    reject(new Error(result.error));
                }
            } catch (error) {
                reject(new Error('Failed to parse isolation result'));
            }
        });
    });
}

// Server start time for uptime calculation
const startTime = Date.now();

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401); // No token provided
  if (token !== AUTH_TOKEN) {
    return res.sendStatus(403); // Invalid token
  }
  next(); // Token is valid, proceed
}

app.use(bodyParser.json());

// Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Swagger UI setup
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Screenshot API Documentation',
  customfavIcon: null,
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true
  }
};

// Serve API documentation at /docs
app.use('/docs', swaggerUi.serve);
app.get('/docs', swaggerUi.setup(swaggerDocument, swaggerOptions));

// Also serve the raw OpenAPI spec at /openapi.yaml
app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/x-yaml');
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
});
app.use(limiter);

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const health = {
      status: 'up',
      uptime: Math.floor((Date.now() - startTime) / 1000) + 's',
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
      },
      browsers: {
        poolSize: browserPool.length,
        activeCount: activeBrowsers.size,
        processes: browserProcesses.size
      }
    };
    
    // Check if screenshots directory is writable
    try {
      fs.accessSync(IMAGES_DIR, fs.constants.W_OK);
      health.storage = 'accessible';
    } catch (error) {
      health.storage = 'inaccessible';
      health.status = 'warning';
    }
    
    // Check browser pool health
    try {
      await cleanExpiredBrowsers();
      if (browserPool.length > 0 || activeBrowsers.size > 0) {
        health.browser = 'operational';
      } else {
        // Try to create a test browser
        const wrapper = await getBrowser();
        await returnBrowser(wrapper);
        health.browser = 'operational';
      }
    } catch (error) {
      health.browser = 'failed';
      health.status = 'critical';
      health.error = error.message;
    }
    
    // Memory warning
    if (memUsage.heapUsed / 1024 / 1024 > MAX_MEMORY_MB * 0.7) {
      health.status = health.status === 'up' ? 'warning' : health.status;
      health.memoryWarning = 'High memory usage detected';
    }
    
    const statusCode = health.status === 'up' ? 200 : 
                       health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'down',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Force cleanup endpoint (for emergency use)
app.post('/admin/cleanup', verifyToken, async (req, res) => {
  try {
    await forceCleanup();
    res.json({ success: true, message: 'Force cleanup completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device presets configuration
const DEVICE_PRESETS = {
  mobile: {
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
  },
  tablet: {
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
  },
  desktop: {
    width: 1366,
    height: 768,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  iphone: {
    width: 375,
    height: 812,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
  },
  ipad: {
    width: 820,
    height: 1180,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
  }
};

// Validate and apply parameter defaults
function validateAndApplyDefaults(params) {
  const defaults = {
    width: 1366,
    height: 768,
    devicePixelRatio: 1,
    format: 'png',
    quality: 90,
    fullPage: false,
    omitBackground: false,
    waitFor: 'load',
    delay: 0,
    preWaitDelay: 0,
    postNavigationDelay: 1000,
    waitForImages: true,
    imageTimeout: 5000,
    timeout: 30000,
    hideElements: [],
    blockResources: [],
    cookies: [],
    headers: {},
    // GIF-specific parameters
    captureType: 'screenshot',
    scrollSpeed: 200,
    frameDuration: 100,
    maxScrollHeight: 5000,
    scrollPause: 500,
    gifFrameRate: 10,
    highlightInteractions: false,
    scrollStep: 100,
    repeat: 0
  };

  // Apply device preset if specified
  if (params.devicePreset && DEVICE_PRESETS[params.devicePreset]) {
    const preset = DEVICE_PRESETS[params.devicePreset];
    Object.assign(defaults, preset);
  }

  // Override with user-provided parameters
  const config = { ...defaults, ...params };

  // Validation
  if (!config.url) {
    throw new Error('URL is required');
  }
  
  if (!['screenshot', 'scrolling-gif'].includes(config.captureType)) {
    throw new Error('captureType must be "screenshot" or "scrolling-gif"');
  }
  
  if (config.captureType === 'scrolling-gif' && !['gif'].includes(config.format)) {
    config.format = 'gif'; // Force GIF format for scrolling captures
  }
  
  if (config.captureType === 'screenshot' && !['png', 'jpeg', 'webp'].includes(config.format)) {
    throw new Error('Format must be png, jpeg, or webp for screenshots');
  }
  
  if (config.quality < 0 || config.quality > 100) {
    throw new Error('Quality must be between 0 and 100');
  }
  
  if (config.width < 1 || config.width > 4000) {
    throw new Error('Width must be between 1 and 4000 pixels');
  }
  
  if (config.height < 1 || config.height > 4000) {
    throw new Error('Height must be between 1 and 4000 pixels');
  }

  // Wait parameter validation
  if (config.delay < 0 || config.delay > 60000) {
    throw new Error('delay must be between 0 and 60000 milliseconds');
  }
  
  if (config.preWaitDelay < 0 || config.preWaitDelay > 60000) {
    throw new Error('preWaitDelay must be between 0 and 60000 milliseconds');
  }
  
  if (config.postNavigationDelay < 0 || config.postNavigationDelay > 60000) {
    throw new Error('postNavigationDelay must be between 0 and 60000 milliseconds');
  }
  
  if (config.imageTimeout < 1000 || config.imageTimeout > 60000) {
    throw new Error('imageTimeout must be between 1000 and 60000 milliseconds');
  }

  // GIF-specific validation
  if (config.captureType === 'scrolling-gif') {
    if (config.scrollSpeed < 50 || config.scrollSpeed > 2000) {
      throw new Error('scrollSpeed must be between 50 and 2000 pixels per second');
    }
    
    if (config.frameDuration < 50 || config.frameDuration > 2000) {
      throw new Error('frameDuration must be between 50 and 2000 milliseconds');
    }
    
    if (config.maxScrollHeight < 100 || config.maxScrollHeight > 20000) {
      throw new Error('maxScrollHeight must be between 100 and 20000 pixels');
    }
    
    if (config.gifFrameRate < 1 || config.gifFrameRate > 30) {
      throw new Error('gifFrameRate must be between 1 and 30 FPS');
    }
  }

  return config;
}

// Wait for images to load
async function waitForImages(page, timeout = 5000) {
  try {
    await page.evaluate((timeout) => {
      return new Promise((resolve) => {
        const images = Array.from(document.images);
        let loadedCount = 0;
        let totalImages = images.length;
        
        if (totalImages === 0) {
          resolve();
          return;
        }
        
        const timeoutId = setTimeout(() => {
          resolve(); // Resolve even if not all images loaded
        }, timeout);
        
        const checkComplete = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            clearTimeout(timeoutId);
            resolve();
          }
        };
        
        images.forEach((img) => {
          if (img.complete && img.naturalHeight !== 0) {
            checkComplete();
          } else {
            img.addEventListener('load', checkComplete);
            img.addEventListener('error', checkComplete); // Count errors as "loaded"
          }
        });
      });
    }, timeout);
  } catch (error) {
    console.warn('Error waiting for images:', error.message);
  }
}

app.post('/screenshot', verifyToken, async (req, res) => {
  let browserWrapper;
  let page;
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] Screenshot request started`);
  
  try {
    // Validate and apply defaults to parameters
    const config = validateAndApplyDefaults(req.body);
    
    // Use process isolation for high-risk requests
    if (config.isolate || activeBrowsers.size > MAX_CONCURRENT_BROWSERS * 2) {
      console.log(`[${requestId}] Using process isolation`);
      const screenshot = await takeScreenshotInIsolation(config);
      
      const timestamp = Date.now();
      const extension = config.format === 'jpeg' ? 'jpg' : config.format;
      const imageName = `thumbnail-${timestamp}.${extension}`;
      const imagePath = path.join(IMAGES_DIR, imageName);
      
      fs.writeFileSync(imagePath, screenshot);
      const stats = fs.statSync(imagePath);
      
      return res.status(200).json({
        image: imageName,
        url: `https://images.sitelaunch.io/images/${imageName}`,
        metadata: {
          width: config.width,
          height: config.height,
          format: config.format,
          size: stats.size,
          captureTime: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          method: 'isolation'
        }
      });
    }
    
    // Get browser from pool with timeout
    const browserTimeout = setTimeout(() => {
      throw new Error('Browser acquisition timeout');
    }, 30000);
    
    browserWrapper = await getBrowser();
    clearTimeout(browserTimeout);
    
    console.log(`[${requestId}] Got browser (PID: ${browserWrapper.pid})`);
    
    // Create page with enhanced error handling
    page = await browserWrapper.getPage();
    
    // Add page timeout for all operations
    const pageTimeout = setTimeout(async () => {
      console.warn(`[${requestId}] Page timeout, forcing cleanup`);
      if (page) {
        try {
          await browserWrapper.closePage(page);
        } catch (e) { /* ignore */ }
      }
      if (browserWrapper) {
        browserWrapper.isHealthy = false;
      }
    }, config.timeout + 10000);
    
    // Set navigation timeout
    await page.setDefaultNavigationTimeout(config.timeout);
    
    // Set custom headers if provided
    if (Object.keys(config.headers).length > 0) {
      await page.setExtraHTTPHeaders(config.headers);
    }
    
    // Set cookies if provided
    if (config.cookies.length > 0) {
      await page.setCookie(...config.cookies);
    }
    
    // Set user agent if provided
    if (config.userAgent) {
      await page.setUserAgent(config.userAgent);
    }
    
    // Block resources if specified or use default optimization
    const resourcesToBlock = config.blockResources.length > 0 ? config.blockResources : [];
    if (resourcesToBlock.length > 0) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (resourcesToBlock.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    
    // Set viewport
    await page.setViewport({
      width: config.width,
      height: config.height,
      deviceScaleFactor: config.devicePixelRatio
    });
    
    // Pre-navigation delay (if needed for page setup)
    if (config.preWaitDelay > 0) {
      console.log(`[${requestId}] Pre-navigation delay: ${config.preWaitDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, config.preWaitDelay));
    }
    
    // Navigate to URL with timeout
    const waitForCondition = ['load', 'networkidle0', 'networkidle2'].includes(config.waitFor) 
      ? config.waitFor 
      : 'load';
    
    await page.goto(config.url, { 
      waitUntil: waitForCondition,
      timeout: config.timeout 
    });
    
    // Post-navigation delay (allows initial page resources to load)
    if (config.postNavigationDelay > 0) {
      console.log(`[${requestId}] Waiting ${config.postNavigationDelay}ms after navigation`);
      await new Promise(resolve => setTimeout(resolve, config.postNavigationDelay));
    }
    
    // Wait for specific element if selector provided and not a standard wait condition
    if (config.waitFor && !['load', 'networkidle0', 'networkidle2'].includes(config.waitFor)) {
      await page.waitForSelector(config.waitFor, { timeout: config.timeout });
    }
    
    // Wait for images to load if requested
    if (config.waitForImages) {
      console.log(`[${requestId}] Waiting for images to load (timeout: ${config.imageTimeout}ms)`);
      await waitForImages(page, config.imageTimeout);
    }
    
    // Hide elements if specified
    if (config.hideElements.length > 0) {
      await page.evaluate((selectors) => {
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.style.display = 'none');
        });
      }, config.hideElements);
    }
    
    // Additional delay if specified
    if (config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
    
    // Handle GIF generation if requested
    if (config.captureType === 'scrolling-gif') {
      console.log(`[${requestId}] Starting GIF generation`);
      
      const gifService = new GifGenerationService();
      const gifResult = await gifService.generateScrollingGif(page, config);
      
      clearTimeout(pageTimeout);
      console.log(`[${requestId}] GIF generated successfully`);
      
      // Close page before returning browser to pool
      await browserWrapper.closePage(page);
      page = null;
      
      // Generate filename based on actual output format
      const timestamp = Date.now();
      const actualFormat = gifResult.buffer.length > 0 && gifResult.buffer[0] === 0x47 && gifResult.buffer[1] === 0x49 ? 'gif' : 'png';
      const imageName = actualFormat === 'gif' ? `scrolling-${timestamp}.gif` : `scrolling-fallback-${timestamp}.png`;
      const imagePath = path.join(IMAGES_DIR, imageName);
      
      // Save GIF/PNG
      fs.writeFileSync(imagePath, gifResult.buffer);
      
      console.log(`[${requestId}] ${actualFormat.toUpperCase()} saved: ${imageName}`);
      
      // Respond with success
      return res.status(200).json({
        image: imageName,
        url: `https://images.sitelaunch.io/images/${imageName}`,
        metadata: {
          width: config.width,
          height: config.height,
          format: actualFormat,
          size: gifResult.buffer.length,
          captureTime: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          method: 'pooled',
          browserPid: browserWrapper.pid,
          frameCount: gifResult.metadata.frameCount,
          duration: gifResult.metadata.duration,
          scrollDistance: gifResult.metadata.scrollDistance,
          note: actualFormat === 'png' ? 'Returned first frame as PNG (install GraphicsMagick for full GIF support)' : 'Animated GIF created successfully'
        }
      });
    }
    
    // Prepare screenshot options
    const screenshotOptions = {
      encoding: 'binary',
      type: config.format,
      fullPage: config.fullPage
    };
    
    // Add format-specific options
    if (config.format === 'jpeg' || config.format === 'webp') {
      screenshotOptions.quality = config.quality;
    }
    
    if (config.format === 'png' && config.omitBackground) {
      screenshotOptions.omitBackground = true;
    }
    
    // Handle element-specific screenshot
    if (config.element) {
      const element = await page.$(config.element);
      if (!element) {
        throw new Error(`Element not found: ${config.element}`);
      }
      screenshotOptions.clip = await element.boundingBox();
    }
    
    // Handle custom clip region
    if (config.clip) {
      screenshotOptions.clip = config.clip;
    }
    
    // Take screenshot with timeout protection
    const screenshot = await Promise.race([
      page.screenshot(screenshotOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Screenshot timeout')), config.timeout)
      )
    ]);
    
    clearTimeout(pageTimeout);
    console.log(`[${requestId}] Screenshot captured successfully`);
    
    // Close page before returning browser to pool
    await browserWrapper.closePage(page);
    page = null;
    
    // Generate filename with format extension
    const timestamp = Date.now();
    const extension = config.format === 'jpeg' ? 'jpg' : config.format;
    const imageName = `thumbnail-${timestamp}.${extension}`;
    const imagePath = path.join(IMAGES_DIR, imageName);
    
    // Save screenshot
    fs.writeFileSync(imagePath, screenshot);
    
    // Get file size for metadata
    const stats = fs.statSync(imagePath);
    
    console.log(`[${requestId}] Screenshot saved: ${imageName}`);
    
    // Respond with success
    res.status(200).json({
      image: imageName,
      url: `https://images.sitelaunch.io/images/${imageName}`,
      metadata: {
        width: config.width,
        height: config.height,
        format: config.format,
        size: stats.size,
        captureTime: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        method: 'pooled',
        browserPid: browserWrapper.pid
      }
    });
    
  } catch (error) {
    console.error(`[${requestId}] Screenshot error:`, error);
    
    // Mark browser as unhealthy if we have one
    if (browserWrapper) {
      browserWrapper.isHealthy = false;
    }
    
    res.status(500).json({ 
      error: 'Failed to capture the screenshot',
      details: error.message,
      requestId 
    });
  } finally {
    // Comprehensive cleanup
    try {
      if (pageTimeout) clearTimeout(pageTimeout);
      
      if (page && browserWrapper) {
        await browserWrapper.closePage(page);
      }
      
      if (browserWrapper) {
        await returnBrowser(browserWrapper);
      }
    } catch (cleanupError) {
      console.error(`[${requestId}] Cleanup error:`, cleanupError);
      
      // Force cleanup if normal cleanup fails
      if (browserWrapper) {
        activeBrowsers.delete(browserWrapper.browser);
        browserWrapper.close().catch(() => {});
      }
    }
    
    console.log(`[${requestId}] Request completed in ${Date.now() - startTime}ms`);
  }
});

// Comprehensive shutdown handlers
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    shutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    // Don't exit on unhandled rejection, just log it
});

async function shutdown() {
    console.log('Shutting down gracefully...');
    
    // Clear intervals
    if (memoryMonitorInterval) clearInterval(memoryMonitorInterval);
    if (cleanupInterval) clearInterval(cleanupInterval);
    
    // Force cleanup all resources
    await forceCleanup();
    
    console.log('Shutdown complete');
    process.exit(0);
}

// Start monitoring and cleanup intervals
function startMonitoring() {
    // Memory monitoring
    memoryMonitorInterval = setInterval(monitorMemory, MEMORY_CHECK_INTERVAL);
    
    // Periodic cleanup
    cleanupInterval = setInterval(async () => {
        try {
            await cleanExpiredBrowsers();
            
            // Aggressive cleanup if too many browsers
            if (activeBrowsers.size > MAX_CONCURRENT_BROWSERS * 3) {
                console.warn('Too many active browsers, forcing cleanup');
                await forceCleanup();
            }
        } catch (error) {
            console.error('Cleanup interval error:', error);
        }
    }, FORCE_CLEANUP_INTERVAL);
}

// Initialize browser pool and start server with comprehensive setup
(async () => {
    try {
        console.log('Initializing screenshot server...');
        
        // Initialize browser pool
        await initializeBrowserPool();
        console.log(`Initialized ${browserPool.length} browsers in pool`);
        
        // Start monitoring
        startMonitoring();
        console.log('Started memory and cleanup monitoring');
        
        // Start server
        const server = app.listen(port, () => {
            console.log(`Screenshot server listening at http://localhost:${port}`);
            console.log(`API documentation available at http://localhost:${port}/docs`);
            console.log(`Health check available at http://localhost:${port}/health`);
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use. Please stop the existing process or use a different port.`);
                process.exit(1);
            } else {
                console.error('Server error:', err);
                process.exit(1);
            }
        });
        
        // Handle server close
        server.on('close', () => {
            console.log('Server closed');
            shutdown();
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();
