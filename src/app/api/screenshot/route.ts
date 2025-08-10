import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import Screenshot from '@/lib/models/Screenshot'
import { authenticateApiKey, checkRateLimit } from '@/lib/auth/middleware'
import { takeScreenshot } from '@/lib/screenshot/capture'
import { trackScreenshotUsage, checkUsageLimit } from '@/lib/stripe/usage'
import dbManager from '@/lib/db'
import type { ScreenshotRequest, ScreenshotResponse } from '@/types'

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

        // Check rate limits
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

        // Check usage limits (for free tier, we'll enforce hard limits)
        const usageLimitResult = await checkUsageLimit(apiKey.created_by)
        if (!usageLimitResult.allowed) {
            return NextResponse.json({ 
                error: 'Usage limit exceeded',
                details: 'Monthly screenshot limit reached. Please upgrade your plan or wait for the next billing cycle.',
                usage: usageLimitResult.usage
            }, { status: 429 })
        }

        // Parse request body
        const config: ScreenshotRequest = await request.json()

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

        // Validate format
        const validFormats = ['png', 'jpeg', 'webp']
        if (config.format && !validFormats.includes(config.format)) {
            return NextResponse.json({ 
                error: `Format must be ${validFormats.join(', ')} for screenshots`,
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }, { status: 400 })
        }

        // Take screenshot
        const result = await takeScreenshot(config)
        const processingTime = Date.now() - startTime

        // Prepare screenshot data for database
        screenshotData = {
            api_key_id: apiKey.id,
            url: config.url,
            image_path: result.imagePath, // Maps to file_path
            file_name: result.filename,
            format: config.format || 'png',
            width: result.metadata.width,
            height: result.metadata.height,
            success: true,
            processing_time_ms: processingTime,
            file_size: result.metadata.size,
            request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_agent: request.headers.get('user-agent') || undefined,
            ip_address: request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       undefined,
            metadata: {
                ...result.metadata,
                processingTime,
                method: 'next-js-api'
            }
        }

        // Save to database
        await Screenshot.create(screenshotData)

        // Usage is now automatically tracked by querying screenshots table directly
        // No separate billing cycle updates needed

        // Return success response
        const response: ScreenshotResponse = {
            image: result.filename,
            url: result.publicUrl,
            metadata: {
                width: result.metadata.width,
                height: result.metadata.height,
                format: result.metadata.format,
                size: result.metadata.size,
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

    } catch (error) {
        console.error('NiceShot API error:', error)
        const processingTime = Date.now() - startTime

        // Log failed screenshot to database if we have the data
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
            error: 'Failed to capture the screenshot',
            details: error instanceof Error ? error.message : 'Unknown error',
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }, { status: 500 })
    }
}