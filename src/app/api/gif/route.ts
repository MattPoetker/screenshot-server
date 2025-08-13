import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import Screenshot from '@/lib/models/Screenshot'
import { authenticateApiKey, checkRateLimit } from '@/lib/auth/middleware'
import { getBrowser, returnBrowser } from '@/lib/screenshot/capture'
import type { BrowserWrapper } from '@/lib/browser/BrowserPool'
import { GifGenerationService, type GifConfig } from '@/lib/gif/GifGenerationService'
import { trackScreenshotUsage, checkUsageLimit } from '@/lib/stripe/usage'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { IMAGES_DIR, ensureImagesDir } from '@/lib/config/storage'

export async function POST(request: NextRequest) {
    const startTime = Date.now()
    let screenshotData: any = null

    try {
        await initializeDatabase()
        
        // Authenticate API key
        const authResult = await authenticateApiKey(request)
        if (!authResult.success) {
            return NextResponse.json({ 
                error: authResult.error 
            }, { status: 401 })
        }

        const apiKey = authResult.apiKey!

        // Check rate limits (GIFs are more resource intensive)
        const rateLimitResult = await checkRateLimit(apiKey)
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ 
                error: 'Rate limit exceeded',
                details: 'Too many requests. Please try again later.',
                rateLimit: {
                    limit: apiKey.rate_limit,
                    remaining: rateLimitResult.remaining,
                    resetTime: new Date(rateLimitResult.resetTime).toISOString()
                }
            }, { 
                status: 429,
                headers: {
                    'X-RateLimit-Limit': apiKey.rate_limit.toString(),
                    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                    'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime / 1000).toString()
                }
            })
        }

        // Check usage limits 
        const usageLimitResult = await checkUsageLimit(apiKey.created_by)
        if (!usageLimitResult.allowed) {
            return NextResponse.json({ 
                error: 'Usage limit exceeded',
                details: 'Monthly screenshot limit reached. Please upgrade your plan or wait for the next billing cycle.',
                usage: usageLimitResult.usage
            }, { status: 429 })
        }

        // Parse request body
        const config: GifConfig & { url: string } = await request.json()

        // Validate required fields
        if (!config.url) {
            return NextResponse.json({ 
                error: 'URL is required',
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }, { status: 400 })
        }

        // Validate URL format
        try {
            new URL(config.url)
        } catch {
            return NextResponse.json({ 
                error: 'Invalid URL format',
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }, { status: 400 })
        }

        // Initialize GIF service and validate config
        const gifService = new GifGenerationService()
        const validationErrors = gifService.validateGifConfig(config)
        
        if (validationErrors.length > 0) {
            return NextResponse.json({ 
                error: 'Invalid GIF configuration',
                details: validationErrors,
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }, { status: 400 })
        }

        // Get browser and create page
        let browserWrapper: BrowserWrapper | null = null
        let page: any = null

        try {
            browserWrapper = await getBrowser()
            page = await browserWrapper.getPage()

            // Set viewport
            await page.setViewport({
                width: config.width || 1366,
                height: config.height || 768,
                deviceScaleFactor: 1
            })

            // Navigate to page
            await page.goto(config.url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            })

            // Generate GIF
            const gifResult = await gifService.generateScrollingGif(page, config)
            const processingTime = Date.now() - startTime

            // Generate filename (match original Express.js format)
            const timestamp = Date.now()
            const actualFormat = gifResult.buffer.length > 0 && gifResult.buffer[0] === 0x47 && gifResult.buffer[1] === 0x49 ? 'gif' : 'png'
            const filename = actualFormat === 'gif' ? `scrolling-${timestamp}.gif` : `scrolling-fallback-${timestamp}.png`
            
            // Ensure images directory exists
            ensureImagesDir()
            
            const gifPath = path.join(IMAGES_DIR, filename)

            // Save GIF/PNG file
            await fs.writeFile(gifPath, gifResult.buffer)

            // Prepare screenshot data for database
            const publicUrl = `https://images.sitelaunch.io/images/${filename}`
            screenshotData = {
                api_key_id: apiKey.id,
                url: config.url,
                image_path: gifPath,
                file_name: filename,
                format: 'gif' as any, // TypeScript workaround
                width: config.width || 1366,
                height: config.height || 768,
                success: true,
                processing_time_ms: processingTime,
                file_size: gifResult.metadata.size,
                request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_agent: request.headers.get('user-agent') || undefined,
                ip_address: request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           undefined,
                // Storage metadata (GIF still uses local storage for now)
                storage_provider: 'local',
                storage_url: gifPath,
                public_url: publicUrl,
                cdn_url: publicUrl,
                metadata: {
                    ...gifResult.metadata,
                    captureType: 'scrolling-gif',
                    method: 'next-js-api',
                    scrollDistance: gifResult.metadata.scrollDistance,
                    frameCount: gifResult.metadata.frameCount,
                    duration: gifResult.metadata.duration
                }
            }

            // Save to database
            await Screenshot.create(screenshotData)

            // Track usage for billing
            try {
                await trackScreenshotUsage({
                    userId: apiKey.created_by,
                    apiKeyId: apiKey.id,
                    screenshotCount: 1
                })
            } catch (error) {
                console.error('Failed to track GIF usage:', error)
                // Don't fail the request if usage tracking fails
            }

            // Return success response
            const response = {
                image: filename,
                url: `https://images.sitelaunch.io/images/${filename}`,
                metadata: {
                    width: config.width || 1366,
                    height: config.height || 768,
                    format: 'gif',
                    size: gifResult.metadata.size,
                    frameCount: gifResult.metadata.frameCount,
                    duration: gifResult.metadata.duration,
                    scrollDistance: gifResult.metadata.scrollDistance,
                    captureTime: new Date().toISOString(),
                    processingTime,
                    method: 'next-js-api'
                }
            }

            // Get updated rate limit info after consuming one request
            const updatedRateLimitResult = await checkRateLimit(apiKey)
            
            return NextResponse.json(response, {
                headers: {
                    'X-RateLimit-Limit': apiKey.rate_limit.toString(),
                    'X-RateLimit-Remaining': Math.max(0, updatedRateLimitResult.remaining - 1).toString(),
                    'X-RateLimit-Reset': Math.floor(updatedRateLimitResult.resetTime / 1000).toString()
                }
            })

        } finally {
            // Clean up browser resources
            if (page && browserWrapper) {
                await browserWrapper.closePage(page)
            }
            
            if (browserWrapper) {
                await returnBrowser(browserWrapper)
            }
        }

    } catch (error) {
        console.error('GIF generation API error:', error)
        const processingTime = Date.now() - startTime

        // Log failed gif generation to database if we have the data
        if (screenshotData) {
            try {
                await Screenshot.create({
                    ...screenshotData,
                    success: false,
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                    processing_time_ms: processingTime
                })
            } catch (dbError) {
                console.error('Failed to log error to database:', dbError)
            }
        }

        return NextResponse.json({ 
            error: 'Failed to generate scrolling GIF',
            details: error instanceof Error ? error.message : 'Unknown error',
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }, { status: 500 })
    }
}