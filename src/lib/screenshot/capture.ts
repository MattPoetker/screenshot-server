import puppeteer, { Browser, Page, ScreenshotOptions, HTTPRequest } from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import type { ScreenshotRequest } from '@/types'
import { getDevicePreset } from '@/lib/config/devicePresets'
import { BrowserPool, BrowserWrapper } from '@/lib/browser/BrowserPool'
import { IMAGES_DIR, ensureImagesDir } from '@/lib/config/storage'

const BROWSER_TIMEOUT = 30000

interface ScreenshotResult {
    filename: string
    imagePath: string
    publicUrl: string
    metadata: {
        width: number
        height: number
        format: string
        size: number
    }
}

export async function getBrowser(): Promise<BrowserWrapper> {
    const browserPool = BrowserPool.getInstance()
    return await browserPool.getBrowser()
}

export async function returnBrowser(browserWrapper: BrowserWrapper): Promise<void> {
    const browserPool = BrowserPool.getInstance()
    await browserPool.returnBrowser(browserWrapper)
}

export async function takeScreenshot(config: ScreenshotRequest): Promise<ScreenshotResult> {
    let browserWrapper: BrowserWrapper | null = null
    let page: Page | null = null

    try {
        // Get browser from pool
        browserWrapper = await getBrowser()
        page = await browserWrapper.getPage()

        // Apply device preset if specified
        let deviceConfig = {
            width: config.width || 1366,
            height: config.height || 768,
            devicePixelRatio: config.devicePixelRatio || 1,
            userAgent: config.userAgent,
            isMobile: config.isMobile || false,
            hasTouch: config.hasTouch || false
        }

        if (config.device) {
            const preset = getDevicePreset(config.device)
            if (preset) {
                deviceConfig = {
                    width: config.width || preset.width,
                    height: config.height || preset.height,
                    devicePixelRatio: config.devicePixelRatio || preset.devicePixelRatio,
                    userAgent: config.userAgent || preset.userAgent,
                    isMobile: config.isMobile ?? preset.isMobile ?? false,
                    hasTouch: config.hasTouch ?? preset.hasTouch ?? false
                }
            }
        }

        // Set viewport with device configuration
        await page.setViewport({
            width: deviceConfig.width,
            height: deviceConfig.height,
            deviceScaleFactor: deviceConfig.devicePixelRatio,
            isMobile: deviceConfig.isMobile,
            hasTouch: deviceConfig.hasTouch
        })

        // Set user agent if specified
        if (deviceConfig.userAgent) {
            await page.setUserAgent(deviceConfig.userAgent)
        }

        // Set custom headers if specified
        if (config.headers) {
            await page.setExtraHTTPHeaders(config.headers)
        }

        // Set cookies if specified
        if (config.cookies && config.cookies.length > 0) {
            await page.setCookie(...config.cookies.map(cookie => ({
                ...cookie,
                url: config.url
            })))
        }

        // Set up authentication if specified
        if (config.authentication) {
            await page.authenticate({
                username: config.authentication.username,
                password: config.authentication.password
            })
        }

        // Set up resource blocking if specified
        if (config.blockResources && config.blockResources.length > 0) {
            await page.setRequestInterception(true)
            page.on('request', (request: HTTPRequest) => {
                const resourceType = request.resourceType()
                if (config.blockResources!.includes(resourceType)) {
                    request.abort()
                } else {
                    request.continue()
                }
            })
        }

        // Disable JavaScript if specified
        if (config.disableJavascript) {
            await page.setJavaScriptEnabled(false)
        }

        // Navigate to page
        await page.goto(config.url, {
            waitUntil: config.waitUntil || 'networkidle2',
            timeout: config.timeout || BROWSER_TIMEOUT
        })

        // Hide elements if specified
        if (config.hideElements && config.hideElements.length > 0) {
            await page.addStyleTag({
                content: config.hideElements.map(selector => 
                    `${selector} { visibility: hidden !important; }`
                ).join(' ')
            })
        }

        // Add delay if specified
        if (config.delay) {
            await new Promise(resolve => setTimeout(resolve, config.delay))
        }

        // Generate filename (match original Express.js format)
        const timestamp = Date.now()
        const format = config.format || 'png'
        const extension = format === 'jpeg' ? 'jpg' : format
        const filename = `thumbnail-${timestamp}.${extension}`
        
        // Ensure images directory exists
        ensureImagesDir()
        
        const imagePath = path.join(IMAGES_DIR, filename)

        // Take screenshot
        const screenshotOptions: ScreenshotOptions = {
            path: imagePath as `${string}.png` | `${string}.jpeg` | `${string}.webp`,
            fullPage: config.fullPage !== false,
            type: format as 'png' | 'jpeg' | 'webp'
        }

        if (format === 'jpeg' && config.quality) {
            screenshotOptions.quality = Math.min(100, Math.max(0, config.quality))
        }

        await page.screenshot(screenshotOptions)

        // Get file stats
        const stats = await fs.stat(imagePath)
        const size = stats.size

        return {
            filename,
            imagePath,
            publicUrl: `https://images.sitelaunch.io/images/${filename}`,
            metadata: {
                width: deviceConfig.width,
                height: deviceConfig.height,
                format,
                size
            }
        }

    } finally {
        // Clean up
        if (page && browserWrapper) {
            await browserWrapper.closePage(page)
        }

        if (browserWrapper) {
            await returnBrowser(browserWrapper)
        }
    }
}

// Browser cleanup is handled by BrowserPool singleton